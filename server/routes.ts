import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import { loginSchema, insertUserSchema, updateContractSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";

const uploadDir = path.join(process.cwd(), "client", "public", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const multerStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: multerStorage, limits: { fileSize: 5 * 1024 * 1024 } });

const ADMIN_PASSWORD = "123resolve2026";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const PgStore = ConnectPgSimple(session);

  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  app.use(
    session({
      store: new PgStore({
        conString: process.env.DATABASE_URL,
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "resolve-construction-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
      },
      proxy: process.env.NODE_ENV === "production",
    })
  );

  app.post("/api/admin/login", async (req, res) => {
    try {
      const { password } = req.body;
      if (!password || password !== ADMIN_PASSWORD) {
        return res.status(401).json({ message: "Invalid admin password" });
      }
      (req.session as any).isAdmin = true;
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ message: "Admin login failed" });
    }
  });

  app.post("/api/admin/logout", (req, res) => {
    (req.session as any).isAdmin = false;
    req.session.save(() => {
      res.json({ message: "Admin logged out" });
    });
  });

  app.get("/api/admin/me", async (req, res) => {
    const isAdmin = (req.session as any)?.isAdmin;
    if (!isAdmin) return res.status(401).json({ message: "Not authenticated" });
    return res.json({ isAdmin: true });
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
      const user = await storage.getUserByUsername(parsed.data.username.trim());
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      let validPassword = false;
      if (user.password.startsWith("$2b$") || user.password.startsWith("$2a$")) {
        validPassword = await bcrypt.compare(parsed.data.password, user.password);
      } else {
        validPassword = user.password === parsed.data.password;
        if (validPassword) {
          const hashed = await bcrypt.hash(parsed.data.password, 10);
          await storage.updateUser(user.id, { password: hashed });
        }
      }
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      if (user.role === "admin") {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      (req.session as any).userId = user.id;
      const { password, ...safeUser } = user;
      return res.json(safeUser);
    } catch (error) {
      return res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await storage.getUser(userId);
    if (!user) return res.status(401).json({ message: "User not found" });
    const { password, ...safeUser } = user;
    return res.json(safeUser);
  });

  const requireAuth = async (req: any, res: any, next: any) => {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await storage.getUser(userId);
    if (!user) return res.status(401).json({ message: "User not found" });
    req.user = user;
    next();
  };

  const requireAdmin = async (req: any, res: any, next: any) => {
    const isAdmin = (req.session as any)?.isAdmin;
    if (!isAdmin) return res.status(403).json({ message: "Admin access required" });
    next();
  };

  app.get("/api/workers", requireAdmin, async (_req, res) => {
    const workers = await storage.getAllWorkers();
    const safeWorkers = workers.map(({ password, ...w }) => w);
    res.json(safeWorkers);
  });

  app.post("/api/workers", requireAdmin, async (req, res) => {
    try {
      const parsed = insertUserSchema.safeParse({ ...req.body, role: "worker" });
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid worker data" });
      }
      parsed.data.username = parsed.data.username.trim();
      parsed.data.fullName = parsed.data.fullName.trim();
      const existing = await storage.getUserByUsername(parsed.data.username);
      if (existing) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const hashedPassword = await bcrypt.hash(parsed.data.password, 10);
      const worker = await storage.createUser({ ...parsed.data, password: hashedPassword });
      const { password, ...safeWorker } = worker;
      return res.json(safeWorker);
    } catch (error) {
      return res.status(500).json({ message: "Failed to create worker" });
    }
  });

  app.patch("/api/workers/:id", requireAdmin, async (req, res) => {
    try {
      const worker = await storage.updateUser(req.params.id, req.body);
      if (!worker) return res.status(404).json({ message: "Worker not found" });
      const { password, ...safeWorker } = worker;
      return res.json(safeWorker);
    } catch (error) {
      return res.status(500).json({ message: "Failed to update worker" });
    }
  });

  app.patch("/api/workers/:id/contract", requireAdmin, async (req, res) => {
    try {
      const parsed = updateContractSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid contract data" });
      }
      const worker = await storage.updateContract(req.params.id, parsed.data);
      if (!worker) return res.status(404).json({ message: "Worker not found" });
      const { password, ...safeWorker } = worker;
      return res.json(safeWorker);
    } catch (error) {
      return res.status(500).json({ message: "Failed to update contract" });
    }
  });

  app.delete("/api/workers/:id", requireAdmin, async (req, res) => {
    await storage.deleteUser(req.params.id);
    res.json({ message: "Worker deleted" });
  });

  app.post("/api/attendance/sign-in", requireAuth, async (req: any, res) => {
    try {
      const existing = await storage.getActiveAttendance(req.user.id);
      if (existing) {
        return res.status(400).json({ message: "Already signed in" });
      }
      const record = await storage.signIn(req.user.id, req.body.lat, req.body.lng);
      return res.json(record);
    } catch (error) {
      return res.status(500).json({ message: "Sign in failed" });
    }
  });

  app.post("/api/attendance/sign-out", requireAuth, async (req: any, res) => {
    try {
      const active = await storage.getActiveAttendance(req.user.id);
      if (!active) {
        return res.status(400).json({ message: "Not signed in" });
      }
      const record = await storage.signOut(active.id, req.body.lat, req.body.lng);
      return res.json(record);
    } catch (error) {
      return res.status(500).json({ message: "Sign out failed" });
    }
  });

  app.post("/api/attendance/update-location", requireAuth, async (req: any, res) => {
    try {
      const active = await storage.getActiveAttendance(req.user.id);
      if (!active) {
        return res.status(400).json({ message: "Not currently signed in" });
      }
      const { lat, lng } = req.body;
      if (typeof lat !== "number" || typeof lng !== "number") {
        return res.status(400).json({ message: "Valid GPS coordinates required" });
      }
      const record = await storage.updateAttendanceLocation(active.id, lat, lng);
      return res.json(record);
    } catch (error) {
      return res.status(500).json({ message: "Failed to update location" });
    }
  });

  app.get("/api/attendance/status", requireAuth, async (req: any, res) => {
    const active = await storage.getActiveAttendance(req.user.id);
    res.json({ signedIn: !!active, attendance: active || null });
  });

  app.get("/api/attendance/today", requireAdmin, async (_req, res) => {
    const today = new Date().toISOString().split("T")[0];
    const records = await storage.getAttendanceByDate(today);
    const safeRecords = records.map((r) => {
      if (r.user) {
        const { password, ...safeUser } = r.user;
        return { ...r, user: safeUser };
      }
      return r;
    });
    res.json(safeRecords);
  });

  app.get("/api/attendance/worker/:id", requireAdmin, async (req, res) => {
    const records = await storage.getAttendanceByUser(req.params.id);
    res.json(records);
  });

  app.post("/api/feed", requireAuth, upload.single("image"), async (req: any, res) => {
    try {
      const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
      const entry = await storage.createFeedEntry({
        userId: req.user.id,
        note: req.body.note || null,
        imageUrl,
      });
      return res.json(entry);
    } catch (error) {
      return res.status(500).json({ message: "Failed to create feed entry" });
    }
  });

  app.get("/api/feed/mine", requireAuth, async (req: any, res) => {
    const entries = await storage.getFeedEntriesByUser(req.user.id);
    res.json(entries);
  });

  app.get("/api/feed/all", requireAdmin, async (_req, res) => {
    const entries = await storage.getAllFeedEntries();
    const safeEntries = entries.map((e) => {
      if (e.user) {
        const { password, ...safeUser } = e.user;
        return { ...e, user: safeUser };
      }
      return e;
    });
    res.json(safeEntries);
  });

  return httpServer;
}
