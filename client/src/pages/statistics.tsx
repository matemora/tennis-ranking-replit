import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import TabNavigation from "@/components/layout/tab-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import CategoryBadge from "@/components/ui/category-badge";
import type { Ranking, PlayerRanking, MatchWithDetails } from "@shared/schema";

export default function Statistics() {
  const { user } = useAuth();
  const [selectedRankingId, setSelectedRankingId] = useState<string | null>(null);

  // Fetch rankings
  const { data: rankings } = useQuery<Ranking[]>({
    queryKey: ['/api/rankings'],
  });

  // Fetch matches for the user
  const { data: matches, isLoading: matchesLoading } = useQuery<MatchWithDetails[]>({
    queryKey: ['/api/matches', { playerId: user?.id }],
    enabled: !!user?.id,
  });

  // Prepare data for win/loss chart
  const winLossData = (() => {
    if (!matches) return [];
    
    // Count wins and losses
    let wins = 0;
    let losses = 0;
    
    matches.forEach(match => {
      if (match.status !== 'approved') return;
      
      let player1Sets = 0;
      let player2Sets = 0;
      
      match.score.sets.forEach(set => {
        if (set.player1Score > set.player2Score) player1Sets++;
        else if (set.player2Score > set.player1Score) player2Sets++;
      });
      
      const player1IsWinner = player1Sets > player2Sets;
      const isCurrentUserWinner = match.player1Id === user?.id ? player1IsWinner : !player1IsWinner;
      
      if (isCurrentUserWinner) wins++;
      else losses++;
    });
    
    return [
      { name: 'Wins', value: wins, fill: '#10b981' },
      { name: 'Losses', value: losses, fill: '#ef4444' }
    ];
  })();

  // Prepare data for ranking points chart
  const pointsChartData = (() => {
    if (!matches || !rankings) return [];
    
    // Group by ranking and calculate points
    const pointsByRanking: Record<number, { name: string; points: number }> = {};
    
    // Initialize with rankings
    rankings.forEach(ranking => {
      pointsByRanking[ranking.id] = { name: ranking.name, points: 0 };
    });
    
    // Filter to selected ranking if one is selected
    const filteredMatches = selectedRankingId 
      ? matches.filter(m => m.rankingId === parseInt(selectedRankingId))
      : matches;
    
    // Count points (simplified calculation)
    filteredMatches.forEach(match => {
      if (match.status !== 'approved') return;
      
      const rankingId = match.rankingId;
      if (!pointsByRanking[rankingId]) return;
      
      let player1Sets = 0;
      let player2Sets = 0;
      
      match.score.sets.forEach(set => {
        if (set.player1Score > set.player2Score) player1Sets++;
        else if (set.player2Score > set.player1Score) player2Sets++;
      });
      
      const player1IsWinner = player1Sets > player2Sets;
      const isCurrentUserWinner = match.player1Id === user?.id ? player1IsWinner : !player1IsWinner;
      
      // Award points based on win/loss
      if (isCurrentUserWinner) {
        pointsByRanking[rankingId].points += 10;
      }
    });
    
    return Object.values(pointsByRanking).filter(item => item.points > 0);
  })();

  // Fetch player's ranking data across all rankings
  const { data: playerRankings, isLoading: rankingsLoading } = useQuery<PlayerRanking[]>({
    queryKey: ['/api/player-rankings', user?.id],
    enabled: !!user?.id,
  });

  return (
    <>
      <TabNavigation />
      
      <div className="container mx-auto px-4 py-6">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Win/Loss Ratio */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Win/Loss Ratio</CardTitle>
            </CardHeader>
            <CardContent>
              {matchesLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <div className="h-64 flex items-center justify-center">
                  {winLossData.length > 0 && winLossData.some(d => d.value > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={winLossData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {winLossData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center text-gray-500">
                      No match data available
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Points by Ranking */}
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold">Ranking Points</CardTitle>
              <Select
                value={selectedRankingId || "all"}
                onValueChange={(value) => setSelectedRankingId(value === "all" ? null : value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All rankings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All rankings</SelectItem>
                  {rankings?.map((ranking) => (
                    <SelectItem key={ranking.id} value={ranking.id.toString()}>
                      {ranking.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {matchesLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <div className="h-64">
                  {pointsChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={pointsChartData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="points" fill="var(--chart-1)" name="Points" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      No point data available
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Categories by Ranking */}
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle className="text-lg font-bold">My Categories</CardTitle>
            </CardHeader>
            <CardContent>
              {rankingsLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : !playerRankings || playerRankings.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  You are not ranked in any rankings yet.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {rankings?.map(ranking => {
                    const playerRanking = playerRankings.find(pr => pr.rankingId === ranking.id);
                    
                    return playerRanking ? (
                      <div key={ranking.id} className="border rounded-lg p-4">
                        <h3 className="font-medium text-lg mb-2">{ranking.name}</h3>
                        <div className="flex justify-between">
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Category</p>
                            <CategoryBadge category={playerRanking.category} />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Points</p>
                            <p className="font-semibold">{playerRanking.points}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Record</p>
                            <p className="font-medium">{playerRanking.wins}/{playerRanking.losses}</p>
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
