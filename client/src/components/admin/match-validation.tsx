import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { MatchWithDetails } from "@shared/schema";

const MatchValidation = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rejectionReason, setRejectionReason] = useState<Record<number, string>>({});

  // Fetch pending matches
  const { data: pendingMatches, isLoading } = useQuery<MatchWithDetails[]>({
    queryKey: ['/api/matches', { status: 'pending' }],
  });

  // Mutation for approving/rejecting matches
  const validateMatchMutation = useMutation({
    mutationFn: async ({ matchId, approved, reason }: { matchId: number; approved: boolean; reason?: string }) => {
      return apiRequest('POST', `/api/admin/validate-match/${matchId}`, { 
        approved, 
        rejectionReason: reason 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
      toast({
        title: "Success",
        description: "Match validation updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to validate match",
        variant: "destructive",
      });
    },
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
    
    // Add tiebreak if present
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
          {match.score.tiebreak && (
            <span className="ml-2 text-xs text-gray-500">
              (Tie-break: {match.score.tiebreak.player1Score}-{match.score.tiebreak.player2Score})
            </span>
          )}
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

  // Handle approve/reject
  const handleApprove = (matchId: number) => {
    validateMatchMutation.mutate({ matchId, approved: true });
  };

  const handleReject = (matchId: number) => {
    validateMatchMutation.mutate({ 
      matchId, 
      approved: false, 
      reason: rejectionReason[matchId] || "Rejected by administrator" 
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Match Validation</h2>
          <p className="text-sm text-gray-600">Review and validate submitted matches</p>
        </div>
        
        <div className="bg-white rounded-lg shadow">
          <Skeleton className="h-48 w-full mb-4" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!pendingMatches || pendingMatches.length === 0) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Match Validation</h2>
          <p className="text-sm text-gray-600">Review and validate submitted matches</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No pending matches to validate.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Match Validation</h2>
        <p className="text-sm text-gray-600">Review and validate submitted matches</p>
      </div>
      
      <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
        {pendingMatches.map((match) => (
          <div key={match.id} className="p-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between">
              <div className="flex-1">
                <div className="flex flex-wrap items-center mb-4">
                  <div className="mr-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={match.player1.photoUrl} alt={match.player1.fullName} />
                      <AvatarFallback>{getInitials(match.player1.fullName)}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="text-lg font-medium">{match.player1.fullName}</div>
                  <div className="mx-4 text-gray-500">vs</div>
                  <div className="text-lg font-medium">{match.player2.fullName}</div>
                  <div className="ml-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={match.player2.photoUrl} alt={match.player2.fullName} />
                      <AvatarFallback>{getInitials(match.player2.fullName)}</AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="text-sm font-medium">{format(new Date(match.playedAt), 'PPP')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="text-sm font-medium">
                      {match.location?.name || match.locationName || "No location specified"}
                    </p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-1">Score</p>
                  <div className="flex items-center flex-wrap">
                    {formatScore(match)}
                  </div>
                </div>
                
                <div>
                  {match.photoUrl && (
                    <img 
                      src={match.photoUrl} 
                      alt="Match" 
                      className="h-40 rounded-md object-cover" 
                    />
                  )}
                </div>
                
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-1">Rejection Reason (optional)</p>
                  <Input
                    placeholder="Reason for rejection"
                    value={rejectionReason[match.id] || ""}
                    onChange={(e) => setRejectionReason({
                      ...rejectionReason,
                      [match.id]: e.target.value
                    })}
                  />
                </div>
              </div>
              
              <div className="mt-6 md:mt-0 md:ml-6 flex md:flex-col space-x-3 md:space-x-0 md:space-y-3">
                <Button
                  className="bg-green-500 hover:bg-green-600"
                  disabled={validateMatchMutation.isPending}
                  onClick={() => handleApprove(match.id)}
                >
                  <Check className="mr-1 h-4 w-4" /> Approve
                </Button>
                <Button
                  variant="destructive"
                  disabled={validateMatchMutation.isPending}
                  onClick={() => handleReject(match.id)}
                >
                  <X className="mr-1 h-4 w-4" /> Reject
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MatchValidation;
