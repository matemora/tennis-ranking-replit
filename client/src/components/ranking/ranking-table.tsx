import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import CategoryBadge from "@/components/ui/category-badge";
import type { PlayerWithRanking } from "@shared/schema";

interface RankingTableProps {
  rankingId: number | null;
  category: string | null;
}

const RankingTable = ({ rankingId, category }: RankingTableProps) => {
  const { user } = useAuth();
  
  const { data: players, isLoading } = useQuery<PlayerWithRanking[]>({
    queryKey: [
      '/api/rankings', 
      rankingId, 
      'players', 
      { category: category === 'All' ? null : category }
    ],
    enabled: !!rankingId,
  });

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  if (!rankingId) {
    return (
      <div className="bg-white rounded-lg p-8 text-center text-gray-500">
        Please select a ranking to view players.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="p-4">
          <Skeleton className="h-8 w-full mb-4" />
          <Skeleton className="h-12 w-full mb-2" />
          <Skeleton className="h-12 w-full mb-2" />
          <Skeleton className="h-12 w-full mb-2" />
          <Skeleton className="h-12 w-full mb-2" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (!players || players.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500 mb-6">
        No players found in this ranking.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Rank</TableHead>
              <TableHead>Player</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>W/L</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.map((player) => (
              <TableRow 
                key={player.playerId}
                className={player.playerId === user?.id ? "bg-blue-50" : undefined}
              >
                <TableCell className="font-medium">{player.position}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-4">
                      <AvatarImage src={player.photoUrl} alt={player.fullName} />
                      <AvatarFallback>{getInitials(player.fullName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{player.fullName}</div>
                      {player.isCurrentUser && <div className="text-sm text-gray-500">You</div>}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <CategoryBadge category={player.category} />
                </TableCell>
                <TableCell className="font-semibold">{player.points}</TableCell>
                <TableCell>{player.wins}/{player.losses}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default RankingTable;
