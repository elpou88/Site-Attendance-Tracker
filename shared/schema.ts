import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, doublePrecision, date, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("worker"),
  active: boolean("active").notNull().default(true),
  contractType: text("contract_type"),
  contractStartDate: date("contract_start_date"),
  contractExpiryDate: date("contract_expiry_date"),
  sickDaysTotal: integer("sick_days_total").default(0),
  sickDaysUsed: integer("sick_days_used").default(0),
  holidayDaysTotal: integer("holiday_days_total").default(0),
  holidayDaysUsed: integer("holiday_days_used").default(0),
});

export const attendance = pgTable("attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  date: date("date").notNull(),
  signInTime: timestamp("sign_in_time").notNull(),
  signOutTime: timestamp("sign_out_time"),
  signInLat: doublePrecision("sign_in_lat"),
  signInLng: doublePrecision("sign_in_lng"),
  signOutLat: doublePrecision("sign_out_lat"),
  signOutLng: doublePrecision("sign_out_lng"),
});

export const feedEntries = pgTable("feed_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  note: text("note"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").notNull().default(sql`NOW()`),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  role: true,
});

export const updateContractSchema = z.object({
  contractType: z.string().nullable().optional(),
  contractStartDate: z.string().nullable().optional(),
  contractExpiryDate: z.string().nullable().optional(),
  sickDaysTotal: z.number().int().min(0).nullable().optional(),
  sickDaysUsed: z.number().int().min(0).nullable().optional(),
  holidayDaysTotal: z.number().int().min(0).nullable().optional(),
  holidayDaysUsed: z.number().int().min(0).nullable().optional(),
});

export const insertAttendanceSchema = createInsertSchema(attendance).pick({
  userId: true,
  date: true,
  signInTime: true,
  signInLat: true,
  signInLng: true,
});

export const insertFeedEntrySchema = createInsertSchema(feedEntries).pick({
  userId: true,
  note: true,
  imageUrl: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateContract = z.infer<typeof updateContractSchema>;
export type User = typeof users.$inferSelect;
export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type FeedEntry = typeof feedEntries.$inferSelect;
export type InsertFeedEntry = z.infer<typeof insertFeedEntrySchema>;
