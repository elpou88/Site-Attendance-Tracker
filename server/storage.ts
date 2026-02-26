import {
  type User,
  type InsertUser,
  type UpdateContract,
  type Attendance,
  type InsertAttendance,
  type FeedEntry,
  type InsertFeedEntry,
  users,
  attendance,
  feedEntries,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and, desc, isNull } from "drizzle-orm";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
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
        signOutLat: lat ?? null,
        signOutLng: lng ?? null,
      })
      .where(eq(attendance.id, attendanceId))
      .returning();
    return record;
  }

  async updateAttendanceLocation(attendanceId: string, lat: number, lng: number): Promise<Attendance | undefined> {
    const [record] = await db
      .update(attendance)
      .set({
        signInLat: lat,
        signInLng: lng,
      })
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
    const records = await db
      .select()
      .from(attendance)
      .where(eq(attendance.date, date))
      .orderBy(desc(attendance.signInTime));
    
    const enriched = await Promise.all(
      records.map(async (r) => {
        const user = await this.getUser(r.userId);
        return { ...r, user };
      })
    );
    return enriched;
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
    const entries = await db
      .select()
      .from(feedEntries)
      .orderBy(desc(feedEntries.createdAt));
    
    const enriched = await Promise.all(
      entries.map(async (e) => {
        const user = await this.getUser(e.userId);
        return { ...e, user };
      })
    );
    return enriched;
  }
}

export const storage = new DatabaseStorage();
