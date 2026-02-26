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
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  UserPlus,
  LogOut,
  MapPin,
  Clock,
  Activity,
  FileText,
  Trash2,
  Eye,
  Copy,
} from "lucide-react";
import type { Attendance, FeedEntry, User } from "@shared/schema";
import { format } from "date-fns";
import resolveLogoPath from "@assets/Resolve_Construction_Ltd._Logo_1772117575893.jpg";

type SafeUser = Omit<User, "password">;

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
                                Location
                              </Button>
                            </a>
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
              return (
                <Card key={worker.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">
                            {worker.fullName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm" data-testid={`text-worker-${worker.id}`}>
                            {worker.fullName}
                          </p>
                          <p className="text-xs text-muted-foreground">@{worker.username}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={isActiveToday ? "default" : "secondary"}>
                          {isActiveToday ? "On Site" : "Off Site"}
                        </Badge>
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
