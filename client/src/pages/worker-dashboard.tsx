import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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
} from "lucide-react";
import type { Attendance, FeedEntry } from "@shared/schema";
import { format } from "date-fns";
import resolveLogoPath from "@assets/Resolve_Construction_Ltd._Logo_1772117575893.jpg";

export default function WorkerDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [note, setNote] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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

  const getLocation = (): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { timeout: 10000 }
      );
    });
  };

  const signInMutation = useMutation({
    mutationFn: async () => {
      const location = await getLocation();
      const res = await apiRequest("POST", "/api/attendance/sign-in", {
        lat: location?.lat,
        lng: location?.lng,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/status"] });
      toast({ title: "Signed In", description: "You have been signed in for today." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const signOutMutation = useMutation({
    mutationFn: async () => {
      const location = await getLocation();
      const res = await apiRequest("POST", "/api/attendance/sign-out", {
        lat: location?.lat,
        lng: location?.lng,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/status"] });
      toast({ title: "Signed Out", description: "You have been signed out. Have a good evening!" });
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
                <Clock className="w-4 h-4 text-muted-foreground" />
                <h2 className="font-semibold">Attendance</h2>
              </div>
              <Badge variant={isSignedIn ? "default" : "secondary"} data-testid="badge-status">
                {isSignedIn ? "On Site" : "Off Site"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isSignedIn && attendanceStatus?.attendance && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" />
                <span>
                  Signed in at{" "}
                  {format(new Date(attendanceStatus.attendance.signInTime), "h:mm a")}
                </span>
                {attendanceStatus.attendance.signInLat && (
                  <span className="text-xs">
                    ({attendanceStatus.attendance.signInLat.toFixed(4)},{" "}
                    {attendanceStatus.attendance.signInLng?.toFixed(4)})
                  </span>
                )}
              </div>
            )}
            <div className="flex gap-3">
              <Button
                className="flex-1"
                disabled={isSignedIn || signInMutation.isPending}
                onClick={() => signInMutation.mutate()}
                data-testid="button-sign-in"
              >
                <LogIn className="w-4 h-4 mr-2" />
                {signInMutation.isPending ? "Signing In..." : "Sign In"}
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                disabled={!isSignedIn || signOutMutation.isPending}
                onClick={() => signOutMutation.mutate()}
                data-testid="button-sign-out"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {signOutMutation.isPending ? "Signing Out..." : "Sign Out"}
              </Button>
            </div>
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
