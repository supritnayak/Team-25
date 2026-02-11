import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import {
  type User,
  type InsertUser,
  type Donation,
  type InsertDonation,
  type Reservation,
  users,
  donations,
  reservations,
} from "@shared/schema";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createDonation(userId: string, donation: InsertDonation): Promise<Donation>;
  getDonations(): Promise<(Donation & { donorName: string })[]>;
  getDonationsByUser(userId: string): Promise<Donation[]>;
  getDonation(id: string): Promise<Donation | undefined>;
  updateDonation(id: string, data: Partial<Donation>): Promise<Donation | undefined>;
  createReservation(donationId: string, receiverId: string): Promise<Reservation>;
  getReservationsByReceiver(receiverId: string): Promise<(Reservation & { donation: Donation })[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async createDonation(userId: string, donation: InsertDonation): Promise<Donation> {
    const result = await db
      .insert(donations)
      .values({ ...donation, userId })
      .returning();
    return result[0];
  }

  async getDonations(): Promise<(Donation & { donorName: string })[]> {
    const result = await db
      .select({
        id: donations.id,
        userId: donations.userId,
        category: donations.category,
        title: donations.title,
        description: donations.description,
        latitude: donations.latitude,
        longitude: donations.longitude,
        availabilityStart: donations.availabilityStart,
        availabilityEnd: donations.availabilityEnd,
        status: donations.status,
        createdAt: donations.createdAt,
        donorName: users.username,
      })
      .from(donations)
      .leftJoin(users, eq(donations.userId, users.id))
      .where(eq(donations.status, "available"));
    return result.map((r) => ({ ...r, donorName: r.donorName || "Anonymous" }));
  }

  async getDonationsByUser(userId: string): Promise<Donation[]> {
    return db.select().from(donations).where(eq(donations.userId, userId));
  }

  async getDonation(id: string): Promise<Donation | undefined> {
    const result = await db.select().from(donations).where(eq(donations.id, id));
    return result[0];
  }

  async updateDonation(id: string, data: Partial<Donation>): Promise<Donation | undefined> {
    const result = await db.update(donations).set(data).where(eq(donations.id, id)).returning();
    return result[0];
  }

  async createReservation(donationId: string, receiverId: string): Promise<Reservation> {
    await db
      .update(donations)
      .set({ status: "reserved" })
      .where(eq(donations.id, donationId));

    const result = await db
      .insert(reservations)
      .values({ donationId, receiverId })
      .returning();
    return result[0];
  }

  async getReservationsByReceiver(receiverId: string): Promise<(Reservation & { donation: Donation })[]> {
    const result = await db
      .select()
      .from(reservations)
      .leftJoin(donations, eq(reservations.donationId, donations.id))
      .where(eq(reservations.receiverId, receiverId));

    return result.map((r) => ({
      ...r.reservations,
      donation: r.donations!,
    }));
  }
}

export const storage = new DatabaseStorage();
