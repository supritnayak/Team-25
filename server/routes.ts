import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";
import { storage } from "./storage";
import archiver from "archiver";
import * as fs from "fs";
import * as path from "path";

const PgSession = connectPgSimple(session);

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(
    session({
      store: new PgSession({
        pool,
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "helping-hand-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: false,
        sameSite: "lax",
      },
    })
  );

  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const { email, username, password } = req.body;
      if (!email || !username || !password) {
        return res.status(400).json({ message: "All fields are required" });
      }
      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ message: "Email already registered" });
      }
      const user = await storage.createUser({ email, username, password });
      req.session.userId = user.id;
      return res.json({ id: user.id, email: user.email, username: user.username });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      const user = await storage.getUserByEmail(email);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      req.session.userId = user.id;
      return res.json({ id: user.id, email: user.email, username: user.username });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy(() => {
      return res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    return res.json({ id: user.id, email: user.email, username: user.username });
  });

  app.post("/api/donations", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const donation = await storage.createDonation(req.session.userId, req.body);
      return res.json(donation);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/donations", async (_req: Request, res: Response) => {
    try {
      const donations = await storage.getDonations();
      return res.json(donations);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/donations/mine", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const donations = await storage.getDonationsByUser(req.session.userId);
      return res.json(donations);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/donations/:id", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const donation = await storage.updateDonation(req.params.id, req.body);
      return res.json(donation);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/reservations", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const { donationId } = req.body;
      if (!donationId) {
        return res.status(400).json({ message: "donationId required" });
      }
      const reservation = await storage.createReservation(donationId, req.session.userId);
      return res.json(reservation);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/reservations/mine", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const reservations = await storage.getReservationsByReceiver(req.session.userId);
      return res.json(reservations);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/donations/:id/details", async (req: Request, res: Response) => {
    try {
      const donation = await storage.getDonation(req.params.id);
      if (!donation) {
        return res.status(404).json({ message: "Donation not found" });
      }
      const donor = await storage.getUser(donation.userId);
      return res.json({
        ...donation,
        donorName: donor?.username || "Anonymous",
        donorEmail: donor?.email || "",
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/download-zip", (_req: Request, res: Response) => {
    const archive = archiver("zip", { zlib: { level: 9 } });
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", "attachment; filename=helping-hand.zip");
    archive.pipe(res);

    const rootDir = process.cwd();
    const includeDirs = ["app", "components", "constants", "lib", "server", "shared", "assets", "patches", "scripts"];
    const includeFiles = [
      "app.json", "babel.config.js", "drizzle.config.ts", "eslint.config.js",
      "metro.config.js", "package.json", "package-lock.json", "tsconfig.json",
    ];

    for (const dir of includeDirs) {
      const dirPath = path.join(rootDir, dir);
      if (fs.existsSync(dirPath)) {
        archive.directory(dirPath, dir);
      }
    }

    for (const file of includeFiles) {
      const filePath = path.join(rootDir, file);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: file });
      }
    }

    archive.finalize();
  });

  const httpServer = createServer(app);
  return httpServer;
}
