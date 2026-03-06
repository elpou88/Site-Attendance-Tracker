import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  LogIn,
  LogOut,
  MapPin,
  Camera,
  Send,
  Clock,
  FileText,
  ImageIcon,
  Navigation,
  RefreshCw,
  MapPinOff,
  ExternalLink,
  Loader2,
  MessageCircle,
} from "lucide-react";
import type { Attendance, FeedEntry, ChatMessage, User } from "@shared/schema";
import { format } from "date-fns";
import resolveLogoPath from "@assets/Resolve_Construction_Ltd._Logo_1772117575893.jpg";

type GpsStatus = "idle" | "loading" | "success" | "denied" | "unavailable" | "error";

function useGpsLocation() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [status, setStatus] = useState<GpsStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const requestLocation = useCallback((): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setStatus("unavailable");
        setErrorMessage("GPS is not supported on this device");
        resolve(null);
        return;
      }

      setStatus("loading");
      setErrorMessage(null);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLocation(loc);
          setStatus("success");
          setErrorMessage(null);
          resolve(loc);
        },
        (err) => {
          setLocation(null);
          switch (err.code) {
            case err.PERMISSION_DENIED:
              setStatus("denied");
              setErrorMessage("Location access denied. Please enable GPS in your browser settings.");
              break;
            case err.POSITION_UNAVAILABLE:
              setStatus("unavailable");
              setErrorMessage("GPS signal unavailable. Please try again outside or in a different location.");
              break;
            case err.TIMEOUT:
              setStatus("error");
              setErrorMessage("Location request timed out. Please try again.");
              break;
            default:
              setStatus("error");
              setErrorMessage("Unable to get location. Please try again.");
          }
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
      );
    });
  }, []);

  return { location, status, errorMessage, requestLocation };
}

function GpsStatusDisplay({
  status,
  errorMessage,
  location,
}: {
  status: GpsStatus;
  errorMessage: string | null;
  location: { lat: number; lng: number } | null;
}) {
  if (status === "loading") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="gps-loading">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>Getting your location...</span>
      </div>
    );
  }

  if (status === "denied" || status === "unavailable" || status === "error") {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive" data-testid="gps-error">
        <MapPinOff className="w-3.5 h-3.5 shrink-0" />
        <span>{errorMessage}</span>
      </div>
    );
  }

  if (status === "success" && location) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="gps-success">
        <MapPin className="w-3.5 h-3.5 text-green-600 shrink-0" />
        <span>
          Location: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
        </span>
        <a
          href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary hover:underline"
          data-testid="link-view-map"
        >
          <ExternalLink className="w-3 h-3" />
          Map
        </a>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="gps-idle">
      <Navigation className="w-3.5 h-3.5" />
      <span>GPS location will be captured when you sign in</span>
    </div>
  );
}

export default function WorkerDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [note, setNote] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const gps = useGpsLocation();

  const { data: attendanceStatus } = useQuery<{
    signedIn: boolean;
    attendance: Attendance | null;
  }>({
    queryKey: ["/api/attendance/status"],
    refetchInterval: 30000,
  });

  const { data: feedEntries = [] } = useQuery<FeedEntry[]>({
    queryKey: ["/api/feed/mine"],
  });

  type ChatMessageWithUser = ChatMessage & { user?: Omit<User, "password"> };
  const { data: chatMessages = [] } = useQuery<ChatMessageWithUser[]>({
    queryKey: ["/api/chat"],
    refetchInterval: 5000,
  });

  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", "/api/chat", { message });
      return res.json();
    },
    onSuccess: () => {
      setChatInput("");
      queryClient.invalidateQueries({ queryKey: ["/api/chat"] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  useEffect(() => {
    gps.requestLocation();
  }, []);

  const signInMutation = useMutation({
    mutationFn: async () => {
      let loc = gps.location;
      if (!loc) {
        loc = await gps.requestLocation();
      }
      const res = await apiRequest("POST", "/api/attendance/sign-in", {
        lat: loc?.lat ?? null,
        lng: loc?.lng ?? null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/status"] });
      toast({
        title: "Signed In",
        description: gps.location
          ? "You have been signed in with your GPS location."
          : "You have been signed in (GPS location unavailable).",
      });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const signOutMutation = useMutation({
    mutationFn: async () => {
      const loc = await gps.requestLocation();
      const res = await apiRequest("POST", "/api/attendance/sign-out", {
        lat: loc?.lat ?? null,
        lng: loc?.lng ?? null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/status"] });
      toast({
        title: "Signed Out",
        description: gps.location
          ? "You have been signed out with your GPS location recorded."
          : "You have been signed out (GPS location unavailable).",
      });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: async () => {
      const loc = await gps.requestLocation();
      if (!loc) {
        throw new Error("Unable to get GPS location");
      }
      const res = await apiRequest("POST", "/api/attendance/update-location", {
        lat: loc.lat,
        lng: loc.lng,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/status"] });
      toast({ title: "Location Updated", description: "Your GPS location has been updated." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const feedMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      if (note) formData.append("note", note);
      if (selectedFile) formData.append("image", selectedFile);
      const res = await fetch("/api/feed", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to post update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feed/mine"] });
      setNote("");
      setSelectedFile(null);
      setPreviewUrl(null);
      toast({ title: "Update Posted", description: "Your daily update has been posted." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const isSignedIn = attendanceStatus?.signedIn;
  const activeAttendance = attendanceStatus?.attendance;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <img
              src={resolveLogoPath}
              alt="Resolve Construction"
              className="h-9 w-auto object-contain"
            />
            <div>
              <p className="font-semibold text-sm leading-tight" data-testid="text-worker-name">
                {user?.fullName}
              </p>
              <p className="text-xs text-muted-foreground">Worker Portal</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => logout()} data-testid="button-logout">
            <LogOut className="w-4 h-4 mr-1" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-muted-foreground" />
                <h2 className="font-semibold">Your Location</h2>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => gps.requestLocation()}
                disabled={gps.status === "loading"}
                data-testid="button-refresh-gps"
              >
                {gps.status === "loading" ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 mr-1" />
                )}
                {gps.status === "loading" ? "Getting..." : "Refresh GPS"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <GpsStatusDisplay
              status={gps.status}
              errorMessage={gps.errorMessage}
              location={gps.location}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <h2 className="font-semibold">Attendance</h2>
              </div>
              <Badge variant={isSignedIn ? "default" : "secondary"} data-testid="badge-status">
                {isSignedIn ? "On Site" : "Off Site"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isSignedIn && activeAttendance && (
              <div className="rounded-md bg-muted/50 p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span>
                    Signed in at{" "}
                    <span className="font-medium">
                      {format(new Date(activeAttendance.signInTime), "h:mm a")}
                    </span>
                  </span>
                </div>

                {activeAttendance.signInLat ? (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-3.5 h-3.5 text-green-600 shrink-0" />
                    <span>
                      Recorded at: {activeAttendance.signInLat.toFixed(5)},{" "}
                      {activeAttendance.signInLng?.toFixed(5)}
                    </span>
                    <a
                      href={`https://www.google.com/maps?q=${activeAttendance.signInLat},${activeAttendance.signInLng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                      data-testid="link-signin-map"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View on Map
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPinOff className="w-3.5 h-3.5 shrink-0" />
                    <span>No GPS location recorded at sign-in</span>
                  </div>
                )}

                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-1"
                  onClick={() => updateLocationMutation.mutate()}
                  disabled={updateLocationMutation.isPending || gps.status === "denied"}
                  data-testid="button-update-location"
                >
                  {updateLocationMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                  )}
                  {updateLocationMutation.isPending ? "Updating..." : "Update My Location"}
                </Button>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                className="flex-1"
                disabled={isSignedIn || signInMutation.isPending}
                onClick={() => signInMutation.mutate()}
                data-testid="button-sign-in"
              >
                {signInMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Getting GPS & Signing In...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                disabled={!isSignedIn || signOutMutation.isPending}
                onClick={() => signOutMutation.mutate()}
                data-testid="button-sign-out"
              >
                {signOutMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Getting GPS & Signing Out...
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-muted-foreground" />
                <h2 className="font-semibold">Team Chat</h2>
              </div>
              <Badge variant="secondary" data-testid="badge-chat-count">
                {chatMessages.length} messages
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div
              ref={chatContainerRef}
              className="h-72 overflow-y-auto border rounded-md p-3 space-y-3 bg-muted/20"
              data-testid="chat-messages-container"
            >
              {chatMessages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
                </div>
              )}
              {chatMessages.map((msg) => {
                const isMe = msg.userId === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    data-testid={`chat-message-${msg.id}`}
                  >
                    <div className={`max-w-[80%] rounded-lg px-3 py-2 ${isMe ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      {!isMe && (
                        <p className="text-xs font-semibold mb-0.5" data-testid={`chat-sender-${msg.id}`}>
                          {msg.user?.fullName || "Unknown"}
                        </p>
                      )}
                      <p className="text-sm" data-testid={`chat-text-${msg.id}`}>{msg.message}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-0.5 px-1">
                      {format(new Date(msg.createdAt), "h:mm a")}
                    </span>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (chatInput.trim()) {
                  chatMutation.mutate(chatInput.trim());
                }
              }}
              className="flex gap-2"
            >
              <Input
                placeholder="Type a message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={chatMutation.isPending}
                data-testid="input-chat-message"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!chatInput.trim() || chatMutation.isPending}
                data-testid="button-send-chat"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-semibold">Post Daily Update</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="What did you work on today? Describe your progress..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="resize-none"
              rows={3}
              data-testid="input-note"
            />
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Button variant="secondary" size="sm" asChild>
                    <span>
                      <Camera className="w-4 h-4 mr-1" />
                      {selectedFile ? "Change Photo" : "Add Photo"}
                    </span>
                  </Button>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                  data-testid="input-file"
                />
                {selectedFile && (
                  <span className="text-xs text-muted-foreground">{selectedFile.name}</span>
                )}
              </div>
              <Button
                size="sm"
                disabled={(!note && !selectedFile) || feedMutation.isPending}
                onClick={() => feedMutation.mutate()}
                data-testid="button-post-update"
              >
                <Send className="w-4 h-4 mr-1" />
                {feedMutation.isPending ? "Posting..." : "Post"}
              </Button>
            </div>
            {previewUrl && (
              <div className="relative rounded-md">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full max-h-48 object-cover rounded-md"
                  data-testid="img-preview"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  data-testid="button-remove-photo"
                >
                  Remove
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {feedEntries.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Your Updates
            </h2>
            {feedEntries.map((entry) => (
              <Card key={entry.id}>
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(entry.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </span>
                  </div>
                  {entry.note && (
                    <p className="text-sm leading-relaxed" data-testid={`text-feed-note-${entry.id}`}>
                      {entry.note}
                    </p>
                  )}
                  {entry.imageUrl && (
                    <img
                      src={entry.imageUrl}
                      alt="Work update"
                      className="w-full rounded-md object-cover max-h-64"
                      data-testid={`img-feed-${entry.id}`}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {feedEntries.length === 0 && (
          <div className="text-center py-8">
            <ImageIcon className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              No updates yet. Post your first daily update above!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
