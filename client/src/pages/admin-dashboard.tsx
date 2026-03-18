import { useState, useEffect, useRef } from "react";
import { useAdmin } from "@/lib/auth";
import { useLanguage } from "@/lib/language";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  UserPlus,
  LogOut,
  MapPin,
  MapPinOff,
  Clock,
  Activity,
  FileText,
  Trash2,
  Eye,
  Copy,
  Briefcase,
  Calendar,
  HeartPulse,
  Palmtree,
  Save,
  AlertTriangle,
  Download,
  Building2,
  PoundSterling,
  Camera,
  Plus,
  Bell,
  BellOff,
  CalendarDays,
  Stethoscope,
  CheckCircle2,
  XCircle,
  HourglassIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Attendance, FeedEntry, User, JobSite, LeaveRequest } from "@shared/schema";
import { format, differenceInDays, parseISO } from "date-fns";
import resolveLogoPath from "@assets/Resolve_Construction_Ltd._Logo_1772117575893.jpg";

type SafeUser = Omit<User, "password">;
type LeaveRequestWithUser = LeaveRequest & { user?: SafeUser };

function WorkerAvatar({ worker, size = "md" }: { worker: SafeUser; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "w-7 h-7" : "w-9 h-9";
  const textSize = size === "sm" ? "text-xs" : "text-sm";
  if (worker.profilePhoto) {
    return (
      <img
        src={worker.profilePhoto}
        alt={worker.fullName}
        className={`${dim} rounded-md object-cover`}
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
    );
  }
  return (
    <div className={`${dim} rounded-md bg-primary/10 flex items-center justify-center`}>
      <span className={`${textSize} font-bold text-primary`}>{worker.fullName.charAt(0)}</span>
    </div>
  );
}

function ContractDialog({ worker, jobSites, t }: { worker: SafeUser; jobSites: JobSite[]; t: any }) {
  const { toast } = useToast();
  const [contractType, setContractType] = useState(worker.contractType || "");
  const [contractStartDate, setContractStartDate] = useState(worker.contractStartDate || "");
  const [contractExpiryDate, setContractExpiryDate] = useState(worker.contractExpiryDate || "");
  const [sickDaysTotal, setSickDaysTotal] = useState(worker.sickDaysTotal?.toString() || "0");
  const [sickDaysUsed, setSickDaysUsed] = useState(worker.sickDaysUsed?.toString() || "0");
  const [holidayDaysTotal, setHolidayDaysTotal] = useState(worker.holidayDaysTotal?.toString() || "0");
  const [holidayDaysUsed, setHolidayDaysUsed] = useState(worker.holidayDaysUsed?.toString() || "0");
  const [hourlyRate, setHourlyRate] = useState(worker.hourlyRate?.toString() || "");
  const [jobSiteId, setJobSiteId] = useState(worker.jobSiteId || "");

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/workers/${worker.id}/contract`, {
        contractType: contractType || null,
        contractStartDate: contractStartDate || null,
        contractExpiryDate: contractExpiryDate || null,
        sickDaysTotal: parseInt(sickDaysTotal) || 0,
        sickDaysUsed: parseInt(sickDaysUsed) || 0,
        holidayDaysTotal: parseInt(holidayDaysTotal) || 0,
        holidayDaysUsed: parseInt(holidayDaysUsed) || 0,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        jobSiteId: jobSiteId || null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workers"] });
      toast({ title: t.contractUpdated, description: `${worker.fullName}` });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const sickDaysLeft = Math.max(0, (parseInt(sickDaysTotal) || 0) - (parseInt(sickDaysUsed) || 0));
  const holidayDaysLeft = Math.max(0, (parseInt(holidayDaysTotal) || 0) - (parseInt(holidayDaysUsed) || 0));
  const contractDaysLeft = contractExpiryDate ? differenceInDays(parseISO(contractExpiryDate), new Date()) : null;
  const contractExpiring = contractDaysLeft !== null && contractDaysLeft <= 30 && contractDaysLeft >= 0;
  const contractExpired = contractDaysLeft !== null && contractDaysLeft < 0;

  return (
    <div className="space-y-5 pt-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/50 rounded-md p-3 text-center">
          <HeartPulse className="w-4 h-4 mx-auto text-red-500 mb-1" />
          <p className="text-lg font-bold">{sickDaysLeft}</p>
          <p className="text-xs text-muted-foreground">{t.sickDaysLeft}</p>
        </div>
        <div className="bg-muted/50 rounded-md p-3 text-center">
          <Palmtree className="w-4 h-4 mx-auto text-green-600 mb-1" />
          <p className="text-lg font-bold">{holidayDaysLeft}</p>
          <p className="text-xs text-muted-foreground">{t.holidayDaysLeft}</p>
        </div>
      </div>

      {contractDaysLeft !== null && (
        <div className={`rounded-md p-3 flex items-center gap-2 text-sm ${contractExpired ? "bg-red-50 text-red-700 border border-red-200" : contractExpiring ? "bg-orange-50 text-orange-700 border border-orange-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {contractExpired
            ? <span>{t.contractExpiredDaysAgo} {Math.abs(contractDaysLeft)} {t.daysAgo}</span>
            : contractExpiring
            ? <span>{t.contractExpiresIn} {contractDaysLeft} {t.daysAgo}</span>
            : <span>{contractDaysLeft} {t.daysLeft}</span>}
        </div>
      )}

      <div className="space-y-2">
        <Label>{t.contractType}</Label>
        <Select value={contractType} onValueChange={setContractType}>
          <SelectTrigger><SelectValue placeholder={t.contractType} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="full-time">{t.fullTime}</SelectItem>
            <SelectItem value="part-time">{t.partTime}</SelectItem>
            <SelectItem value="temporary">{t.temporary}</SelectItem>
            <SelectItem value="contract">{t.byProject}</SelectItem>
            <SelectItem value="apprentice">{t.apprentice}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t.assignedSite}</Label>
        <Select value={jobSiteId} onValueChange={setJobSiteId}>
          <SelectTrigger><SelectValue placeholder={t.noAssignedSite} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t.noAssignedSite}</SelectItem>
            {jobSites.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t.hourlyRate}</Label>
        <Input type="number" min="0" step="0.01" placeholder="e.g. 14.50" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>{t.contractStart}</Label>
          <Input type="date" value={contractStartDate} onChange={(e) => setContractStartDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>{t.contractEnd}</Label>
          <Input type="date" value={contractExpiryDate} onChange={(e) => setContractExpiryDate(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>{t.totalSickDays}</Label>
          <Input type="number" min="0" value={sickDaysTotal} onChange={(e) => setSickDaysTotal(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>{t.usedSickDays}</Label>
          <Input type="number" min="0" value={sickDaysUsed} onChange={(e) => setSickDaysUsed(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>{t.totalHolidayDays}</Label>
          <Input type="number" min="0" value={holidayDaysTotal} onChange={(e) => setHolidayDaysTotal(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>{t.usedHolidayDays}</Label>
          <Input type="number" min="0" value={holidayDaysUsed} onChange={(e) => setHolidayDaysUsed(e.target.value)} />
        </div>
      </div>

      <Button className="w-full" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
        <Save className="w-4 h-4 mr-1" />
        {updateMutation.isPending ? t.saving : t.saveContract}
      </Button>
    </div>
  );
}

function LeaveStatusBadge({ status, t }: { status: string; t: any }) {
  if (status === "approved") return <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs"><CheckCircle2 className="w-3 h-3 mr-1" />{t.approved}</Badge>;
  if (status === "rejected") return <Badge variant="destructive" className="text-xs"><XCircle className="w-3 h-3 mr-1" />{t.rejected}</Badge>;
  return <Badge variant="secondary" className="text-xs"><HourglassIcon className="w-3 h-3 mr-1" />{t.pending}</Badge>;
}

function LeaveRequestsTab({ t }: { t: any }) {
  const { toast } = useToast();
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"approved" | "rejected" | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const { data: allRequests = [] } = useQuery<LeaveRequestWithUser[]>({
    queryKey: ["/api/leave-requests"],
    refetchInterval: 30000,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, note }: { id: string; status: "approved" | "rejected"; note: string }) => {
      const res = await apiRequest("PATCH", `/api/leave-requests/${id}`, { status, adminNote: note || null });
      return res.json();
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
      setActionId(null);
      setActionType(null);
      setAdminNote("");
      toast({ title: vars.status === "approved" ? t.requestApproved : t.requestRejected });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const filtered = filterStatus === "all" ? allRequests : allRequests.filter((r) => r.status === filterStatus);
  const pendingCount = allRequests.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t.allRequests}</h3>
        {pendingCount > 0 && (
          <Badge variant="destructive" className="text-xs">{pendingCount} {t.pending}</Badge>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["all", "pending", "approved", "rejected"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${filterStatus === s ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"}`}
          >
            {s === "all" ? (t.all || "All") : s === "pending" ? t.pending : s === "approved" ? t.approved : t.rejected}
            {s !== "all" && <span className="ml-1">({allRequests.filter((r) => r.status === s).length})</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <CalendarDays className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">{t.noRequestsAdmin}</p>
        </div>
      )}

      {filtered.map((req) => (
        <Card key={req.id} className={req.status === "pending" ? "border-orange-200 bg-orange-50/30" : ""}>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                {req.user && <WorkerAvatar worker={req.user} size="sm" />}
                <div>
                  <p className="font-medium text-sm">{req.user?.fullName || t.unknown}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {req.type === "annual_leave" ? (
                      <><CalendarDays className="w-3.5 h-3.5 text-blue-500" /><span className="text-xs text-muted-foreground">{t.annualLeave}</span></>
                    ) : (
                      <><Stethoscope className="w-3.5 h-3.5 text-red-500" /><span className="text-xs text-muted-foreground">{t.sickNote}</span></>
                    )}
                  </div>
                </div>
              </div>
              <LeaveStatusBadge status={req.status} t={t} />
            </div>

            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>{t.from}: <span className="font-medium text-foreground">{req.startDate}</span> — {t.to}: <span className="font-medium text-foreground">{req.endDate}</span></p>
              {req.notes && <p className="italic">"{req.notes}"</p>}
              <p className="text-muted-foreground/70">{t.from} {format(new Date(req.createdAt), "d MMM yyyy, HH:mm")}</p>
            </div>

            {req.photoUrl && (
              <div>
                <a href={req.photoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                  <Camera className="w-3 h-3" />{t.viewSickNote}
                </a>
                <img
                  src={req.photoUrl}
                  alt="Sick note"
                  className="mt-2 w-full max-h-40 object-cover rounded-md border"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            )}

            {req.adminNote && (
              <p className="text-xs italic text-muted-foreground border-l-2 pl-2 border-muted-foreground/30">
                {t.adminNote}: {req.adminNote}
              </p>
            )}

            {req.status === "pending" && (
              <div className="flex gap-2 pt-1">
                {actionId === req.id ? (
                  <div className="w-full space-y-2">
                    <Textarea
                      placeholder={t.optionalNote}
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      className="resize-none text-sm"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className={`flex-1 ${actionType === "approved" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}`}
                        disabled={updateMutation.isPending}
                        onClick={() => updateMutation.mutate({ id: req.id, status: actionType!, note: adminNote })}
                      >
                        {updateMutation.isPending ? "..." : t.confirm}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setActionId(null); setActionType(null); setAdminNote(""); }}>
                        {t.cancel}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Button
                      size="sm"
                      className="bg-green-500 hover:bg-green-600 text-white"
                      onClick={() => { setActionId(req.id); setActionType("approved"); }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />{t.approve}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => { setActionId(req.id); setActionType("rejected"); }}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />{t.reject}
                    </Button>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const { adminLogout } = useAdmin();
  const { lang, setLang, t } = useLanguage();
  const { toast } = useToast();
  const [newWorkerOpen, setNewWorkerOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [exportFrom, setExportFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [exportTo, setExportTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [newSiteName, setNewSiteName] = useState("");
  const [newSiteAddress, setNewSiteAddress] = useState("");
  const [payFrom, setPayFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });
  const [payTo, setPayTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split("T")[0]);
  const prevAttendanceRef = useRef<Set<string>>(new Set());

  const { data: workers = [] } = useQuery<SafeUser[]>({ queryKey: ["/api/workers"] });

  const { data: dateAttendance = [] } = useQuery<(Attendance & { user?: SafeUser })[]>({
    queryKey: ["/api/attendance/date", attendanceDate],
    queryFn: async () => {
      const res = await fetch(`/api/attendance/date/${attendanceDate}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const { data: allFeed = [] } = useQuery<(FeedEntry & { user?: SafeUser })[]>({ queryKey: ["/api/feed/all"] });

  const { data: workerAttendance = [] } = useQuery<Attendance[]>({
    queryKey: ["/api/attendance/worker", selectedWorkerId],
    enabled: !!selectedWorkerId,
  });

  const { data: jobSites = [] } = useQuery<JobSite[]>({ queryKey: ["/api/job-sites"] });

  const { data: allLeaveRequests = [] } = useQuery<LeaveRequestWithUser[]>({ queryKey: ["/api/leave-requests"] });
  const pendingLeaveCount = allLeaveRequests.filter((r) => r.status === "pending").length;

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "granted") {
      setNotifEnabled(true);
    }
  }, []);

  useEffect(() => {
    if (!notifEnabled || dateAttendance.length === 0) return;
    const currentIds = new Set(dateAttendance.map((a) => `${a.id}-${a.signOutTime || "in"}`));
    if (prevAttendanceRef.current.size === 0) {
      prevAttendanceRef.current = currentIds;
      return;
    }
    for (const key of currentIds) {
      if (!prevAttendanceRef.current.has(key)) {
        const record = dateAttendance.find((a) => `${a.id}-${a.signOutTime || "in"}` === key);
        if (record) {
          const name = record.user?.fullName || "A worker";
          const action = record.signOutTime ? (lang === "en" ? "clocked out" : "ha fichado la salida") : (lang === "en" ? "clocked in" : "ha fichado la entrada");
          new Notification("Resolve Construction", { body: `${name} ${action}`, icon: "/favicon.ico" });
        }
      }
    }
    prevAttendanceRef.current = currentIds;
  }, [dateAttendance, notifEnabled, lang]);

  const enableNotifications = async () => {
    if (!("Notification" in window)) {
      toast({ title: "Error", description: lang === "en" ? "Your browser doesn't support notifications." : "Tu navegador no soporta notificaciones.", variant: "destructive" });
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setNotifEnabled(true);
      toast({ title: t.alertsEnabled });
    } else {
      toast({ title: lang === "en" ? "Permission Denied" : "Permiso denegado", variant: "destructive" });
    }
  };

  const createWorkerMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/workers", { fullName, username, password });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workers"] });
      setNewWorkerOpen(false);
      setFullName(""); setUsername(""); setPassword("");
      toast({ title: t.workerCreated, description: t.workerCreatedDesc });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteWorkerMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/workers/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workers"] });
      toast({ title: t.workerDeleted });
    },
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const form = new FormData();
      form.append("photo", file);
      const res = await fetch(`/api/workers/${id}/photo`, { method: "POST", body: form });
      if (!res.ok) throw new Error("Error uploading photo");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workers"] });
      toast({ title: lang === "en" ? "Photo Updated" : "Foto actualizada" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const createSiteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/job-sites", { name: newSiteName, address: newSiteAddress || null });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-sites"] });
      setNewSiteName(""); setNewSiteAddress("");
      toast({ title: t.siteAdded });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteSiteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/job-sites/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-sites"] });
      toast({ title: t.siteDeleted });
    },
  });

  const today = new Date().toISOString().split("T")[0];
  const isToday = attendanceDate === today;
  const activeWorkers = dateAttendance.filter((a) => !a.signOutTime);
  const completedWorkers = dateAttendance.filter((a) => a.signOutTime);

  const navigateDate = (direction: "prev" | "next") => {
    const d = new Date(attendanceDate);
    d.setDate(d.getDate() + (direction === "next" ? 1 : -1));
    const next = d.toISOString().split("T")[0];
    if (next <= today) setAttendanceDate(next);
  };

  const expiringContracts = workers.filter((w) => {
    if (!w.contractExpiryDate) return false;
    const days = differenceInDays(parseISO(w.contractExpiryDate), new Date());
    return days >= 0 && days <= 30;
  });

  const expiredContracts = workers.filter((w) => {
    if (!w.contractExpiryDate) return false;
    return differenceInDays(parseISO(w.contractExpiryDate), new Date()) < 0;
  });

  const copyCredentials = () => {
    navigator.clipboard.writeText(`${t.username}: ${username}\n${t.password}: ${password}`);
    toast({ title: t.copied, description: t.credentialsCopied });
  };

  const getContractBadge = (worker: SafeUser) => {
    if (!worker.contractExpiryDate) return null;
    const daysLeft = differenceInDays(parseISO(worker.contractExpiryDate), new Date());
    if (daysLeft < 0) return <Badge variant="destructive" className="text-xs">{t.contractExpired}</Badge>;
    if (daysLeft <= 30) return <Badge className="text-xs bg-orange-500 hover:bg-orange-600">{t.contractExpiringSoon}</Badge>;
    return null;
  };

  return (
    <div className="min-h-screen" style={{background: "linear-gradient(160deg, #fff7ed 0%, #ffedd5 50%, #fed7aa 100%)"}}>
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <img src={resolveLogoPath} alt="Resolve Construction" className="h-10 w-auto object-contain" />
            <div>
              <p className="font-semibold text-sm leading-tight">Resolve Construction</p>
              <p className="text-xs text-muted-foreground">{t.adminPanel}</p>
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
            <Button variant="outline" size="sm" onClick={notifEnabled ? undefined : enableNotifications} className={notifEnabled ? "text-green-600 border-green-300" : ""}>
              {notifEnabled ? <Bell className="w-4 h-4 mr-1" /> : <BellOff className="w-4 h-4 mr-1" />}
              {notifEnabled ? t.alertsEnabled : t.enableAlerts}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => adminLogout()}>
              <LogOut className="w-4 h-4 mr-1" />
              {t.logout}
            </Button>
          </div>
        </div>
      </header>

      {(expiringContracts.length > 0 || expiredContracts.length > 0) && (
        <div className="bg-orange-50 border-b border-orange-200">
          <div className="max-w-6xl mx-auto px-4 py-2 flex flex-wrap gap-3">
            {expiredContracts.map((w) => (
              <div key={w.id} className="flex items-center gap-1.5 text-sm text-red-700">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span><strong>{w.fullName}</strong> — {t.contractExpired}</span>
              </div>
            ))}
            {expiringContracts.map((w) => (
              <div key={w.id} className="flex items-center gap-1.5 text-sm text-orange-700">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span><strong>{w.fullName}</strong> — {t.contractExpiresIn} {differenceInDays(parseISO(w.contractExpiryDate!), new Date())} {t.daysAgo}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{t.totalWorkers}</p>
                  <p className="text-2xl font-bold mt-1">{workers.length}</p>
                </div>
                <div className="w-10 h-10 rounded-md bg-accent flex items-center justify-center">
                  <Users className="w-5 h-5 text-accent-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{t.onSiteNow}</p>
                  <p className="text-2xl font-bold mt-1 text-green-600">{activeWorkers.length}</p>
                </div>
                <div className="w-10 h-10 rounded-md bg-accent flex items-center justify-center">
                  <Activity className="w-5 h-5 text-accent-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{t.completed}</p>
                  <p className="text-2xl font-bold mt-1">{completedWorkers.length}</p>
                </div>
                <div className="w-10 h-10 rounded-md bg-accent flex items-center justify-center">
                  <Clock className="w-5 h-5 text-accent-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{t.activeSites}</p>
                  <p className="text-2xl font-bold mt-1">{jobSites.length}</p>
                </div>
                <div className="w-10 h-10 rounded-md bg-accent flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-accent-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="attendance">
          <TabsList className="mb-4 flex-wrap h-auto gap-1">
            <TabsTrigger value="attendance"><Clock className="w-4 h-4 mr-1" />{t.attendance}</TabsTrigger>
            <TabsTrigger value="workers"><Users className="w-4 h-4 mr-1" />{t.workers}</TabsTrigger>
            <TabsTrigger value="requests" className="relative">
              <CalendarDays className="w-4 h-4 mr-1" />{t.requests}
              {pendingLeaveCount > 0 && (
                <span className="ml-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">{pendingLeaveCount}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="pay"><PoundSterling className="w-4 h-4 mr-1" />{t.payroll}</TabsTrigger>
            <TabsTrigger value="sites"><Building2 className="w-4 h-4 mr-1" />{t.sites}</TabsTrigger>
            <TabsTrigger value="feed"><FileText className="w-4 h-4 mr-1" />{t.activity}</TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="space-y-4">
            <div className="flex flex-wrap items-end gap-3 p-4 bg-muted/40 rounded-lg border">
              <div className="space-y-1">
                <Label className="text-xs">{t.exportFrom}</Label>
                <Input type="date" className="h-8 text-sm w-36" value={exportFrom} onChange={(e) => setExportFrom(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t.to}</Label>
                <Input type="date" className="h-8 text-sm w-36" value={exportTo} onChange={(e) => setExportTo(e.target.value)} />
              </div>
              <Button size="sm" variant="outline" onClick={() => window.open(`/api/export/attendance?from=${exportFrom}&to=${exportTo}`, "_blank")}>
                <Download className="w-4 h-4 mr-1" />{t.export}
              </Button>
            </div>

            <div className="flex items-center gap-3 bg-card border rounded-lg px-4 py-2">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateDate("prev")}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex-1 text-center">
                <Input
                  type="date"
                  value={attendanceDate}
                  max={today}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="h-8 text-sm text-center border-0 shadow-none focus-visible:ring-0 w-40 mx-auto"
                />
                {isToday && <span className="text-xs text-primary font-medium">{t.today}</span>}
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateDate("next")} disabled={isToday}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                {t.currentlyOnSite} ({activeWorkers.length})
              </h3>
              {activeWorkers.length === 0 ? (
                <p className="text-sm text-muted-foreground pl-4">{lang === "en" ? "No workers currently on site." : "Sin trabajadores en obra ahora."}</p>
              ) : (
                activeWorkers.map((record) => (
                  <Card key={record.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3">
                          {record.user && <WorkerAvatar worker={record.user as SafeUser} />}
                          <div>
                            <p className="font-medium text-sm">{record.user?.fullName || t.unknown}</p>
                            <p className="text-xs text-muted-foreground">{lang === "en" ? "In at" : "Entrada a las"} {format(new Date(record.signInTime), "HH:mm")}</p>
                            {record.signInLat && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-green-600" />
                                {record.signInLat.toFixed(5)}, {record.signInLng?.toFixed(5)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="default">{t.active}</Badge>
                          {record.signInLat && (
                            <a href={`https://www.google.com/maps?q=${record.signInLat},${record.signInLng}`} target="_blank" rel="noopener noreferrer">
                              <Button variant="secondary" size="sm"><MapPin className="w-3.5 h-3.5 mr-1" />{lang === "en" ? "Map" : "Mapa"}</Button>
                            </a>
                          )}
                          {!record.signInLat && <Badge variant="secondary" className="text-xs"><MapPinOff className="w-3 h-3 mr-1" />{t.noGps}</Badge>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-400" />
                {t.completedShift} ({completedWorkers.length})
              </h3>
              {completedWorkers.length === 0 ? (
                <p className="text-sm text-muted-foreground pl-4">{lang === "en" ? "No completed shifts yet." : "Sin turnos completados aún."}</p>
              ) : (
                completedWorkers.map((record) => (
                  <Card key={record.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3">
                          {record.user && <WorkerAvatar worker={record.user as SafeUser} />}
                          <div>
                            <p className="font-medium text-sm">{record.user?.fullName || t.unknown}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(record.signInTime), "HH:mm")}
                              {record.signOutTime && ` - ${format(new Date(record.signOutTime), "HH:mm")}`}
                              {record.signInTime && record.signOutTime && (
                                <span className="ml-1 font-medium">
                                  ({Math.round(((new Date(record.signOutTime).getTime() - new Date(record.signInTime).getTime()) / 3600000) * 10) / 10}h)
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {record.signInLat && (
                            <a href={`https://www.google.com/maps?q=${record.signInLat},${record.signInLng}`} target="_blank" rel="noopener noreferrer">
                              <Button variant="secondary" size="sm"><MapPin className="w-3.5 h-3.5 mr-1" />{lang === "en" ? "In" : "Entrada"}</Button>
                            </a>
                          )}
                          {record.signOutLat && (
                            <a href={`https://www.google.com/maps?q=${record.signOutLat},${record.signOutLng}`} target="_blank" rel="noopener noreferrer">
                              <Button variant="secondary" size="sm"><MapPin className="w-3.5 h-3.5 mr-1" />{lang === "en" ? "Out" : "Salida"}</Button>
                            </a>
                          )}
                          <Badge variant="secondary">{t.done}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {dateAttendance.length === 0 && (
              <div className="text-center py-8">
                <Clock className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">{t.noAttendanceToday}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="workers" className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t.workerManagement}</h3>
              <Dialog open={newWorkerOpen} onOpenChange={setNewWorkerOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><UserPlus className="w-4 h-4 mr-1" />{t.addWorker}</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>{t.addNewWorker}</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label>{t.fullName}</Label>
                      <Input placeholder={t.fullNamePlaceholder} value={fullName} onChange={(e) => setFullName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t.username}</Label>
                      <Input placeholder={t.usernamePlaceholder} value={username} onChange={(e) => setUsername(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t.password}</Label>
                      <Input placeholder={t.passwordPlaceholder} value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    {username && password && (
                      <div className="bg-muted rounded-md p-3 space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">{t.shareWithWorker}</p>
                        <p className="text-sm font-mono">{t.username}: {username}</p>
                        <p className="text-sm font-mono">{t.password}: {password}</p>
                        <Button variant="secondary" size="sm" className="mt-2" onClick={copyCredentials}>
                          <Copy className="w-3.5 h-3.5 mr-1" />{t.copy}
                        </Button>
                      </div>
                    )}
                    <Button className="w-full" disabled={!fullName || !username || !password || createWorkerMutation.isPending} onClick={() => createWorkerMutation.mutate()}>
                      {createWorkerMutation.isPending ? t.creating : t.createWorker}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {workers.map((worker) => {
              const isActiveToday = dateAttendance.some((a) => a.userId === worker.id && !a.signOutTime);
              const sickLeft = Math.max(0, (worker.sickDaysTotal || 0) - (worker.sickDaysUsed || 0));
              const holidayLeft = Math.max(0, (worker.holidayDaysTotal || 0) - (worker.holidayDaysUsed || 0));
              const site = jobSites.find((s) => s.id === worker.jobSiteId);
              return (
                <Card key={worker.id}>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="relative group">
                          <WorkerAvatar worker={worker} />
                          <label className="absolute inset-0 flex items-center justify-center rounded-md bg-black/40 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                            <Camera className="w-3 h-3 text-white" />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) uploadPhotoMutation.mutate({ id: worker.id, file });
                              }}
                            />
                          </label>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{worker.fullName}</p>
                            {getContractBadge(worker)}
                          </div>
                          <p className="text-xs text-muted-foreground">@{worker.username}</p>
                          {site && <p className="text-xs text-muted-foreground flex items-center gap-1"><Building2 className="w-3 h-3" />{site.name}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={isActiveToday ? "default" : "secondary"}>{isActiveToday ? t.onSite : t.offSite}</Badge>
                        {worker.contractType && <Badge variant="outline" className="text-xs capitalize">{worker.contractType}</Badge>}
                        {worker.hourlyRate && <Badge variant="outline" className="text-xs">£{worker.hourlyRate}/h</Badge>}
                      </div>
                    </div>

                    {(worker.sickDaysTotal || worker.holidayDaysTotal || worker.contractExpiryDate) && (
                      <div className="flex items-center gap-4 text-xs text-muted-foreground border-t pt-2 flex-wrap">
                        {(worker.sickDaysTotal || 0) > 0 && <span className="flex items-center gap-1"><HeartPulse className="w-3 h-3 text-red-500" />{sickLeft}/{worker.sickDaysTotal}</span>}
                        {(worker.holidayDaysTotal || 0) > 0 && <span className="flex items-center gap-1"><Palmtree className="w-3 h-3 text-green-600" />{holidayLeft}/{worker.holidayDaysTotal}</span>}
                        {worker.contractExpiryDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(parseISO(worker.contractExpiryDate), "dd/MM/yyyy")}</span>}
                      </div>
                    )}

                    <div className="flex items-center gap-2 border-t pt-2 flex-wrap">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="secondary" size="sm"><Briefcase className="w-3.5 h-3.5 mr-1" />{t.contract}</Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[85vh] overflow-y-auto">
                          <DialogHeader><DialogTitle>{worker.fullName} — {t.contract}</DialogTitle></DialogHeader>
                          <ContractDialog worker={worker} jobSites={jobSites} t={t} />
                        </DialogContent>
                      </Dialog>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="secondary" size="sm" onClick={() => setSelectedWorkerId(worker.id)}>
                            <Eye className="w-3.5 h-3.5 mr-1" />{t.history}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[80vh] overflow-y-auto">
                          <DialogHeader><DialogTitle>{worker.fullName} — {t.attendanceHistory}</DialogTitle></DialogHeader>
                          <div className="space-y-2 pt-2">
                            {workerAttendance.length === 0 ? (
                              <p className="text-sm text-muted-foreground text-center py-4">{t.noAttendanceYet}</p>
                            ) : (
                              workerAttendance.map((record) => (
                                <div key={record.id} className="flex items-center justify-between gap-2 py-2 border-b last:border-0">
                                  <div>
                                    <p className="text-sm font-medium">{record.date}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {format(new Date(record.signInTime), "HH:mm")}
                                      {record.signOutTime && ` - ${format(new Date(record.signOutTime), "HH:mm")}`}
                                      {record.signInTime && record.signOutTime && (
                                        <span className="ml-1 font-medium">({Math.round(((new Date(record.signOutTime).getTime() - new Date(record.signInTime).getTime()) / 3600000) * 10) / 10}h)</span>
                                      )}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {record.signInLat && (
                                      <a href={`https://www.google.com/maps?q=${record.signInLat},${record.signInLng}`} target="_blank" rel="noopener noreferrer">
                                        <Button variant="secondary" size="sm"><MapPin className="w-3 h-3 mr-1" />{lang === "en" ? "In" : "Entrada"}</Button>
                                      </a>
                                    )}
                                    {record.signOutLat && (
                                      <a href={`https://www.google.com/maps?q=${record.signOutLat},${record.signOutLng}`} target="_blank" rel="noopener noreferrer">
                                        <Button variant="secondary" size="sm"><MapPin className="w-3 h-3 mr-1" />{lang === "en" ? "Out" : "Salida"}</Button>
                                      </a>
                                    )}
                                    <Badge variant={record.signOutTime ? "secondary" : "default"}>{record.signOutTime ? t.done : t.active}</Badge>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button variant="secondary" size="icon" onClick={() => { if (confirm(`${lang === "en" ? "Delete" : "¿Eliminar a"} ${worker.fullName}?`)) deleteWorkerMutation.mutate(worker.id); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {workers.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">{lang === "en" ? "No workers yet. Add the first one above." : "Sin trabajadores aún. Añade el primero arriba."}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests">
            <LeaveRequestsTab t={t} />
          </TabsContent>

          <TabsContent value="pay" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">{t.payrollCalculator}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">{t.from}</Label>
                    <Input type="date" className="h-8 text-sm w-36" value={payFrom} onChange={(e) => setPayFrom(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t.to}</Label>
                    <Input type="date" className="h-8 text-sm w-36" value={payTo} onChange={(e) => setPayTo(e.target.value)} />
                  </div>
                  <Button size="sm" variant="outline" onClick={() => window.open(`/api/export/attendance?from=${payFrom}&to=${payTo}`, "_blank")}>
                    <Download className="w-4 h-4 mr-1" />{lang === "en" ? "Export Period" : "Exportar periodo"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">{t.setHourlyRate}</p>
              </CardContent>
            </Card>

            {workers.map((worker) => {
              const completed = dateAttendance.filter((a) => a.userId === worker.id && a.signOutTime);
              const totalHoursToday = completed.reduce((sum, r) => {
                if (!r.signOutTime) return sum;
                return sum + (new Date(r.signOutTime).getTime() - new Date(r.signInTime).getTime()) / 3600000;
              }, 0);
              const payToday = totalHoursToday * (worker.hourlyRate || 0);
              if (!worker.hourlyRate && completed.length === 0) return null;
              return (
                <Card key={worker.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <WorkerAvatar worker={worker} />
                        <div>
                          <p className="font-medium text-sm">{worker.fullName}</p>
                          <p className="text-xs text-muted-foreground">{worker.hourlyRate ? `£${worker.hourlyRate}/h` : t.noHourlyRate}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">£{payToday.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{Math.round(totalHoursToday * 10) / 10}{t.hoursToday}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {workers.every((w) => !w.hourlyRate) && (
              <div className="text-center py-8">
                <PoundSterling className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">{t.setHourlyRate}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="sites" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">{t.addSiteTitle}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>{t.siteName}</Label>
                  <Input placeholder={t.siteNamePlaceholder} value={newSiteName} onChange={(e) => setNewSiteName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t.siteAddress}</Label>
                  <Input placeholder={t.siteAddressPlaceholder} value={newSiteAddress} onChange={(e) => setNewSiteAddress(e.target.value)} />
                </div>
                <Button className="w-full" disabled={!newSiteName || createSiteMutation.isPending} onClick={() => createSiteMutation.mutate()}>
                  <Plus className="w-4 h-4 mr-1" />
                  {createSiteMutation.isPending ? t.adding : t.addSite}
                </Button>
              </CardContent>
            </Card>

            {jobSites.map((site) => {
              const assignedWorkers = workers.filter((w) => w.jobSiteId === site.id);
              return (
                <Card key={site.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center mt-0.5">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{site.name}</p>
                          {site.address && <p className="text-xs text-muted-foreground">{site.address}</p>}
                          <p className="text-xs text-muted-foreground mt-1">
                            {assignedWorkers.length > 0
                              ? `${t.assignedWorkers}: ${assignedWorkers.map((w) => w.fullName).join(", ")}`
                              : t.noWorkersAssigned}
                          </p>
                        </div>
                      </div>
                      <Button variant="secondary" size="icon" onClick={() => { if (confirm(`${lang === "en" ? `Delete site "${site.name}"?` : `¿Eliminar obra "${site.name}"?`}`)) deleteSiteMutation.mutate(site.id); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {jobSites.length === 0 && (
              <div className="text-center py-12">
                <Building2 className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">{t.noSitesYet}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="feed" className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t.activityTitle}</h3>
            {allFeed.map((entry) => (
              <Card key={entry.id}>
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {entry.user ? (
                        <WorkerAvatar worker={entry.user as SafeUser} size="sm" />
                      ) : (
                        <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">?</span>
                        </div>
                      )}
                      <span className="text-sm font-medium">{entry.user?.fullName || t.unknown}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{format(new Date(entry.createdAt), "d MMM, HH:mm")}</span>
                  </div>
                  {entry.note && <p className="text-sm leading-relaxed">{entry.note}</p>}
                  {entry.imageUrl && (
                    <img src={entry.imageUrl} alt="Work update" className="w-full rounded-md object-cover max-h-64" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  )}
                </CardContent>
              </Card>
            ))}
            {allFeed.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">{t.noActivityYet}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
