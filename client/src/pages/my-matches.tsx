import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import TabNavigation from "@/components/layout/tab-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { MatchWithDetails } from "@shared/schema";
import MatchForm from "@/components/matches/match-form";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function MyMatches() {
  const { user } = useAuth();
  const [isMatchFormOpen, setIsMatchFormOpen] = useState(false);

  // Fetch user's matches
  const { data: matches, isLoading } = useQuery<MatchWithDetails[]>({
    queryKey: ['/api/matches', { playerId: user?.id }],
    enabled: !!user?.id,
  });

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  // Format the match score for display
  const formatScore = (match: MatchWithDetails) => {
    const sets = match.score.sets.map(set => `${set.player1Score}-${set.player2Score}`).join(', ');
    
    if (match.score.tiebreak) {
      return (
        <>
          {match.score.sets.map((set, index) => (
            <span key={index}>
              {index > 0 && <span className="mx-1 text-gray-400">,</span>}
              <span className="px-2 py-1 bg-gray-100 rounded text-sm font-medium">
                {set.player1Score}-{set.player2Score}
              </span>
            </span>
          ))}
          <span className="ml-2 text-xs text-gray-500">
            (Tie-break: {match.score.tiebreak.player1Score}-{match.score.tiebreak.player2Score})
          </span>
        </>
      );
    }
    
    return sets.split(', ').map((set, index) => (
      <span key={index}>
        {index > 0 && <span className="mx-1 text-gray-400">,</span>}
        <span className="px-2 py-1 bg-gray-100 rounded text-sm font-medium">{set}</span>
      </span>
    ));
  };

  // Determine match status badge
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'approved':
        return <Badge variant="success" className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">Pending</Badge>;
      default:
        return null;
    }
  };

  // Determine if current user is player1
  const isPlayer1 = (match: MatchWithDetails) => {
    return match.player1.id === user?.id;
  };

  // Determine opponent
  const getOpponent = (match: MatchWithDetails) => {
    return isPlayer1(match) ? match.player2 : match.player1;
  };

  return (
    <>
      <TabNavigation />
      
      <div className="container mx-auto px-4 py-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">My Matches</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : !matches || matches.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                You haven't recorded any matches yet.
              </div>
            ) : (
              <div className="space-y-4">
                {matches.map((match) => {
                  const opponent = getOpponent(match);
                  const isCurrentUserWinner = (() => {
                    let player1Sets = 0;
                    let player2Sets = 0;
                    
                    match.score.sets.forEach(set => {
                      if (set.player1Score > set.player2Score) player1Sets++;
                      else if (set.player2Score > set.player1Score) player2Sets++;
                    });
                    
                    const player1IsWinner = player1Sets > player2Sets;
                    return isPlayer1(match) ? player1IsWinner : !player1IsWinner;
                  })();
                  
                  return (
                    <div 
                      key={match.id} 
                      className={`p-4 border rounded-lg ${isCurrentUserWinner ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3">
                        <div className="flex items-center mb-2 sm:mb-0">
                          <Avatar className="h-10 w-10 mr-3">
                            <AvatarImage src={opponent.photoUrl} alt={opponent.fullName} />
                            <AvatarFallback>{getInitials(opponent.fullName)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{opponent.fullName}</div>
                            <div className="text-sm text-gray-500">{match.ranking.name}</div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="mr-2 text-sm font-medium">
                            {isCurrentUserWinner ? 'Win' : 'Loss'}
                          </div>
                          {getStatusBadge(match.status)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-2 text-sm">
                        <div>
                          <p className="text-gray-500">Date</p>
                          <p className="font-medium">{format(new Date(match.playedAt), 'PPP')}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Location</p>
                          <p className="font-medium">
                            {match.location?.name || match.locationName || "No location specified"}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-gray-500 text-sm mb-1">Score</p>
                        <div className="flex items-center flex-wrap">
                          {formatScore(match)}
                        </div>
                      </div>
                      
                      {match.status === 'rejected' && match.rejectionReason && (
                        <div className="mt-2 text-sm text-red-600">
                          <p className="font-medium">Rejection reason:</p>
                          <p>{match.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* New Match Button */}
        <div className="fixed bottom-24 right-6 sm:bottom-20 sm:right-10 z-10">
          <Button 
            size="icon"
            className="h-14 w-14 rounded-full bg-amber-500 hover:bg-amber-600 shadow-lg"
            onClick={() => setIsMatchFormOpen(true)}
          >
            <Plus size={24} />
          </Button>
        </div>
        
        {/* Match Form Dialog */}
        <MatchForm 
          isOpen={isMatchFormOpen} 
          onClose={() => setIsMatchFormOpen(false)}
        />
      </div>
    </>
  );
}
