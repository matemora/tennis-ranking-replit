import { pgTable, text, serial, integer, boolean, timestamp, json, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define enums
export const playerCategoryEnum = pgEnum('player_category', ['C', 'B', 'A', 'S', 'SS']);
export const matchStatusEnum = pgEnum('match_status', ['pending', 'approved', 'rejected']);
export const userRoleEnum = pgEnum('user_role', ['player', 'admin']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  photoUrl: text("photo_url"),
  role: userRoleEnum("role").notNull().default('player'),
  suspendedUntil: timestamp("suspended_until"),
});

// Rankings table
export const rankings = pgTable("rankings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").notNull().default(true),
  requiresValidation: boolean("requires_validation").notNull().default(false),
  createdById: integer("created_by_id").notNull().references(() => users.id),
});

// Player categories within rankings
export const playerRankings = pgTable("player_rankings", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => users.id),
  rankingId: integer("ranking_id").notNull().references(() => rankings.id),
  category: playerCategoryEnum("category").notNull().default('C'),
  points: integer("points").notNull().default(0),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
});

// Locations table
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  coordinates: json("coordinates").$type<{ lat: number; lng: number }>(),
  createdById: integer("created_by_id").notNull().references(() => users.id),
});

// Matches table
export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  rankingId: integer("ranking_id").notNull().references(() => rankings.id),
  player1Id: integer("player1_id").notNull().references(() => users.id),
  player2Id: integer("player2_id").notNull().references(() => users.id),
  locationId: integer("location_id").references(() => locations.id),
  locationName: text("location_name"), // For custom locations
  photoUrl: text("photo_url"),
  status: matchStatusEnum("status").notNull().default('pending'),
  rejectionReason: text("rejection_reason"),
  playedAt: timestamp("played_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  score: json("score").$type<{
    sets: Array<{
      player1Score: number;
      player2Score: number;
    }>;
    tiebreak?: {
      player1Score: number;
      player2Score: number;
    };
  }>().notNull(),
});

// Schemas for insertions
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertRankingSchema = createInsertSchema(rankings).omit({ id: true });
export const insertPlayerRankingSchema = createInsertSchema(playerRankings).omit({ id: true });
export const insertLocationSchema = createInsertSchema(locations).omit({ id: true });
export const insertMatchSchema = createInsertSchema(matches).omit({ id: true, createdAt: true });

// Extended schemas for validation
export const registerUserSchema = insertUserSchema.omit({ role: true, suspendedUntil: true });
export const loginUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;

export type Ranking = typeof rankings.$inferSelect;
export type InsertRanking = z.infer<typeof insertRankingSchema>;

export type PlayerRanking = typeof playerRankings.$inferSelect;
export type InsertPlayerRanking = z.infer<typeof insertPlayerRankingSchema>;

export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;

export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;

// Player with category for displaying in rankings
export type PlayerWithRanking = {
  playerId: number;
  username: string;
  fullName: string;
  photoUrl?: string;
  category: 'C' | 'B' | 'A' | 'S' | 'SS';
  points: number;
  position: number; 
  wins: number;
  losses: number;
  isCurrentUser: boolean;
};

// Match with player details for display
export type MatchWithDetails = Match & {
  player1: {
    id: number;
    username: string;
    fullName: string;
    photoUrl?: string;
  };
  player2: {
    id: number;
    username: string;
    fullName: string;
    photoUrl?: string;
  };
  location?: {
    id: number;
    name: string;
  };
  ranking: {
    id: number;
    name: string;
  };
};
