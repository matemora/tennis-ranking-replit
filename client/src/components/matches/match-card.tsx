import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";
import type { MatchWithDetails } from "@shared/schema";

interface MatchCardProps {
  match: MatchWithDetails;
}

const MatchCard = ({ match }: MatchCardProps) => {
  const { user } = useAuth();
  
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  // Determine if current user is player1
  const isPlayer1 = match.player1Id === user?.id;
  
  // Determine opponent
  const opponent = isPlayer1 ? match.player2 : match.player1;
  
  // Determine match winner
  const isCurrentUserWinner = (() => {
    let player1Sets = 0;
    let player2Sets = 0;
    
    match.score.sets.forEach(set => {
      if (set.player1Score > set.player2Score) player1Sets++;
      else if (set.player2Score > set.player1Score) player2Sets++;
    });
    
    const player1IsWinner = player1Sets > player2Sets;
    return isPlayer1 ? player1IsWinner : !player1IsWinner;
  })();
  
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
  
  // Format the match score for display
  const formatScore = () => {
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

  return (
    <div 
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
          {formatScore()}
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
};

export default MatchCard;
