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
  users,
  attendance,
  feedEntries,
  chatMessages,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and, desc, isNull } from "drizzle-orm";
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
  idleTimeoutMillis: 10000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

pool.on("error", (err) => {
  console.error("[db] Unexpected pool client error:", err.message);
});

const db = drizzle(pool);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllWorkers(): Promise<User[]>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  updateContract(id: string, data: UpdateContract): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;

  signIn(userId: string, lat?: number, lng?: number): Promise<Attendance>;
  signOut(attendanceId: string, lat?: number, lng?: number): Promise<Attendance | undefined>;
  updateAttendanceLocation(attendanceId: string, lat: number, lng: number): Promise<Attendance | undefined>;
  getActiveAttendance(userId: string): Promise<Attendance | undefined>;
  getAttendanceByDate(date: string): Promise<(Attendance & { user?: User })[]>;
  getAttendanceByUser(userId: string): Promise<Attendance[]>;

  createFeedEntry(entry: InsertFeedEntry): Promise<FeedEntry>;
  getFeedEntriesByUser(userId: string): Promise<FeedEntry[]>;
  getAllFeedEntries(): Promise<(FeedEntry & { user?: User })[]>;

  createChatMessage(msg: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(limit?: number): Promise<(ChatMessage & { user?: User })[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllWorkers(): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, "worker"));
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async updateContract(id: string, data: UpdateContract): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async signIn(userId: string, lat?: number, lng?: number): Promise<Attendance> {
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
  }

  async signOut(attendanceId: string, lat?: number, lng?: number): Promise<Attendance | undefined> {
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
  }

  async updateAttendanceLocation(attendanceId: string, lat: number, lng: number): Promise<Attendance | undefined> {
    const [record] = await db
      .update(attendance)
      .set({ signInLat: lat, signInLng: lng })
      .where(eq(attendance.id, attendanceId))
      .returning();
    return record;
  }

  async getActiveAttendance(userId: string): Promise<Attendance | undefined> {
    const [record] = await db
      .select()
      .from(attendance)
      .where(and(eq(attendance.userId, userId), isNull(attendance.signOutTime)));
    return record;
  }

  async getAttendanceByDate(date: string): Promise<(Attendance & { user?: User })[]> {
    const rows = await db
      .select({ a: attendance, u: users })
      .from(attendance)
      .leftJoin(users, eq(attendance.userId, users.id))
      .where(eq(attendance.date, date))
      .orderBy(desc(attendance.signInTime));
    return rows.map((r) => ({ ...r.a, user: r.u ?? undefined }));
  }

  async getAttendanceByUser(userId: string): Promise<Attendance[]> {
    return db
      .select()
      .from(attendance)
      .where(eq(attendance.userId, userId))
      .orderBy(desc(attendance.signInTime));
  }

  async createFeedEntry(entry: InsertFeedEntry): Promise<FeedEntry> {
    const [feedEntry] = await db.insert(feedEntries).values(entry).returning();
    return feedEntry;
  }

  async getFeedEntriesByUser(userId: string): Promise<FeedEntry[]> {
    return db
      .select()
      .from(feedEntries)
      .where(eq(feedEntries.userId, userId))
      .orderBy(desc(feedEntries.createdAt));
  }

  async getAllFeedEntries(): Promise<(FeedEntry & { user?: User })[]> {
    const rows = await db
      .select({ f: feedEntries, u: users })
      .from(feedEntries)
      .leftJoin(users, eq(feedEntries.userId, users.id))
      .orderBy(desc(feedEntries.createdAt));
    return rows.map((r) => ({ ...r.f, user: r.u ?? undefined }));
  }

  async createChatMessage(msg: InsertChatMessage): Promise<ChatMessage> {
    const [chatMsg] = await db.insert(chatMessages).values(msg).returning();
    return chatMsg;
  }

  async getChatMessages(limit = 100): Promise<(ChatMessage & { user?: User })[]> {
    const rows = await db
      .select({ m: chatMessages, u: users })
      .from(chatMessages)
      .leftJoin(users, eq(chatMessages.userId, users.id))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);
    return rows.map((r) => ({ ...r.m, user: r.u ?? undefined })).reverse();
  }
}

export const storage = new DatabaseStorage();
