import { useState } from "react";
import { useAdmin } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
} from "lucide-react";
import type { Attendance, FeedEntry, User } from "@shared/schema";
import { format, differenceInDays, parseISO } from "date-fns";
import resolveLogoPath from "@assets/Resolve_Construction_Ltd._Logo_1772117575893.jpg";

type SafeUser = Omit<User, "password">;

function ContractDialog({ worker }: { worker: SafeUser }) {
  const { toast } = useToast();
  const [contractType, setContractType] = useState(worker.contractType || "");
  const [contractStartDate, setContractStartDate] = useState(worker.contractStartDate || "");
  const [contractExpiryDate, setContractExpiryDate] = useState(worker.contractExpiryDate || "");
  const [sickDaysTotal, setSickDaysTotal] = useState(worker.sickDaysTotal?.toString() || "0");
  const [sickDaysUsed, setSickDaysUsed] = useState(worker.sickDaysUsed?.toString() || "0");
  const [holidayDaysTotal, setHolidayDaysTotal] = useState(worker.holidayDaysTotal?.toString() || "0");
  const [holidayDaysUsed, setHolidayDaysUsed] = useState(worker.holidayDaysUsed?.toString() || "0");

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
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workers"] });
      toast({ title: "Contract Updated", description: `Contract details for ${worker.fullName} have been saved.` });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const sickDaysLeft = Math.max(0, (parseInt(sickDaysTotal) || 0) - (parseInt(sickDaysUsed) || 0));
  const holidayDaysLeft = Math.max(0, (parseInt(holidayDaysTotal) || 0) - (parseInt(holidayDaysUsed) || 0));
  const contractDaysLeft = contractExpiryDate
    ? differenceInDays(parseISO(contractExpiryDate), new Date())
    : null;
  const contractExpiring = contractDaysLeft !== null && contractDaysLeft <= 30 && contractDaysLeft >= 0;
  const contractExpired = contractDaysLeft !== null && contractDaysLeft < 0;

  return (
    <div className="space-y-5 pt-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/50 rounded-md p-3 text-center">
          <HeartPulse className="w-4 h-4 mx-auto text-red-500 mb-1" />
          <p className="text-lg font-bold" data-testid={`text-sick-left-${worker.id}`}>{sickDaysLeft}</p>
          <p className="text-xs text-muted-foreground">Sick Days Left</p>
        </div>
        <div className="bg-muted/50 rounded-md p-3 text-center">
          <Palmtree className="w-4 h-4 mx-auto text-green-600 mb-1" />
          <p className="text-lg font-bold" data-testid={`text-holiday-left-${worker.id}`}>{holidayDaysLeft}</p>
          <p className="text-xs text-muted-foreground">Holiday Days Left</p>
        </div>
      </div>

      {contractDaysLeft !== null && (
        <div className={`rounded-md p-3 flex items-center gap-2 text-sm ${contractExpired ? "bg-red-50 text-red-700 border border-red-200" : contractExpiring ? "bg-orange-50 text-orange-700 border border-orange-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
          {contractExpired ? (
            <>
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Contract expired {Math.abs(contractDaysLeft)} days ago</span>
            </>
          ) : contractExpiring ? (
            <>
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Contract expires in {contractDaysLeft} days</span>
            </>
          ) : (
            <>
              <Calendar className="w-4 h-4 shrink-0" />
              <span>{contractDaysLeft} days remaining on contract</span>
            </>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label>Contract Type</Label>
        <Select value={contractType} onValueChange={setContractType}>
          <SelectTrigger data-testid={`select-contract-type-${worker.id}`}>
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

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Contract Start Date</Label>
          <Input
            type="date"
            value={contractStartDate}
            onChange={(e) => setContractStartDate(e.target.value)}
            data-testid={`input-contract-start-${worker.id}`}
          />
        </div>
        <div className="space-y-2">
          <Label>Contract Expiry Date</Label>
          <Input
            type="date"
            value={contractExpiryDate}
            onChange={(e) => setContractExpiryDate(e.target.value)}
            data-testid={`input-contract-expiry-${worker.id}`}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Total Sick Days</Label>
          <Input
            type="number"
            min="0"
            value={sickDaysTotal}
            onChange={(e) => setSickDaysTotal(e.target.value)}
            data-testid={`input-sick-total-${worker.id}`}
          />
        </div>
        <div className="space-y-2">
          <Label>Sick Days Used</Label>
          <Input
            type="number"
            min="0"
            value={sickDaysUsed}
            onChange={(e) => setSickDaysUsed(e.target.value)}
            data-testid={`input-sick-used-${worker.id}`}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Total Holiday Days</Label>
          <Input
            type="number"
            min="0"
            value={holidayDaysTotal}
            onChange={(e) => setHolidayDaysTotal(e.target.value)}
            data-testid={`input-holiday-total-${worker.id}`}
          />
        </div>
        <div className="space-y-2">
          <Label>Holiday Days Used</Label>
          <Input
            type="number"
            min="0"
            value={holidayDaysUsed}
            onChange={(e) => setHolidayDaysUsed(e.target.value)}
            data-testid={`input-holiday-used-${worker.id}`}
          />
        </div>
      </div>

      <Button
        className="w-full"
        onClick={() => updateMutation.mutate()}
        disabled={updateMutation.isPending}
        data-testid={`button-save-contract-${worker.id}`}
      >
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

  const { data: workers = [] } = useQuery<SafeUser[]>({
    queryKey: ["/api/workers"],
  });

  const { data: todayAttendance = [] } = useQuery<
    (Attendance & { user?: SafeUser })[]
  >({
    queryKey: ["/api/attendance/today"],
    refetchInterval: 30000,
  });

  const { data: allFeed = [] } = useQuery<(FeedEntry & { user?: SafeUser })[]>({
    queryKey: ["/api/feed/all"],
  });

  const { data: workerAttendance = [] } = useQuery<Attendance[]>({
    queryKey: ["/api/attendance/worker", selectedWorkerId],
    enabled: !!selectedWorkerId,
  });

  const createWorkerMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/workers", {
        fullName,
        username,
        password,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workers"] });
      setNewWorkerOpen(false);
      setFullName("");
      setUsername("");
      setPassword("");
      toast({ title: "Worker Created", description: "New worker has been added successfully." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteWorkerMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/workers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workers"] });
      toast({ title: "Worker Removed", description: "Worker has been removed." });
    },
  });

  const activeWorkers = todayAttendance.filter((a) => !a.signOutTime);
  const completedWorkers = todayAttendance.filter((a) => a.signOutTime);

  const copyCredentials = () => {
    const text = `Username: ${username}\nPassword: ${password}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Credentials copied to clipboard" });
  };

  const getContractBadge = (worker: SafeUser) => {
    if (!worker.contractExpiryDate) return null;
    const daysLeft = differenceInDays(parseISO(worker.contractExpiryDate), new Date());
    if (daysLeft < 0) {
      return <Badge variant="destructive" className="text-xs">Expired</Badge>;
    }
    if (daysLeft <= 30) {
      return <Badge className="text-xs bg-orange-500 hover:bg-orange-600">Expiring Soon</Badge>;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <img
              src={resolveLogoPath}
              alt="Resolve Construction"
              className="h-10 w-auto object-contain"
            />
            <div>
              <p className="font-semibold text-sm leading-tight" data-testid="text-admin-name">
                Resolve Construction
              </p>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => adminLogout()} data-testid="button-admin-logout">
            <LogOut className="w-4 h-4 mr-1" />
            Exit Admin
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Workers</p>
                  <p className="text-2xl font-bold mt-1" data-testid="text-total-workers">
                    {workers.length}
                  </p>
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
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Active Now</p>
                  <p className="text-2xl font-bold mt-1 text-green-600" data-testid="text-active-count">
                    {activeWorkers.length}
                  </p>
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
                  <p className="text-2xl font-bold mt-1" data-testid="text-completed-count">
                    {completedWorkers.length}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-md bg-accent flex items-center justify-center">
                  <Clock className="w-5 h-5 text-accent-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="attendance">
          <TabsList className="mb-4">
            <TabsTrigger value="attendance" data-testid="tab-attendance">
              <Clock className="w-4 h-4 mr-1" />
              Today's Attendance
            </TabsTrigger>
            <TabsTrigger value="workers" data-testid="tab-workers">
              <Users className="w-4 h-4 mr-1" />
              Workers
            </TabsTrigger>
            <TabsTrigger value="feed" data-testid="tab-feed">
              <FileText className="w-4 h-4 mr-1" />
              Activity Feed
            </TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="space-y-4">
            {activeWorkers.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Currently On Site
                </h3>
                {activeWorkers.map((record) => (
                  <Card key={record.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">
                              {record.user?.fullName?.charAt(0) || "?"}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-sm" data-testid={`text-worker-name-${record.id}`}>
                              {record.user?.fullName || "Unknown"}
                            </p>
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
                          <Badge variant="default" data-testid={`badge-active-${record.id}`}>
                            Active
                          </Badge>
                          {record.signInLat && (
                            <a
                              href={`https://www.google.com/maps?q=${record.signInLat},${record.signInLng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              data-testid={`link-location-${record.id}`}
                            >
                              <Button variant="secondary" size="sm">
                                <MapPin className="w-3.5 h-3.5 mr-1" />
                                View Map
                              </Button>
                            </a>
                          )}
                          {!record.signInLat && (
                            <Badge variant="secondary" className="text-xs">
                              <MapPinOff className="w-3 h-3 mr-1" />
                              No GPS
                            </Badge>
                          )}
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
                          <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center">
                            <span className="text-sm font-bold text-muted-foreground">
                              {record.user?.fullName?.charAt(0) || "?"}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {record.user?.fullName || "Unknown"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(record.signInTime), "h:mm a")} -{" "}
                              {record.signOutTime && format(new Date(record.signOutTime), "h:mm a")}
                            </p>
                            {(record.signInLat || record.signOutLat) && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-green-600 shrink-0" />
                                {record.signInLat && (
                                  <span>In: {record.signInLat.toFixed(4)}, {record.signInLng?.toFixed(4)}</span>
                                )}
                                {record.signInLat && record.signOutLat && <span>|</span>}
                                {record.signOutLat && (
                                  <span>Out: {record.signOutLat.toFixed(4)}, {record.signOutLng?.toFixed(4)}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {record.signInLat && (
                            <a
                              href={`https://www.google.com/maps?q=${record.signInLat},${record.signInLng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="secondary" size="sm">
                                <MapPin className="w-3.5 h-3.5 mr-1" />
                                In
                              </Button>
                            </a>
                          )}
                          {record.signOutLat && (
                            <a
                              href={`https://www.google.com/maps?q=${record.signOutLat},${record.signOutLng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="secondary" size="sm">
                                <MapPin className="w-3.5 h-3.5 mr-1" />
                                Out
                              </Button>
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
                <p className="text-sm text-muted-foreground">
                  No attendance records for today yet.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="workers" className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Manage Workers
              </h3>
              <Dialog open={newWorkerOpen} onOpenChange={setNewWorkerOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" data-testid="button-add-worker">
                    <UserPlus className="w-4 h-4 mr-1" />
                    Add Worker
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Worker</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        placeholder="e.g. John Smith"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        data-testid="input-fullname"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newUsername">Username</Label>
                      <Input
                        id="newUsername"
                        placeholder="e.g. john.smith"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        data-testid="input-new-username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Password</Label>
                      <Input
                        id="newPassword"
                        placeholder="Set a password for the worker"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        data-testid="input-new-password"
                      />
                    </div>
                    {username && password && (
                      <div className="bg-muted rounded-md p-3 space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Credentials to share with worker:</p>
                        <p className="text-sm font-mono">Username: {username}</p>
                        <p className="text-sm font-mono">Password: {password}</p>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="mt-2"
                          onClick={copyCredentials}
                          data-testid="button-copy-credentials"
                        >
                          <Copy className="w-3.5 h-3.5 mr-1" />
                          Copy Credentials
                        </Button>
                      </div>
                    )}
                    <Button
                      className="w-full"
                      disabled={
                        !fullName || !username || !password || createWorkerMutation.isPending
                      }
                      onClick={() => createWorkerMutation.mutate()}
                      data-testid="button-create-worker"
                    >
                      {createWorkerMutation.isPending ? "Creating..." : "Create Worker"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {workers.map((worker) => {
              const isActiveToday = todayAttendance.some(
                (a) => a.userId === worker.id && !a.signOutTime
              );
              const sickLeft = Math.max(0, (worker.sickDaysTotal || 0) - (worker.sickDaysUsed || 0));
              const holidayLeft = Math.max(0, (worker.holidayDaysTotal || 0) - (worker.holidayDaysUsed || 0));
              return (
                <Card key={worker.id}>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">
                            {worker.fullName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm" data-testid={`text-worker-${worker.id}`}>
                              {worker.fullName}
                            </p>
                            {getContractBadge(worker)}
                          </div>
                          <p className="text-xs text-muted-foreground">@{worker.username}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={isActiveToday ? "default" : "secondary"}>
                          {isActiveToday ? "On Site" : "Off Site"}
                        </Badge>
                        {worker.contractType && (
                          <Badge variant="outline" className="text-xs capitalize">
                            {worker.contractType}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {(worker.contractType || worker.sickDaysTotal || worker.holidayDaysTotal) && (
                      <div className="flex items-center gap-4 text-xs text-muted-foreground border-t pt-2">
                        {worker.sickDaysTotal !== null && worker.sickDaysTotal !== undefined && worker.sickDaysTotal > 0 && (
                          <span className="flex items-center gap-1">
                            <HeartPulse className="w-3 h-3 text-red-500" />
                            Sick: {sickLeft}/{worker.sickDaysTotal}
                          </span>
                        )}
                        {worker.holidayDaysTotal !== null && worker.holidayDaysTotal !== undefined && worker.holidayDaysTotal > 0 && (
                          <span className="flex items-center gap-1">
                            <Palmtree className="w-3 h-3 text-green-600" />
                            Holiday: {holidayLeft}/{worker.holidayDaysTotal}
                          </span>
                        )}
                        {worker.contractExpiryDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Expires: {format(parseISO(worker.contractExpiryDate), "dd MMM yyyy")}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2 border-t pt-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="secondary"
                            size="sm"
                            data-testid={`button-contract-${worker.id}`}
                          >
                            <Briefcase className="w-3.5 h-3.5 mr-1" />
                            Contract
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[85vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{worker.fullName} - Contract Details</DialogTitle>
                          </DialogHeader>
                          <ContractDialog worker={worker} />
                        </DialogContent>
                      </Dialog>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedWorkerId(worker.id)}
                            data-testid={`button-view-history-${worker.id}`}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            History
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{worker.fullName} - Attendance History</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-2 pt-2">
                            {workerAttendance.length === 0 ? (
                              <p className="text-sm text-muted-foreground text-center py-4">
                                No attendance records yet.
                              </p>
                            ) : (
                              workerAttendance.map((record) => (
                                <div
                                  key={record.id}
                                  className="flex items-center justify-between gap-2 py-2 border-b last:border-0"
                                >
                                  <div>
                                    <p className="text-sm font-medium">{record.date}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {format(new Date(record.signInTime), "h:mm a")}
                                      {record.signOutTime &&
                                        ` - ${format(new Date(record.signOutTime), "h:mm a")}`}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {record.signInLat && (
                                      <a
                                        href={`https://www.google.com/maps?q=${record.signInLat},${record.signInLng}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Sign-in location"
                                      >
                                        <Button variant="secondary" size="sm">
                                          <MapPin className="w-3 h-3 mr-1" />
                                          In
                                        </Button>
                                      </a>
                                    )}
                                    {record.signOutLat && (
                                      <a
                                        href={`https://www.google.com/maps?q=${record.signOutLat},${record.signOutLng}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Sign-out location"
                                      >
                                        <Button variant="secondary" size="sm">
                                          <MapPin className="w-3 h-3 mr-1" />
                                          Out
                                        </Button>
                                      </a>
                                    )}
                                    <Badge variant={record.signOutTime ? "secondary" : "default"}>
                                      {record.signOutTime ? "Completed" : "Active"}
                                    </Badge>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => {
                          if (confirm(`Remove ${worker.fullName}?`)) {
                            deleteWorkerMutation.mutate(worker.id);
                          }
                        }}
                        data-testid={`button-delete-worker-${worker.id}`}
                      >
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
                <p className="text-sm text-muted-foreground">
                  No workers yet. Add your first worker above.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="feed" className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Worker Updates
            </h3>
            {allFeed.map((entry) => (
              <Card key={entry.id}>
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">
                          {entry.user?.fullName?.charAt(0) || "?"}
                        </span>
                      </div>
                      <span className="text-sm font-medium">
                        {entry.user?.fullName || "Unknown"}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(entry.createdAt), "MMM d, h:mm a")}
                    </span>
                  </div>
                  {entry.note && (
                    <p className="text-sm leading-relaxed" data-testid={`text-admin-feed-${entry.id}`}>
                      {entry.note}
                    </p>
                  )}
                  {entry.imageUrl && (
                    <img
                      src={entry.imageUrl}
                      alt="Work update"
                      className="w-full rounded-md object-cover max-h-64"
                      data-testid={`img-admin-feed-${entry.id}`}
                    />
                  )}
                </CardContent>
              </Card>
            ))}

            {allFeed.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">
                  No worker updates yet. Workers can post updates from their portal.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
