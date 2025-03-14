import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import MemoryStore from "memorystore";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import {
  loginUserSchema,
  registerUserSchema,
  insertRankingSchema,
  insertLocationSchema,
  insertMatchSchema,
  insertPlayerRankingSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Setup session middleware
  const SessionStore = MemoryStore(session);
  
  app.use(
    session({
      secret: "tennis-rank-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }, // 1 day
      store: new SessionStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
    })
  );
  
  // Setup Passport for authentication
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Configure Passport local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Incorrect username or password" });
        }
        
        if (user.password !== password) { // In a real app, use bcrypt to compare passwords
          return done(null, false, { message: "Incorrect username or password" });
        }
        
        // Check if user is suspended
        if (user.suspendedUntil && new Date(user.suspendedUntil) > new Date()) {
          return done(null, false, { 
            message: `Your account is suspended until ${new Date(user.suspendedUntil).toLocaleString()}` 
          });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );
  
  // Serialize and deserialize users for sessions
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
  
  // Middleware to check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };
  
  // Middleware to check if user is an admin
  const isAdmin = (req: Request, res: Response, next: any) => {
    if (req.isAuthenticated() && (req.user as any).role === 'admin') {
      return next();
    }
    res.status(403).json({ message: "Forbidden: Admin access required" });
  };
  
  // Helper to handle validation errors
  const validateRequest = (schema: any, data: any) => {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        throw new Error(validationError.message);
      }
      throw error;
    }
  };
  
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = validateRequest(registerUserSchema, req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      // Create new user
      const user = await storage.createUser({
        ...userData,
        role: 'player' // Always set new users as players
      });
      
      res.status(201).json({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  app.post("/api/auth/login", (req, res, next) => {
    try {
      const loginData = validateRequest(loginUserSchema, req.body);
      
      passport.authenticate("local", (err: any, user: any, info: any) => {
        if (err) {
          return next(err);
        }
        if (!user) {
          return res.status(401).json({ message: info.message });
        }
        req.logIn(user, (err) => {
          if (err) {
            return next(err);
          }
          return res.json({
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            email: user.email,
            role: user.role
          });
        });
      })(req, res, next);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Logged out successfully" });
    });
  });
  
  app.get("/api/auth/me", isAuthenticated, (req, res) => {
    const user = req.user as any;
    res.json({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      photoUrl: user.photoUrl,
      role: user.role,
      suspendedUntil: user.suspendedUntil
    });
  });
  
  // User routes
  app.get("/api/users", isAuthenticated, async (req, res) => {
    try {
      // Get all users but exclude password field
      const allUsers = Array.from((await storage.getUsers()).values());
      
      const users = allUsers.map(user => ({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        photoUrl: user.photoUrl,
        role: user.role,
        suspendedUntil: user.suspendedUntil
      }));
      
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.patch("/api/users/:id/photo", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const currentUser = req.user as any;
      
      // Users can only update their own photo unless they're an admin
      if (userId !== currentUser.id && currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden: You can only update your own photo" });
      }
      
      const { photoUrl } = req.body;
      if (!photoUrl) {
        return res.status(400).json({ message: "Photo URL is required" });
      }
      
      const updatedUser = await storage.updateUser(userId, { photoUrl });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        id: updatedUser.id,
        username: updatedUser.username,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        photoUrl: updatedUser.photoUrl
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Ranking routes
  app.post("/api/rankings", isAdmin, async (req, res) => {
    try {
      const rankingData = validateRequest(insertRankingSchema, req.body);
      const ranking = await storage.createRanking(rankingData);
      res.status(201).json(ranking);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  app.get("/api/rankings", isAuthenticated, async (req, res) => {
    try {
      const rankings = await storage.getRankings();
      
      // Filter private rankings if user is not an admin
      const user = req.user as any;
      let filteredRankings = rankings;
      
      if (user.role !== 'admin') {
        filteredRankings = rankings.filter(r => r.isPublic);
      }
      
      res.json(filteredRankings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/rankings/:id", isAuthenticated, async (req, res) => {
    try {
      const rankingId = parseInt(req.params.id);
      const ranking = await storage.getRanking(rankingId);
      
      if (!ranking) {
        return res.status(404).json({ message: "Ranking not found" });
      }
      
      // Check if user can access private ranking
      const user = req.user as any;
      if (!ranking.isPublic && user.role !== 'admin') {
        // Check if user is in this ranking
        const playerRanking = await storage.getPlayerRanking(user.id, rankingId);
        if (!playerRanking) {
          return res.status(403).json({ message: "You don't have access to this ranking" });
        }
      }
      
      res.json(ranking);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.patch("/api/rankings/:id", isAdmin, async (req, res) => {
    try {
      const rankingId = parseInt(req.params.id);
      const rankingData = req.body;
      
      const updatedRanking = await storage.updateRanking(rankingId, rankingData);
      if (!updatedRanking) {
        return res.status(404).json({ message: "Ranking not found" });
      }
      
      res.json(updatedRanking);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Player Ranking routes
  app.post("/api/player-rankings", isAdmin, async (req, res) => {
    try {
      const playerRankingData = validateRequest(insertPlayerRankingSchema, req.body);
      
      // Check if player is already in this ranking
      const existingPlayerRanking = await storage.getPlayerRanking(
        playerRankingData.playerId,
        playerRankingData.rankingId
      );
      
      if (existingPlayerRanking) {
        return res.status(400).json({ message: "Player is already in this ranking" });
      }
      
      const playerRanking = await storage.createPlayerRanking(playerRankingData);
      res.status(201).json(playerRanking);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  app.get("/api/rankings/:id/players", isAuthenticated, async (req, res) => {
    try {
      const rankingId = parseInt(req.params.id);
      const category = req.query.category as string | undefined;
      
      // Verify ranking exists and user has access
      const ranking = await storage.getRanking(rankingId);
      if (!ranking) {
        return res.status(404).json({ message: "Ranking not found" });
      }
      
      // Check if user can access private ranking
      const user = req.user as any;
      if (!ranking.isPublic && user.role !== 'admin') {
        // Check if user is in this ranking
        const playerRanking = await storage.getPlayerRanking(user.id, rankingId);
        if (!playerRanking) {
          return res.status(403).json({ message: "You don't have access to this ranking" });
        }
      }
      
      const players = await storage.getRankingPlayers(rankingId, category);
      
      // Mark current user
      const playersWithFlag = players.map(player => ({
        ...player,
        isCurrentUser: player.playerId === user.id
      }));
      
      res.json(playersWithFlag);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Location routes
  app.post("/api/locations", isAdmin, async (req, res) => {
    try {
      const locationData = validateRequest(insertLocationSchema, req.body);
      const location = await storage.createLocation(locationData);
      res.status(201).json(location);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  app.get("/api/locations", isAuthenticated, async (req, res) => {
    try {
      const locations = await storage.getLocations();
      res.json(locations);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.patch("/api/locations/:id", isAdmin, async (req, res) => {
    try {
      const locationId = parseInt(req.params.id);
      const locationData = req.body;
      
      const updatedLocation = await storage.updateLocation(locationId, locationData);
      if (!updatedLocation) {
        return res.status(404).json({ message: "Location not found" });
      }
      
      res.json(updatedLocation);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  app.delete("/api/locations/:id", isAdmin, async (req, res) => {
    try {
      const locationId = parseInt(req.params.id);
      
      const success = await storage.deleteLocation(locationId);
      if (!success) {
        return res.status(404).json({ message: "Location not found" });
      }
      
      res.status(204).end();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Match routes
  app.post("/api/matches", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      let matchData = validateRequest(insertMatchSchema, req.body);
      
      // Check if user is suspended
      if (user.suspendedUntil && new Date(user.suspendedUntil) > new Date()) {
        return res.status(403).json({ 
          message: `Your account is suspended until ${new Date(user.suspendedUntil).toLocaleString()}` 
        });
      }
      
      // Set player1Id as current user if not set
      if (!matchData.player1Id) {
        matchData = { ...matchData, player1Id: user.id };
      } else if (matchData.player1Id !== user.id && user.role !== 'admin') {
        // Only admins can create matches for other players
        return res.status(403).json({ message: "You can only record your own matches" });
      }
      
      // Check if player1 and player2 are not the same
      if (matchData.player1Id === matchData.player2Id) {
        return res.status(400).json({ message: "You cannot play against yourself" });
      }
      
      // Get ranking to check if it requires validation
      const ranking = await storage.getRanking(matchData.rankingId);
      if (!ranking) {
        return res.status(404).json({ message: "Ranking not found" });
      }
      
      // Set initial status based on ranking validation requirement
      if (ranking.requiresValidation) {
        matchData.status = 'pending';
      } else {
        matchData.status = 'approved';
      }
      
      const match = await storage.createMatch(matchData);
      
      // If match is auto-approved, update player rankings
      if (match.status === 'approved') {
        await storage.validateMatch(match.id, true);
      }
      
      res.status(201).json(match);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  app.get("/api/matches", isAuthenticated, async (req, res) => {
    try {
      const filters: {
        playerId?: number;
        rankingId?: number;
        status?: 'pending' | 'approved' | 'rejected';
      } = {};
      
      // Parse query parameters
      if (req.query.playerId) {
        filters.playerId = parseInt(req.query.playerId as string);
      }
      
      if (req.query.rankingId) {
        filters.rankingId = parseInt(req.query.rankingId as string);
      }
      
      if (req.query.status && ['pending', 'approved', 'rejected'].includes(req.query.status as string)) {
        filters.status = req.query.status as 'pending' | 'approved' | 'rejected';
      }
      
      // Regular users can only see their own matches or approved matches
      const user = req.user as any;
      if (user.role !== 'admin' && !filters.playerId) {
        // If no specific player filter, only show approved matches
        filters.status = 'approved';
      }
      
      const matches = await storage.getMatches(filters);
      res.json(matches);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/matches/:id", isAuthenticated, async (req, res) => {
    try {
      const matchId = parseInt(req.params.id);
      const match = await storage.getMatchWithDetails(matchId);
      
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      
      // Check if user can view this match
      const user = req.user as any;
      if (user.role !== 'admin' && 
          match.status !== 'approved' && 
          match.player1Id !== user.id && 
          match.player2Id !== user.id) {
        return res.status(403).json({ message: "You don't have permission to view this match" });
      }
      
      res.json(match);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Admin routes
  app.post("/api/admin/validate-match/:id", isAdmin, async (req, res) => {
    try {
      const matchId = parseInt(req.params.id);
      const { approved, rejectionReason } = req.body;
      
      if (typeof approved !== 'boolean') {
        return res.status(400).json({ message: "Approved status is required" });
      }
      
      const updatedMatch = await storage.validateMatch(matchId, approved, rejectionReason);
      if (!updatedMatch) {
        return res.status(404).json({ message: "Match not found" });
      }
      
      res.json(updatedMatch);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post("/api/admin/suspend-player/:id", isAdmin, async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      const { days } = req.body;
      
      if (!days || typeof days !== 'number' || days <= 0) {
        return res.status(400).json({ message: "Valid suspension days are required" });
      }
      
      const updatedUser = await storage.suspendPlayer(playerId, days);
      if (!updatedUser) {
        return res.status(404).json({ message: "Player not found" });
      }
      
      res.json({
        id: updatedUser.id,
        username: updatedUser.username,
        fullName: updatedUser.fullName,
        suspendedUntil: updatedUser.suspendedUntil
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Add a hack to make storage.getUsers() available for the API
  (storage as any).getUsers = async () => {
    return (storage as any).users;
  };
  
  return httpServer;
}
