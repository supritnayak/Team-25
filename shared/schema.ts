import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, doublePrecision, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  username: text("username").notNull(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const categoryEnum = pgEnum("donation_category", ["food", "clothes"]);
export const donationStatusEnum = pgEnum("donation_status", ["available", "reserved", "completed"]);

export const donations = pgTable("donations", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  category: categoryEnum("category").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  availabilityStart: text("availability_start"),
  availabilityEnd: text("availability_end"),
  status: donationStatusEnum("status").default("available").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reservations = pgTable("reservations", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  donationId: varchar("donation_id").notNull().references(() => donations.id),
  receiverId: varchar("receiver_id").notNull().references(() => users.id),
  status: text("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  username: true,
  password: true,
});

export const insertDonationSchema = createInsertSchema(donations).pick({
  category: true,
  title: true,
  description: true,
  latitude: true,
  longitude: true,
  availabilityStart: true,
  availabilityEnd: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Donation = typeof donations.$inferSelect;
export type InsertDonation = z.infer<typeof insertDonationSchema>;
export type Reservation = typeof reservations.$inferSelect;
