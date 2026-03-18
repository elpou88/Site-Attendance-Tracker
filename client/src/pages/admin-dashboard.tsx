import { useState, useEffect, useRef } from "react";
import { useAdmin } from "@/lib/auth";
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
} from "lucide-react";
import type { Attendance, FeedEntry, User, JobSite } from "@shared/schema";
import { format, differenceInDays, parseISO } from "date-fns";
import resolveLogoPath from "@assets/Resolve_Construction_Ltd._Logo_1772117575893.jpg";

type SafeUser = Omit<User, "password">;

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

function ContractDialog({ worker, jobSites }: { worker: SafeUser; jobSites: JobSite[] }) {
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
      toast({ title: "Contract Updated", description: `Contract details for ${worker.fullName} saved.` });
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
          <p className="text-xs text-muted-foreground">Sick Days Left</p>
        </div>
        <div className="bg-muted/50 rounded-md p-3 text-center">
          <Palmtree className="w-4 h-4 mx-auto text-green-600 mb-1" />
          <p className="text-lg font-bold">{holidayDaysLeft}</p>
          <p className="text-xs text-muted-foreground">Holiday Days Left</p>
        </div>
      </div>

      {contractDaysLeft !== null && (
        <div className={`rounded-md p-3 flex items-center gap-2 text-sm ${contractExpired ? "bg-red-50 text-red-700 border border-red-200" : contractExpiring ? "bg-orange-50 text-orange-700 border border-orange-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {contractExpired
            ? <span>Contract expired {Math.abs(contractDaysLeft)} days ago</span>
            : contractExpiring
            ? <span>Contract expires in {contractDaysLeft} days</span>
            : <span>{contractDaysLeft} days remaining on contract</span>}
        </div>
      )}

      <div className="space-y-2">
        <Label>Contract Type</Label>
        <Select value={contractType} onValueChange={setContractType}>
          <SelectTrigger>
            <SelectValue placeholder="Select contract type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="full-time">Full-Time</SelectItem>
            <SelectItem value="part-time">Part-Time</SelectItem>
            <SelectItem value="temporary">Temporary</SelectItem>
            <SelectItem value="contract">Contract</SelectItem>
            <SelectItem value="apprentice">Apprentice</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Assigned Job Site</Label>
        <Select value={jobSiteId} onValueChange={setJobSiteId}>
          <SelectTrigger>
            <SelectValue placeholder="No site assigned" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">No site assigned</SelectItem>
            {jobSites.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Hourly Rate (£)</Label>
        <Input
          type="number"
          min="0"
          step="0.01"
          placeholder="e.g. 14.50"
          value={hourlyRate}
          onChange={(e) => setHourlyRate(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Contract Start Date</Label>
          <Input type="date" value={contractStartDate} onChange={(e) => setContractStartDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Contract Expiry Date</Label>
          <Input type="date" value={contractExpiryDate} onChange={(e) => setContractExpiryDate(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Total Sick Days</Label>
          <Input type="number" min="0" value={sickDaysTotal} onChange={(e) => setSickDaysTotal(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Sick Days Used</Label>
          <Input type="number" min="0" value={sickDaysUsed} onChange={(e) => setSickDaysUsed(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Total Holiday Days</Label>
          <Input type="number" min="0" value={holidayDaysTotal} onChange={(e) => setHolidayDaysTotal(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Holiday Days Used</Label>
          <Input type="number" min="0" value={holidayDaysUsed} onChange={(e) => setHolidayDaysUsed(e.target.value)} />
        </div>
      </div>

      <Button className="w-full" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
        <Save className="w-4 h-4 mr-1" />
        {updateMutation.isPending ? "Saving..." : "Save Contract Details"}
      </Button>
    </div>
  );
}

export default function AdminDashboard() {
  const { adminLogout } = useAdmin();
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
  const prevAttendanceRef = useRef<Set<string>>(new Set());

  const { data: workers = [] } = useQuery<SafeUser[]>({ queryKey: ["/api/workers"] });

  const { data: todayAttendance = [] } = useQuery<(Attendance & { user?: SafeUser })[]>({
    queryKey: ["/api/attendance/today"],
    refetchInterval: 30000,
  });

  const { data: allFeed = [] } = useQuery<(FeedEntry & { user?: SafeUser })[]>({ queryKey: ["/api/feed/all"] });

  const { data: workerAttendance = [] } = useQuery<Attendance[]>({
    queryKey: ["/api/attendance/worker", selectedWorkerId],
    enabled: !!selectedWorkerId,
  });

  const { data: jobSites = [] } = useQuery<JobSite[]>({ queryKey: ["/api/job-sites"] });


  useEffect(() => {
    if ("Notification" in window && Notification.permission === "granted") {
      setNotifEnabled(true);
    }
  }, []);

  useEffect(() => {
    if (!notifEnabled || todayAttendance.length === 0) return;
    const currentIds = new Set(todayAttendance.map((a) => `${a.id}-${a.signOutTime || "in"}`));
    if (prevAttendanceRef.current.size === 0) {
      prevAttendanceRef.current = currentIds;
      return;
    }
    for (const key of currentIds) {
      if (!prevAttendanceRef.current.has(key)) {
        const record = todayAttendance.find(
          (a) => `${a.id}-${a.signOutTime || "in"}` === key
        );
        if (record) {
          const name = record.user?.fullName || "A worker";
          const action = record.signOutTime ? "signed out" : "signed in";
          new Notification(`Resolve Construction`, {
            body: `${name} has ${action}`,
            icon: "/favicon.ico",
          });
        }
      }
    }
    prevAttendanceRef.current = currentIds;
  }, [todayAttendance, notifEnabled]);

  const enableNotifications = async () => {
    if (!("Notification" in window)) {
      toast({ title: "Not supported", description: "Your browser doesn't support notifications.", variant: "destructive" });
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setNotifEnabled(true);
      toast({ title: "Notifications enabled", description: "You'll be alerted when workers sign in or out." });
    } else {
      toast({ title: "Permission denied", description: "Enable notifications in your browser settings.", variant: "destructive" });
    }
  };

  const handleExport = () => {
    window.open(`/api/export/attendance?from=${exportFrom}&to=${exportTo}`, "_blank");
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
      toast({ title: "Worker Created", description: "New worker added successfully." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteWorkerMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/workers/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workers"] });
      toast({ title: "Worker Removed" });
    },
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const form = new FormData();
      form.append("photo", file);
      const res = await fetch(`/api/workers/${id}/photo`, { method: "POST", body: form });
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workers"] });
      toast({ title: "Photo updated" });
    },
    onError: (err: any) => {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
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
      toast({ title: "Job site added" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteSiteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/job-sites/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-sites"] });
      toast({ title: "Job site removed" });
    },
  });

  const activeWorkers = todayAttendance.filter((a) => !a.signOutTime);
  const completedWorkers = todayAttendance.filter((a) => a.signOutTime);

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
    navigator.clipboard.writeText(`Username: ${username}\nPassword: ${password}`);
    toast({ title: "Copied", description: "Credentials copied to clipboard" });
  };

  const getContractBadge = (worker: SafeUser) => {
    if (!worker.contractExpiryDate) return null;
    const daysLeft = differenceInDays(parseISO(worker.contractExpiryDate), new Date());
    if (daysLeft < 0) return <Badge variant="destructive" className="text-xs">Expired</Badge>;
    if (daysLeft <= 30) return <Badge className="text-xs bg-orange-500 hover:bg-orange-600">Expiring Soon</Badge>;
    return null;
  };


  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <img src={resolveLogoPath} alt="Resolve Construction" className="h-10 w-auto object-contain" />
            <div>
              <p className="font-semibold text-sm leading-tight">Resolve Construction</p>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={notifEnabled ? undefined : enableNotifications} className={notifEnabled ? "text-green-600 border-green-300" : ""}>
              {notifEnabled ? <Bell className="w-4 h-4 mr-1" /> : <BellOff className="w-4 h-4 mr-1" />}
              {notifEnabled ? "Alerts On" : "Enable Alerts"}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => adminLogout()}>
              <LogOut className="w-4 h-4 mr-1" />
              Exit Admin
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
                <span><strong>{w.fullName}</strong>'s contract has expired</span>
              </div>
            ))}
            {expiringContracts.map((w) => (
              <div key={w.id} className="flex items-center gap-1.5 text-sm text-orange-700">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span><strong>{w.fullName}</strong>'s contract expires in {differenceInDays(parseISO(w.contractExpiryDate!), new Date())} days</span>
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
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Workers</p>
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
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">On Site Now</p>
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
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Signed Out</p>
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
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Job Sites</p>
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
            <TabsTrigger value="attendance"><Clock className="w-4 h-4 mr-1" />Attendance</TabsTrigger>
            <TabsTrigger value="workers"><Users className="w-4 h-4 mr-1" />Workers</TabsTrigger>
            <TabsTrigger value="pay"><PoundSterling className="w-4 h-4 mr-1" />Pay</TabsTrigger>
            <TabsTrigger value="sites"><Building2 className="w-4 h-4 mr-1" />Job Sites</TabsTrigger>
            <TabsTrigger value="feed"><FileText className="w-4 h-4 mr-1" />Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="space-y-4">
            <div className="flex flex-wrap items-end gap-3 p-4 bg-muted/40 rounded-lg border">
              <div className="space-y-1">
                <Label className="text-xs">Export From</Label>
                <Input type="date" className="h-8 text-sm w-36" value={exportFrom} onChange={(e) => setExportFrom(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">To</Label>
                <Input type="date" className="h-8 text-sm w-36" value={exportTo} onChange={(e) => setExportTo(e.target.value)} />
              </div>
              <Button size="sm" variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4 mr-1" />
                Export Excel
              </Button>
            </div>

            {activeWorkers.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Currently On Site ({activeWorkers.length})
                </h3>
                {activeWorkers.map((record) => (
                  <Card key={record.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3">
                          {record.user && <WorkerAvatar worker={record.user as SafeUser} />}
                          <div>
                            <p className="font-medium text-sm">{record.user?.fullName || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">
                              Signed in at {format(new Date(record.signInTime), "h:mm a")}
                            </p>
                            {record.signInLat && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-green-600" />
                                {record.signInLat.toFixed(5)}, {record.signInLng?.toFixed(5)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="default">Active</Badge>
                          {record.signInLat && (
                            <a href={`https://www.google.com/maps?q=${record.signInLat},${record.signInLng}`} target="_blank" rel="noopener noreferrer">
                              <Button variant="secondary" size="sm"><MapPin className="w-3.5 h-3.5 mr-1" />View Map</Button>
                            </a>
                          )}
                          {!record.signInLat && <Badge variant="secondary" className="text-xs"><MapPinOff className="w-3 h-3 mr-1" />No GPS</Badge>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {completedWorkers.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-400" />
                  Completed Shift
                </h3>
                {completedWorkers.map((record) => (
                  <Card key={record.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3">
                          {record.user && <WorkerAvatar worker={record.user as SafeUser} />}
                          <div>
                            <p className="font-medium text-sm">{record.user?.fullName || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(record.signInTime), "h:mm a")}
                              {record.signOutTime && ` - ${format(new Date(record.signOutTime), "h:mm a")}`}
                              {record.signInTime && record.signOutTime && (
                                <span className="ml-1 text-muted-foreground">
                                  ({Math.round(((new Date(record.signOutTime).getTime() - new Date(record.signInTime).getTime()) / 3600000) * 10) / 10}h)
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {record.signInLat && (
                            <a href={`https://www.google.com/maps?q=${record.signInLat},${record.signInLng}`} target="_blank" rel="noopener noreferrer">
                              <Button variant="secondary" size="sm"><MapPin className="w-3.5 h-3.5 mr-1" />In</Button>
                            </a>
                          )}
                          {record.signOutLat && (
                            <a href={`https://www.google.com/maps?q=${record.signOutLat},${record.signOutLng}`} target="_blank" rel="noopener noreferrer">
                              <Button variant="secondary" size="sm"><MapPin className="w-3.5 h-3.5 mr-1" />Out</Button>
                            </a>
                          )}
                          <Badge variant="secondary">Completed</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {todayAttendance.length === 0 && (
              <div className="text-center py-12">
                <Clock className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">No attendance records for today yet.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="workers" className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Manage Workers</h3>
              <Dialog open={newWorkerOpen} onOpenChange={setNewWorkerOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><UserPlus className="w-4 h-4 mr-1" />Add Worker</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add New Worker</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input placeholder="e.g. John Smith" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Username</Label>
                      <Input placeholder="e.g. john.smith" value={username} onChange={(e) => setUsername(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <Input placeholder="Set a password for the worker" value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    {username && password && (
                      <div className="bg-muted rounded-md p-3 space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Share with worker:</p>
                        <p className="text-sm font-mono">Username: {username}</p>
                        <p className="text-sm font-mono">Password: {password}</p>
                        <Button variant="secondary" size="sm" className="mt-2" onClick={copyCredentials}>
                          <Copy className="w-3.5 h-3.5 mr-1" />Copy
                        </Button>
                      </div>
                    )}
                    <Button className="w-full" disabled={!fullName || !username || !password || createWorkerMutation.isPending} onClick={() => createWorkerMutation.mutate()}>
                      {createWorkerMutation.isPending ? "Creating..." : "Create Worker"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {workers.map((worker) => {
              const isActiveToday = todayAttendance.some((a) => a.userId === worker.id && !a.signOutTime);
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
                        <Badge variant={isActiveToday ? "default" : "secondary"}>{isActiveToday ? "On Site" : "Off Site"}</Badge>
                        {worker.contractType && <Badge variant="outline" className="text-xs capitalize">{worker.contractType}</Badge>}
                        {worker.hourlyRate && <Badge variant="outline" className="text-xs">£{worker.hourlyRate}/hr</Badge>}
                      </div>
                    </div>

                    {(worker.sickDaysTotal || worker.holidayDaysTotal || worker.contractExpiryDate) && (
                      <div className="flex items-center gap-4 text-xs text-muted-foreground border-t pt-2">
                        {(worker.sickDaysTotal || 0) > 0 && <span className="flex items-center gap-1"><HeartPulse className="w-3 h-3 text-red-500" />Sick: {sickLeft}/{worker.sickDaysTotal}</span>}
                        {(worker.holidayDaysTotal || 0) > 0 && <span className="flex items-center gap-1"><Palmtree className="w-3 h-3 text-green-600" />Holiday: {holidayLeft}/{worker.holidayDaysTotal}</span>}
                        {worker.contractExpiryDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Expires: {format(parseISO(worker.contractExpiryDate), "dd MMM yyyy")}</span>}
                      </div>
                    )}

                    <div className="flex items-center gap-2 border-t pt-2 flex-wrap">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="secondary" size="sm"><Briefcase className="w-3.5 h-3.5 mr-1" />Contract</Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[85vh] overflow-y-auto">
                          <DialogHeader><DialogTitle>{worker.fullName} - Contract</DialogTitle></DialogHeader>
                          <ContractDialog worker={worker} jobSites={jobSites} />
                        </DialogContent>
                      </Dialog>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="secondary" size="sm" onClick={() => setSelectedWorkerId(worker.id)}>
                            <Eye className="w-3.5 h-3.5 mr-1" />History
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[80vh] overflow-y-auto">
                          <DialogHeader><DialogTitle>{worker.fullName} - Attendance History</DialogTitle></DialogHeader>
                          <div className="space-y-2 pt-2">
                            {workerAttendance.length === 0 ? (
                              <p className="text-sm text-muted-foreground text-center py-4">No attendance records yet.</p>
                            ) : (
                              workerAttendance.map((record) => (
                                <div key={record.id} className="flex items-center justify-between gap-2 py-2 border-b last:border-0">
                                  <div>
                                    <p className="text-sm font-medium">{record.date}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {format(new Date(record.signInTime), "h:mm a")}
                                      {record.signOutTime && ` - ${format(new Date(record.signOutTime), "h:mm a")}`}
                                      {record.signInTime && record.signOutTime && (
                                        <span className="ml-1">({Math.round(((new Date(record.signOutTime).getTime() - new Date(record.signInTime).getTime()) / 3600000) * 10) / 10}h)</span>
                                      )}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {record.signInLat && (
                                      <a href={`https://www.google.com/maps?q=${record.signInLat},${record.signInLng}`} target="_blank" rel="noopener noreferrer">
                                        <Button variant="secondary" size="sm"><MapPin className="w-3 h-3 mr-1" />In</Button>
                                      </a>
                                    )}
                                    {record.signOutLat && (
                                      <a href={`https://www.google.com/maps?q=${record.signOutLat},${record.signOutLng}`} target="_blank" rel="noopener noreferrer">
                                        <Button variant="secondary" size="sm"><MapPin className="w-3 h-3 mr-1" />Out</Button>
                                      </a>
                                    )}
                                    <Badge variant={record.signOutTime ? "secondary" : "default"}>{record.signOutTime ? "Done" : "Active"}</Badge>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button variant="secondary" size="icon" onClick={() => { if (confirm(`Remove ${worker.fullName}?`)) deleteWorkerMutation.mutate(worker.id); }}>
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
                <p className="text-sm text-muted-foreground">No workers yet. Add your first worker above.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="pay" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pay Calculator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">From</Label>
                    <Input type="date" className="h-8 text-sm w-36" value={payFrom} onChange={(e) => setPayFrom(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">To</Label>
                    <Input type="date" className="h-8 text-sm w-36" value={payTo} onChange={(e) => setPayTo(e.target.value)} />
                  </div>
                  <Button size="sm" variant="outline" onClick={() => window.open(`/api/export/attendance?from=${payFrom}&to=${payTo}`, "_blank")}>
                    <Download className="w-4 h-4 mr-1" />Export This Period
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Set hourly rates on each worker via the Contract button in the Workers tab. Pay is calculated from completed shifts only.</p>
              </CardContent>
            </Card>

            {workers.map((worker) => {
              const records = workerAttendance.filter((r) => r.userId === worker.id);
              const completed = todayAttendance.filter((a) => a.userId === worker.id && a.signOutTime);
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
                          <p className="text-xs text-muted-foreground">
                            {worker.hourlyRate ? `£${worker.hourlyRate}/hr` : "No rate set"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">£{payToday.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{Math.round(totalHoursToday * 10) / 10}h today</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {workers.every((w) => !w.hourlyRate) && (
              <div className="text-center py-8">
                <PoundSterling className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">Set hourly rates on workers to see pay calculations here.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="sites" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Add Job Site</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>Site Name</Label>
                  <Input placeholder="e.g. City Centre Office" value={newSiteName} onChange={(e) => setNewSiteName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Address (optional)</Label>
                  <Input placeholder="e.g. 123 Main Street" value={newSiteAddress} onChange={(e) => setNewSiteAddress(e.target.value)} />
                </div>
                <Button className="w-full" disabled={!newSiteName || createSiteMutation.isPending} onClick={() => createSiteMutation.mutate()}>
                  <Plus className="w-4 h-4 mr-1" />
                  {createSiteMutation.isPending ? "Adding..." : "Add Site"}
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
                          {assignedWorkers.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Workers: {assignedWorkers.map((w) => w.fullName).join(", ")}
                            </p>
                          )}
                          {assignedWorkers.length === 0 && <p className="text-xs text-muted-foreground mt-1">No workers assigned</p>}
                        </div>
                      </div>
                      <Button variant="secondary" size="icon" onClick={() => { if (confirm(`Remove site "${site.name}"?`)) deleteSiteMutation.mutate(site.id); }}>
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
                <p className="text-sm text-muted-foreground">No job sites yet. Add your first site above.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="feed" className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Worker Updates</h3>
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
                      <span className="text-sm font-medium">{entry.user?.fullName || "Unknown"}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{format(new Date(entry.createdAt), "MMM d, h:mm a")}</span>
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
                <p className="text-sm text-muted-foreground">No worker updates yet.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
