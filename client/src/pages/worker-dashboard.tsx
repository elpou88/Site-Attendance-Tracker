import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/language";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  LogIn,
  LogOut,
  MapPin,
  Camera,
  Send,
  Clock,
  FileText,
  Navigation,
  RefreshCw,
  MapPinOff,
  ExternalLink,
  Loader2,
  MessageCircle,
  CalendarDays,
  Stethoscope,
  CheckCircle2,
  XCircle,
  HourglassIcon,
} from "lucide-react";
import type { Attendance, FeedEntry, ChatMessage, User, LeaveRequest } from "@shared/schema";
import { format } from "date-fns";
import resolveLogoPath from "@assets/Resolve_Construction_Ltd._Logo_1772117575893.jpg";

type GpsStatus = "idle" | "loading" | "success" | "denied" | "unavailable" | "error";

function useGpsLocation(t: any) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [status, setStatus] = useState<GpsStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const requestLocation = useCallback((): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setStatus("unavailable");
        setErrorMessage(t.gpsUnavailable);
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
              setErrorMessage(t.gpsPermissionDenied);
              break;
            case err.POSITION_UNAVAILABLE:
              setStatus("unavailable");
              setErrorMessage(t.gpsSignalUnavailable);
              break;
            case err.TIMEOUT:
              setStatus("error");
              setErrorMessage(t.gpsTimeout);
              break;
            default:
              setStatus("error");
              setErrorMessage(t.gpsError);
          }
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
      );
    });
  }, [t]);

  return { location, status, errorMessage, requestLocation };
}

function GpsStatusDisplay({ status, errorMessage, location, t }: {
  status: GpsStatus;
  errorMessage: string | null;
  location: { lat: number; lng: number } | null;
  t: any;
}) {
  if (status === "loading") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="gps-loading">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>{t.gettingLocation}</span>
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
        <span>{location.lat.toFixed(5)}, {location.lng.toFixed(5)}</span>
        <a
          href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary hover:underline"
          data-testid="link-view-map"
        >
          <ExternalLink className="w-3 h-3" />
          {t.viewMap}
        </a>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="gps-idle">
      <Navigation className="w-3.5 h-3.5" />
      <span>{t.gpsWillBeRecorded}</span>
    </div>
  );
}

function LeaveRequestStatusBadge({ status, t }: { status: string; t: any }) {
  if (status === "approved") return <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs"><CheckCircle2 className="w-3 h-3 mr-1" />{t.approved}</Badge>;
  if (status === "rejected") return <Badge variant="destructive" className="text-xs"><XCircle className="w-3 h-3 mr-1" />{t.rejected}</Badge>;
  return <Badge variant="secondary" className="text-xs"><HourglassIcon className="w-3 h-3 mr-1" />{t.pending}</Badge>;
}

export default function WorkerDashboard() {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const { toast } = useToast();
  const [note, setNote] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const gps = useGpsLocation(t);

  const [leaveType, setLeaveType] = useState<"annual_leave" | "sick_note">("annual_leave");
  const [leaveStartDate, setLeaveStartDate] = useState("");
  const [leaveEndDate, setLeaveEndDate] = useState("");
  const [leaveNotes, setLeaveNotes] = useState("");
  const [sickNoteFile, setSickNoteFile] = useState<File | null>(null);
  const [sickNotePreview, setSickNotePreview] = useState<string | null>(null);

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

  type LeaveRequestWithUser = LeaveRequest & { user?: Omit<User, "password"> };
  const { data: myLeaveRequests = [] } = useQuery<LeaveRequestWithUser[]>({
    queryKey: ["/api/leave-requests/mine"],
  });

  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

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
      if (!loc) loc = await gps.requestLocation();
      const res = await apiRequest("POST", "/api/attendance/sign-in", {
        lat: loc?.lat ?? null,
        lng: loc?.lng ?? null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/status"] });
      toast({
        title: t.clockedIn,
        description: gps.location ? t.clockedInWithGps : t.clockedInNoGps,
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
        title: t.clockedOut,
        description: gps.location ? t.clockedOutWithGps : t.clockedOutNoGps,
      });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: async () => {
      const loc = await gps.requestLocation();
      if (!loc) throw new Error(t.gpsError);
      const res = await apiRequest("POST", "/api/attendance/update-location", { lat: loc.lat, lng: loc.lng });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/status"] });
      toast({ title: t.locationUpdated, description: t.locationUpdatedDesc });
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
      const res = await fetch("/api/feed", { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) throw new Error("Error posting update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feed/mine"] });
      setNote("");
      setSelectedFile(null);
      setPreviewUrl(null);
      toast({ title: t.updatePosted, description: t.updatePostedDesc });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const leaveRequestMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("type", leaveType);
      formData.append("startDate", leaveStartDate);
      formData.append("endDate", leaveEndDate);
      if (leaveNotes) formData.append("notes", leaveNotes);
      if (leaveType === "sick_note" && sickNoteFile) formData.append("photo", sickNoteFile);
      const res = await fetch("/api/leave-requests", { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to submit request");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests/mine"] });
      setLeaveStartDate("");
      setLeaveEndDate("");
      setLeaveNotes("");
      setSickNoteFile(null);
      setSickNotePreview(null);
      toast({ title: t.requestSubmitted, description: t.requestSubmittedDesc });
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

  const handleSickNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSickNoteFile(file);
      setSickNotePreview(URL.createObjectURL(file));
    }
  };

  const isSignedIn = attendanceStatus?.signedIn;
  const activeAttendance = attendanceStatus?.attendance;

  const pendingRequests = myLeaveRequests.filter((r) => r.status === "pending").length;

  return (
    <div className="min-h-screen" style={{background: "linear-gradient(160deg, #fff7ed 0%, #ffedd5 50%, #fed7aa 100%)"}}>
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <img src={resolveLogoPath} alt="Resolve Construction" className="h-9 w-auto object-contain" />
            <div>
              <p className="font-semibold text-sm leading-tight" data-testid="text-worker-name">{user?.fullName}</p>
              <p className="text-xs text-muted-foreground">{t.workerPortal}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 bg-muted rounded-full px-1.5 py-1">
              <button
                onClick={() => setLang("en")}
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-all ${lang === "en" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                data-testid="button-lang-en"
              >EN</button>
              <button
                onClick={() => setLang("es")}
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-all ${lang === "es" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                data-testid="button-lang-es"
              >ES</button>
            </div>
            <Button variant="secondary" size="sm" onClick={() => logout()} data-testid="button-logout">
              <LogOut className="w-4 h-4 mr-1" />
              {t.logout}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-muted-foreground" />
                <h2 className="font-semibold">{t.yourLocation}</h2>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => gps.requestLocation()}
                disabled={gps.status === "loading"}
                data-testid="button-refresh-gps"
              >
                {gps.status === "loading" ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
                {gps.status === "loading" ? t.gettingLocation : t.refreshGps}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <GpsStatusDisplay status={gps.status} errorMessage={gps.errorMessage} location={gps.location} t={t} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <h2 className="font-semibold">{t.attendance}</h2>
              </div>
              <Badge variant={isSignedIn ? "default" : "secondary"} data-testid="badge-status">
                {isSignedIn ? t.onSite : t.offSite}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isSignedIn && activeAttendance && (
              <div className="rounded-md bg-muted/50 p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span>{t.clockedInAt} <span className="font-medium">{format(new Date(activeAttendance.signInTime), "HH:mm")}</span></span>
                </div>
                {activeAttendance.signInLat ? (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-3.5 h-3.5 text-green-600 shrink-0" />
                    <span>{t.registeredAt}: {activeAttendance.signInLat.toFixed(5)}, {activeAttendance.signInLng?.toFixed(5)}</span>
                    <a
                      href={`https://www.google.com/maps?q=${activeAttendance.signInLat},${activeAttendance.signInLng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                      data-testid="link-signin-map"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {t.viewOnMap}
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPinOff className="w-3.5 h-3.5 shrink-0" />
                    <span>{t.noGpsOnEntry}</span>
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
                  {updateLocationMutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
                  {updateLocationMutation.isPending ? t.updatingLocation : t.updateMyLocation}
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
                {signInMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t.clockingIn}</> : <><LogIn className="w-4 h-4 mr-2" />{t.clockIn}</>}
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                disabled={!isSignedIn || signOutMutation.isPending}
                onClick={() => signOutMutation.mutate()}
                data-testid="button-sign-out"
              >
                {signOutMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t.clockingOut}</> : <><LogOut className="w-4 h-4 mr-2" />{t.clockOut}</>}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-semibold">{t.leaveRequests}</h2>
              {pendingRequests > 0 && (
                <Badge variant="secondary" className="ml-auto text-xs">{pendingRequests} {t.pending}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
              <h3 className="text-sm font-medium">{t.submitLeaveRequest}</h3>
              <div className="space-y-2">
                <Label className="text-xs">{t.requestType}</Label>
                <Select value={leaveType} onValueChange={(v) => setLeaveType(v as any)}>
                  <SelectTrigger data-testid="select-leave-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual_leave">
                      <span className="flex items-center gap-2"><CalendarDays className="w-3.5 h-3.5 text-blue-500" />{t.annualLeave}</span>
                    </SelectItem>
                    <SelectItem value="sick_note">
                      <span className="flex items-center gap-2"><Stethoscope className="w-3.5 h-3.5 text-red-500" />{t.sickNote}</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">{t.startDate}</Label>
                  <Input type="date" value={leaveStartDate} onChange={(e) => setLeaveStartDate(e.target.value)} data-testid="input-leave-start" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">{t.endDate}</Label>
                  <Input type="date" value={leaveEndDate} onChange={(e) => setLeaveEndDate(e.target.value)} data-testid="input-leave-end" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">{t.additionalNotes}</Label>
                <Textarea
                  placeholder={t.additionalNotes}
                  value={leaveNotes}
                  onChange={(e) => setLeaveNotes(e.target.value)}
                  className="resize-none"
                  rows={2}
                  data-testid="input-leave-notes"
                />
              </div>
              {leaveType === "sick_note" && (
                <div className="space-y-2">
                  <Label className="text-xs">{t.sickNotePhoto}</Label>
                  <div className="flex items-center gap-2">
                    <label htmlFor="sick-note-upload" className="cursor-pointer">
                      <Button variant="outline" size="sm" asChild>
                        <span>
                          <Camera className="w-3.5 h-3.5 mr-1" />
                          {sickNoteFile ? t.changeSickNote : t.attachSickNote}
                        </span>
                      </Button>
                    </label>
                    <input
                      id="sick-note-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleSickNoteChange}
                      data-testid="input-sick-note-file"
                    />
                    {sickNoteFile && <span className="text-xs text-muted-foreground truncate max-w-[120px]">{sickNoteFile.name}</span>}
                  </div>
                  {sickNotePreview && (
                    <div className="relative">
                      <img src={sickNotePreview} alt="Sick note preview" className="w-full max-h-40 object-cover rounded-md border" />
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => { setSickNoteFile(null); setSickNotePreview(null); }}
                      >
                        {t.remove}
                      </Button>
                    </div>
                  )}
                </div>
              )}
              <Button
                className="w-full"
                disabled={!leaveStartDate || !leaveEndDate || leaveRequestMutation.isPending}
                onClick={() => leaveRequestMutation.mutate()}
                data-testid="button-submit-leave"
              >
                {leaveRequestMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t.submitting}</> : <><Send className="w-4 h-4 mr-2" />{t.submitRequest}</>}
              </Button>
            </div>

            {myLeaveRequests.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t.myRequests}</h3>
                {myLeaveRequests.map((req) => (
                  <div key={req.id} className="border rounded-md p-3 space-y-1.5 bg-card" data-testid={`leave-request-${req.id}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {req.type === "annual_leave" ? (
                          <CalendarDays className="w-3.5 h-3.5 text-blue-500" />
                        ) : (
                          <Stethoscope className="w-3.5 h-3.5 text-red-500" />
                        )}
                        <span className="text-sm font-medium">
                          {req.type === "annual_leave" ? t.annualLeave : t.sickNote}
                        </span>
                      </div>
                      <LeaveRequestStatusBadge status={req.status} t={t} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t.from}: {req.startDate} — {t.to}: {req.endDate}
                    </p>
                    {req.notes && <p className="text-xs text-muted-foreground">{req.notes}</p>}
                    {req.adminNote && (
                      <p className="text-xs italic text-muted-foreground border-l-2 pl-2 border-muted-foreground/30">
                        {t.adminNote}: {req.adminNote}
                      </p>
                    )}
                    {req.photoUrl && (
                      <a href={req.photoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                        <Camera className="w-3 h-3" />{t.viewSickNote}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {myLeaveRequests.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">{t.noRequestsYet}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-muted-foreground" />
                <h2 className="font-semibold">{t.teamChat}</h2>
              </div>
              <Badge variant="secondary" data-testid="badge-chat-count">{chatMessages.length} {t.messages}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div
              className="h-72 overflow-y-auto border rounded-md p-3 space-y-3 bg-muted/20"
              data-testid="chat-messages-container"
            >
              {chatMessages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground">{t.noMessages}</p>
                </div>
              )}
              {chatMessages.map((msg) => {
                const isMe = msg.userId === user?.id;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`} data-testid={`chat-message-${msg.id}`}>
                    <div className={`max-w-[80%] rounded-lg px-3 py-2 ${isMe ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      {!isMe && <p className="text-xs font-semibold mb-0.5" data-testid={`chat-sender-${msg.id}`}>{msg.user?.fullName || t.unknown}</p>}
                      <p className="text-sm" data-testid={`chat-text-${msg.id}`}>{msg.message}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-0.5 px-1">{format(new Date(msg.createdAt), "HH:mm")}</span>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (chatInput.trim()) chatMutation.mutate(chatInput.trim());
              }}
              className="flex gap-2"
            >
              <Input
                placeholder={t.typeMessage}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={chatMutation.isPending}
                data-testid="input-chat-message"
              />
              <Button type="submit" size="sm" disabled={!chatInput.trim() || chatMutation.isPending} data-testid="button-send-chat">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-semibold">{t.dailyUpdate}</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder={t.whatDidYouWork}
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
                      {selectedFile ? t.changePhoto : t.addPhoto}
                    </span>
                  </Button>
                </label>
                <input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} data-testid="input-file" />
                {selectedFile && <span className="text-xs text-muted-foreground">{selectedFile.name}</span>}
              </div>
              <Button
                size="sm"
                disabled={(!note && !selectedFile) || feedMutation.isPending}
                onClick={() => feedMutation.mutate()}
                data-testid="button-post-update"
              >
                <Send className="w-4 h-4 mr-1" />
                {feedMutation.isPending ? t.posting : t.post}
              </Button>
            </div>
            {previewUrl && (
              <div className="relative rounded-md">
                <img src={previewUrl} alt="Preview" className="w-full max-h-48 object-cover rounded-md" data-testid="img-preview" />
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                  data-testid="button-remove-photo"
                >
                  {t.remove}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {feedEntries.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">{t.yourUpdates}</h2>
            {feedEntries.map((entry) => (
              <Card key={entry.id} data-testid={`feed-entry-${entry.id}`}>
                <CardContent className="pt-4 space-y-2">
                  <p className="text-xs text-muted-foreground">{format(new Date(entry.createdAt), "d MMM, HH:mm")}</p>
                  {entry.note && <p className="text-sm leading-relaxed">{entry.note}</p>}
                  {entry.imageUrl && (
                    <img src={entry.imageUrl} alt="Work update" className="w-full rounded-md object-cover max-h-48" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
