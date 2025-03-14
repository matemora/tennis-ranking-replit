import {
  users,
  rankings,
  playerRankings,
  locations,
  matches,
  type User,
  type InsertUser,
  type Ranking,
  type InsertRanking,
  type PlayerRanking,
  type InsertPlayerRanking,
  type Location,
  type InsertLocation,
  type Match,
  type InsertMatch,
  type PlayerWithRanking,
  type MatchWithDetails
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
  // Ranking operations
  createRanking(ranking: InsertRanking): Promise<Ranking>;
  getRanking(id: number): Promise<Ranking | undefined>;
  getRankings(): Promise<Ranking[]>;
  updateRanking(id: number, ranking: Partial<Ranking>): Promise<Ranking | undefined>;
  
  // Player Ranking operations
  getPlayerRanking(playerId: number, rankingId: number): Promise<PlayerRanking | undefined>;
  createPlayerRanking(playerRanking: InsertPlayerRanking): Promise<PlayerRanking>;
  updatePlayerRanking(id: number, playerRanking: Partial<PlayerRanking>): Promise<PlayerRanking | undefined>;
  getRankingPlayers(rankingId: number, category?: string): Promise<PlayerWithRanking[]>;
  
  // Location operations
  createLocation(location: InsertLocation): Promise<Location>;
  getLocation(id: number): Promise<Location | undefined>;
  getLocations(): Promise<Location[]>;
  updateLocation(id: number, location: Partial<Location>): Promise<Location | undefined>;
  deleteLocation(id: number): Promise<boolean>;
  
  // Match operations
  createMatch(match: InsertMatch): Promise<Match>;
  getMatch(id: number): Promise<Match | undefined>;
  getMatchWithDetails(id: number): Promise<MatchWithDetails | undefined>;
  getMatches(filters?: {
    playerId?: number;
    rankingId?: number;
    status?: 'pending' | 'approved' | 'rejected';
  }): Promise<MatchWithDetails[]>;
  updateMatch(id: number, match: Partial<Match>): Promise<Match | undefined>;
  
  // Admin operations
  suspendPlayer(playerId: number, daysToSuspend: number): Promise<User | undefined>;
  validateMatch(matchId: number, isApproved: boolean, rejectionReason?: string): Promise<Match | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private rankings: Map<number, Ranking>;
  private playerRankings: Map<number, PlayerRanking>;
  private locations: Map<number, Location>;
  private matches: Map<number, Match>;
  
  private userIdCounter: number;
  private rankingIdCounter: number;
  private playerRankingIdCounter: number;
  private locationIdCounter: number;
  private matchIdCounter: number;

  constructor() {
    this.users = new Map();
    this.rankings = new Map();
    this.playerRankings = new Map();
    this.locations = new Map();
    this.matches = new Map();
    
    this.userIdCounter = 1;
    this.rankingIdCounter = 1;
    this.playerRankingIdCounter = 1;
    this.locationIdCounter = 1;
    this.matchIdCounter = 1;
    
    // Add a default admin user
    this.createUser({
      username: 'admin',
      password: 'adminpass', // In a real app this would be hashed
      fullName: 'Administrator',
      email: 'admin@tennisrank.com',
      role: 'admin',
      photoUrl: undefined,
      suspendedUntil: undefined
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Ranking operations
  async createRanking(insertRanking: InsertRanking): Promise<Ranking> {
    const id = this.rankingIdCounter++;
    const ranking: Ranking = { ...insertRanking, id };
    this.rankings.set(id, ranking);
    return ranking;
  }
  
  async getRanking(id: number): Promise<Ranking | undefined> {
    return this.rankings.get(id);
  }
  
  async getRankings(): Promise<Ranking[]> {
    return Array.from(this.rankings.values());
  }
  
  async updateRanking(id: number, rankingData: Partial<Ranking>): Promise<Ranking | undefined> {
    const ranking = this.rankings.get(id);
    if (!ranking) return undefined;
    
    const updatedRanking = { ...ranking, ...rankingData };
    this.rankings.set(id, updatedRanking);
    return updatedRanking;
  }
  
  // Player Ranking operations
  async getPlayerRanking(playerId: number, rankingId: number): Promise<PlayerRanking | undefined> {
    return Array.from(this.playerRankings.values()).find(
      (pr) => pr.playerId === playerId && pr.rankingId === rankingId
    );
  }
  
  async createPlayerRanking(insertPlayerRanking: InsertPlayerRanking): Promise<PlayerRanking> {
    const id = this.playerRankingIdCounter++;
    const playerRanking: PlayerRanking = { ...insertPlayerRanking, id };
    this.playerRankings.set(id, playerRanking);
    return playerRanking;
  }
  
  async updatePlayerRanking(id: number, data: Partial<PlayerRanking>): Promise<PlayerRanking | undefined> {
    const playerRanking = this.playerRankings.get(id);
    if (!playerRanking) return undefined;
    
    const updatedPlayerRanking = { ...playerRanking, ...data };
    this.playerRankings.set(id, updatedPlayerRanking);
    return updatedPlayerRanking;
  }
  
  async getRankingPlayers(rankingId: number, category?: string): Promise<PlayerWithRanking[]> {
    // Get all player rankings for this ranking
    let playerRankingsInRanking = Array.from(this.playerRankings.values())
      .filter(pr => pr.rankingId === rankingId);
    
    // Filter by category if provided
    if (category) {
      playerRankingsInRanking = playerRankingsInRanking.filter(pr => pr.category === category);
    }
    
    // Sort by points (descending)
    playerRankingsInRanking.sort((a, b) => b.points - a.points);
    
    // Create PlayerWithRanking objects
    const result: PlayerWithRanking[] = [];
    for (let i = 0; i < playerRankingsInRanking.length; i++) {
      const pr = playerRankingsInRanking[i];
      const user = this.users.get(pr.playerId);
      if (user) {
        result.push({
          playerId: user.id,
          username: user.username,
          fullName: user.fullName,
          photoUrl: user.photoUrl,
          category: pr.category,
          points: pr.points,
          position: i + 1, // 1-based position
          wins: pr.wins,
          losses: pr.losses,
          isCurrentUser: false // This will be set by the client
        });
      }
    }
    
    return result;
  }
  
  // Location operations
  async createLocation(insertLocation: InsertLocation): Promise<Location> {
    const id = this.locationIdCounter++;
    const location: Location = { ...insertLocation, id };
    this.locations.set(id, location);
    return location;
  }
  
  async getLocation(id: number): Promise<Location | undefined> {
    return this.locations.get(id);
  }
  
  async getLocations(): Promise<Location[]> {
    return Array.from(this.locations.values());
  }
  
  async updateLocation(id: number, locationData: Partial<Location>): Promise<Location | undefined> {
    const location = this.locations.get(id);
    if (!location) return undefined;
    
    const updatedLocation = { ...location, ...locationData };
    this.locations.set(id, updatedLocation);
    return updatedLocation;
  }
  
  async deleteLocation(id: number): Promise<boolean> {
    return this.locations.delete(id);
  }
  
  // Match operations
  async createMatch(insertMatch: InsertMatch): Promise<Match> {
    const id = this.matchIdCounter++;
    const match: Match = { ...insertMatch, id };
    this.matches.set(id, match);
    return match;
  }
  
  async getMatch(id: number): Promise<Match | undefined> {
    return this.matches.get(id);
  }
  
  async getMatchWithDetails(id: number): Promise<MatchWithDetails | undefined> {
    const match = this.matches.get(id);
    if (!match) return undefined;
    
    return this.enrichMatch(match);
  }
  
  async getMatches(filters?: {
    playerId?: number;
    rankingId?: number;
    status?: 'pending' | 'approved' | 'rejected';
  }): Promise<MatchWithDetails[]> {
    let filteredMatches = Array.from(this.matches.values());
    
    if (filters) {
      if (filters.playerId) {
        filteredMatches = filteredMatches.filter(
          m => m.player1Id === filters.playerId || m.player2Id === filters.playerId
        );
      }
      
      if (filters.rankingId) {
        filteredMatches = filteredMatches.filter(m => m.rankingId === filters.rankingId);
      }
      
      if (filters.status) {
        filteredMatches = filteredMatches.filter(m => m.status === filters.status);
      }
    }
    
    // Sort by date (most recent first)
    filteredMatches.sort((a, b) => 
      new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime()
    );
    
    // Enrich with player and location details
    const enrichedMatches: MatchWithDetails[] = [];
    for (const match of filteredMatches) {
      const enrichedMatch = await this.enrichMatch(match);
      if (enrichedMatch) {
        enrichedMatches.push(enrichedMatch);
      }
    }
    
    return enrichedMatches;
  }
  
  async updateMatch(id: number, matchData: Partial<Match>): Promise<Match | undefined> {
    const match = this.matches.get(id);
    if (!match) return undefined;
    
    const updatedMatch = { ...match, ...matchData };
    this.matches.set(id, updatedMatch);
    return updatedMatch;
  }
  
  // Helper to enrich a match with related data
  private async enrichMatch(match: Match): Promise<MatchWithDetails | undefined> {
    const player1 = this.users.get(match.player1Id);
    const player2 = this.users.get(match.player2Id);
    const ranking = this.rankings.get(match.rankingId);
    
    if (!player1 || !player2 || !ranking) return undefined;
    
    const enrichedMatch: MatchWithDetails = {
      ...match,
      player1: {
        id: player1.id,
        username: player1.username,
        fullName: player1.fullName,
        photoUrl: player1.photoUrl
      },
      player2: {
        id: player2.id,
        username: player2.username,
        fullName: player2.fullName,
        photoUrl: player2.photoUrl
      },
      ranking: {
        id: ranking.id,
        name: ranking.name
      }
    };
    
    // Add location if it exists
    if (match.locationId) {
      const location = this.locations.get(match.locationId);
      if (location) {
        enrichedMatch.location = {
          id: location.id,
          name: location.name
        };
      }
    }
    
    return enrichedMatch;
  }
  
  // Admin operations
  async suspendPlayer(playerId: number, daysToSuspend: number): Promise<User | undefined> {
    const user = this.users.get(playerId);
    if (!user) return undefined;
    
    const suspendedUntil = new Date();
    suspendedUntil.setDate(suspendedUntil.getDate() + daysToSuspend);
    
    const updatedUser = { ...user, suspendedUntil };
    this.users.set(playerId, updatedUser);
    return updatedUser;
  }
  
  async validateMatch(matchId: number, isApproved: boolean, rejectionReason?: string): Promise<Match | undefined> {
    const match = this.matches.get(matchId);
    if (!match) return undefined;
    
    const status = isApproved ? 'approved' : 'rejected';
    const updatedMatch = { 
      ...match, 
      status, 
      rejectionReason: isApproved ? undefined : (rejectionReason || 'No reason provided') 
    };
    
    this.matches.set(matchId, updatedMatch);
    
    // If approved, update player rankings
    if (isApproved) {
      await this.updatePlayerRankingsForMatch(updatedMatch);
    }
    
    return updatedMatch;
  }
  
  // Helper to update player rankings after a match is approved
  private async updatePlayerRankingsForMatch(match: Match): Promise<void> {
    // Determine winner based on score
    let player1IsWinner = false;
    let player1Sets = 0;
    let player2Sets = 0;
    
    for (const set of match.score.sets) {
      if (set.player1Score > set.player2Score) {
        player1Sets++;
      } else if (set.player2Score > set.player1Score) {
        player2Sets++;
      }
    }
    
    player1IsWinner = player1Sets > player2Sets;
    
    // Update player rankings
    const player1Ranking = await this.getPlayerRanking(match.player1Id, match.rankingId);
    const player2Ranking = await this.getPlayerRanking(match.player2Id, match.rankingId);
    
    // If players don't have a ranking entry yet, create one
    if (!player1Ranking) {
      await this.createPlayerRanking({
        playerId: match.player1Id,
        rankingId: match.rankingId,
        category: 'C',
        points: player1IsWinner ? 10 : 0,
        wins: player1IsWinner ? 1 : 0,
        losses: player1IsWinner ? 0 : 1
      });
    } else {
      // Update existing player1 ranking
      const points = player1Ranking.points + (player1IsWinner ? 10 : 0);
      const wins = player1Ranking.wins + (player1IsWinner ? 1 : 0);
      const losses = player1Ranking.losses + (player1IsWinner ? 0 : 1);
      
      await this.updatePlayerRanking(player1Ranking.id, { points, wins, losses });
      
      // Update category based on points
      if (points >= 1000 && player1Ranking.category !== 'SS') {
        await this.updatePlayerRanking(player1Ranking.id, { category: 'SS' });
      } else if (points >= 500 && player1Ranking.category !== 'S' && player1Ranking.category !== 'SS') {
        await this.updatePlayerRanking(player1Ranking.id, { category: 'S' });
      } else if (points >= 250 && player1Ranking.category === 'C') {
        await this.updatePlayerRanking(player1Ranking.id, { category: 'B' });
      } else if (points >= 100 && player1Ranking.category === 'B') {
        await this.updatePlayerRanking(player1Ranking.id, { category: 'A' });
      }
    }
    
    if (!player2Ranking) {
      await this.createPlayerRanking({
        playerId: match.player2Id,
        rankingId: match.rankingId,
        category: 'C',
        points: player1IsWinner ? 0 : 10,
        wins: player1IsWinner ? 0 : 1,
        losses: player1IsWinner ? 1 : 0
      });
    } else {
      // Update existing player2 ranking
      const points = player2Ranking.points + (player1IsWinner ? 0 : 10);
      const wins = player2Ranking.wins + (player1IsWinner ? 0 : 1);
      const losses = player2Ranking.losses + (player1IsWinner ? 1 : 0);
      
      await this.updatePlayerRanking(player2Ranking.id, { points, wins, losses });
      
      // Update category based on points
      if (points >= 1000 && player2Ranking.category !== 'SS') {
        await this.updatePlayerRanking(player2Ranking.id, { category: 'SS' });
      } else if (points >= 500 && player2Ranking.category !== 'S' && player2Ranking.category !== 'SS') {
        await this.updatePlayerRanking(player2Ranking.id, { category: 'S' });
      } else if (points >= 250 && player2Ranking.category === 'C') {
        await this.updatePlayerRanking(player2Ranking.id, { category: 'B' });
      } else if (points >= 100 && player2Ranking.category === 'B') {
        await this.updatePlayerRanking(player2Ranking.id, { category: 'A' });
      }
    }
  }
}

export const storage = new MemStorage();
