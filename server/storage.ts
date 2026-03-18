import {
  type User,
  type InsertUser,
  type UpdateContract,
  type Attendance,
  type InsertAttendance,
  type FeedEntry,
  type InsertFeedEntry,
  type ChatMessage,
  type InsertChatMessage,
  type JobSite,
  type InsertJobSite,
  users,
  attendance,
  feedEntries,
  chatMessages,
  jobSites,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and, desc, isNull, gte, lte } from "drizzle-orm";
import pg from "pg";
import { getDbUrl, isSslDisabled, parseDbUrl } from "./db-url";

const dbUrl = getDbUrl();
const sslDisabled = isSslDisabled(dbUrl);
const parsed = parseDbUrl(dbUrl);

console.log(`[db] Connecting to host=${parsed.host} port=${parsed.port} db=${parsed.database} ssl=${sslDisabled ? "disabled" : "enabled"}`);

export const pool = new pg.Pool({
  host: parsed.host,
  port: parsed.port,
  user: parsed.user,
  password: parsed.password,
  database: parsed.database,
  ssl: sslDisabled ? false : { rejectUnauthorized: false },
  max: 10,
  connectionTimeoutMillis: 15000,
  idleTimeoutMillis: 30000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 5000,
  allowExitOnIdle: false,
});

pool.on("error", (err) => {
  console.error("[db] Unexpected pool client error:", err.message);
});

const db = drizzle(pool);

async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const isConnectionError =
        err.code === "ECONNRESET" ||
        err.code === "ECONNREFUSED" ||
        err.code === "EPIPE" ||
        err.message?.includes("Connection terminated") ||
        err.message?.includes("connection timeout");
      if (isConnectionError && attempt < retries) {
        console.warn(`[db] Connection error (attempt ${attempt}/${retries}): ${err.message}. Retrying...`);
        await new Promise((r) => setTimeout(r, 300 * attempt));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Unreachable");
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllWorkers(): Promise<User[]>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  updateContract(id: string, data: UpdateContract): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;

  signIn(userId: string, lat?: number, lng?: number): Promise<Attendance>;
  signOut(attendanceId: string, lat?: number, lng?: number): Promise<Attendance | undefined>;
  updateAttendanceLocation(attendanceId: string, lat: number, lng: number): Promise<Attendance | undefined>;
  getActiveAttendance(userId: string): Promise<Attendance | undefined>;
  getAttendanceByDate(date: string): Promise<(Attendance & { user?: User })[]>;
  getAttendanceByUser(userId: string): Promise<Attendance[]>;
  getAttendanceInRange(from: string, to: string): Promise<(Attendance & { user?: User })[]>;

  createFeedEntry(entry: InsertFeedEntry): Promise<FeedEntry>;
  getFeedEntriesByUser(userId: string): Promise<FeedEntry[]>;
  getAllFeedEntries(): Promise<(FeedEntry & { user?: User })[]>;

  createChatMessage(msg: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(limit?: number): Promise<(ChatMessage & { user?: User })[]>;

  getAllJobSites(): Promise<JobSite[]>;
  createJobSite(site: InsertJobSite): Promise<JobSite>;
  updateJobSite(id: string, data: Partial<InsertJobSite>): Promise<JobSite | undefined>;
  deleteJobSite(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    return withRetry(async () => {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    });
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return withRetry(async () => {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    });
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    return withRetry(async () => {
      const [user] = await db.insert(users).values(insertUser).returning();
      return user;
    });
  }

  async getAllWorkers(): Promise<User[]> {
    return withRetry(() => db.select().from(users).where(eq(users.role, "worker")));
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    return withRetry(async () => {
      const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
      return user;
    });
  }

  async updateContract(id: string, data: UpdateContract): Promise<User | undefined> {
    return withRetry(async () => {
      const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
      return user;
    });
  }

  async deleteUser(id: string): Promise<void> {
    return withRetry(() => db.delete(users).where(eq(users.id, id)).then(() => undefined));
  }

  async signIn(userId: string, lat?: number, lng?: number): Promise<Attendance> {
    return withRetry(async () => {
      const today = new Date().toISOString().split("T")[0];
      const [record] = await db
        .insert(attendance)
        .values({
          userId,
          date: today,
          signInTime: new Date(),
          signInLat: lat ?? null,
          signInLng: lng ?? null,
        })
        .returning();
      return record;
    });
  }

  async signOut(attendanceId: string, lat?: number, lng?: number): Promise<Attendance | undefined> {
    return withRetry(async () => {
      const [record] = await db
        .update(attendance)
        .set({
          signOutTime: new Date(),
          signOutLng: lng ?? null,
          signOutLat: lat ?? null,
        })
        .where(eq(attendance.id, attendanceId))
        .returning();
      return record;
    });
  }

  async updateAttendanceLocation(attendanceId: string, lat: number, lng: number): Promise<Attendance | undefined> {
    return withRetry(async () => {
      const [record] = await db
        .update(attendance)
        .set({ signInLat: lat, signInLng: lng })
        .where(eq(attendance.id, attendanceId))
        .returning();
      return record;
    });
  }

  async getActiveAttendance(userId: string): Promise<Attendance | undefined> {
    return withRetry(async () => {
      const [record] = await db
        .select()
        .from(attendance)
        .where(and(eq(attendance.userId, userId), isNull(attendance.signOutTime)));
      return record;
    });
  }

  async getAttendanceByDate(date: string): Promise<(Attendance & { user?: User })[]> {
    return withRetry(async () => {
      const rows = await db
        .select({ a: attendance, u: users })
        .from(attendance)
        .leftJoin(users, eq(attendance.userId, users.id))
        .where(eq(attendance.date, date))
        .orderBy(desc(attendance.signInTime));
      return rows.map((r) => ({ ...r.a, user: r.u ?? undefined }));
    });
  }

  async getAttendanceByUser(userId: string): Promise<Attendance[]> {
    return withRetry(() =>
      db
        .select()
        .from(attendance)
        .where(eq(attendance.userId, userId))
        .orderBy(desc(attendance.signInTime))
    );
  }

  async getAttendanceInRange(from: string, to: string): Promise<(Attendance & { user?: User })[]> {
    return withRetry(async () => {
      const rows = await db
        .select({ a: attendance, u: users })
        .from(attendance)
        .leftJoin(users, eq(attendance.userId, users.id))
        .where(and(gte(attendance.date, from), lte(attendance.date, to)))
        .orderBy(desc(attendance.signInTime));
      return rows.map((r) => ({ ...r.a, user: r.u ?? undefined }));
    });
  }

  async createFeedEntry(entry: InsertFeedEntry): Promise<FeedEntry> {
    return withRetry(async () => {
      const [feedEntry] = await db.insert(feedEntries).values(entry).returning();
      return feedEntry;
    });
  }

  async getFeedEntriesByUser(userId: string): Promise<FeedEntry[]> {
    return withRetry(() =>
      db
        .select()
        .from(feedEntries)
        .where(eq(feedEntries.userId, userId))
        .orderBy(desc(feedEntries.createdAt))
    );
  }

  async getAllFeedEntries(): Promise<(FeedEntry & { user?: User })[]> {
    return withRetry(async () => {
      const rows = await db
        .select({ f: feedEntries, u: users })
        .from(feedEntries)
        .leftJoin(users, eq(feedEntries.userId, users.id))
        .orderBy(desc(feedEntries.createdAt));
      return rows.map((r) => ({ ...r.f, user: r.u ?? undefined }));
    });
  }

  async createChatMessage(msg: InsertChatMessage): Promise<ChatMessage> {
    return withRetry(async () => {
      const [chatMsg] = await db.insert(chatMessages).values(msg).returning();
      return chatMsg;
    });
  }

  async getChatMessages(limit = 100): Promise<(ChatMessage & { user?: User })[]> {
    return withRetry(async () => {
      const rows = await db
        .select({ m: chatMessages, u: users })
        .from(chatMessages)
        .leftJoin(users, eq(chatMessages.userId, users.id))
        .orderBy(desc(chatMessages.createdAt))
        .limit(limit);
      return rows.map((r) => ({ ...r.m, user: r.u ?? undefined })).reverse();
    });
  }

  async getAllJobSites(): Promise<JobSite[]> {
    return withRetry(() => db.select().from(jobSites).orderBy(jobSites.name));
  }

  async createJobSite(site: InsertJobSite): Promise<JobSite> {
    return withRetry(async () => {
      const [s] = await db.insert(jobSites).values(site).returning();
      return s;
    });
  }

  async updateJobSite(id: string, data: Partial<InsertJobSite>): Promise<JobSite | undefined> {
    return withRetry(async () => {
      const [s] = await db.update(jobSites).set(data).where(eq(jobSites.id, id)).returning();
      return s;
    });
  }

  async deleteJobSite(id: string): Promise<void> {
    return withRetry(() => db.delete(jobSites).where(eq(jobSites.id, id)).then(() => undefined));
  }
}

export const storage = new DatabaseStorage();
