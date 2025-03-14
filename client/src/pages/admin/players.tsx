import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import TabNavigation from "@/components/layout/tab-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, UserPlus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import SuspendPlayerForm from "@/components/admin/suspend-player-form";
import type { User } from "@shared/schema";

export default function AdminPlayers() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<User | null>(null);

  // Fetch all users
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Redirect if not admin
  if (user?.role !== 'admin') {
    navigate('/rankings');
    return null;
  }

  // Filter to only show players, not admins
  const players = users?.filter(u => u.role === 'player') || [];

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  // Open suspend dialog
  const handleSuspendClick = (player: User) => {
    setSelectedPlayer(player);
    setIsSuspendDialogOpen(true);
  };

  // Check if player is suspended
  const isPlayerSuspended = (player: User) => {
    return player.suspendedUntil && new Date(player.suspendedUntil) > new Date();
  };

  return (
    <>
      <TabNavigation />
      
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-2xl font-bold">Players Management</CardTitle>
            <Button disabled>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Player
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : players.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No players found.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {players.map((player) => (
                    <TableRow key={player.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10 mr-3">
                            <AvatarImage src={player.photoUrl} alt={player.fullName} />
                            <AvatarFallback>{getInitials(player.fullName)}</AvatarFallback>
                          </Avatar>
                          <div>{player.fullName}</div>
                        </div>
                      </TableCell>
                      <TableCell>{player.username}</TableCell>
                      <TableCell>{player.email}</TableCell>
                      <TableCell>
                        {isPlayerSuspended(player) ? (
                          <Badge variant="destructive" className="flex items-center">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Suspended until {new Date(player.suspendedUntil!).toLocaleDateString()}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                            Active
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleSuspendClick(player)}
                        >
                          {isPlayerSuspended(player) ? "Modify Suspension" : "Suspend"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        
        {/* Suspend Player Dialog */}
        {selectedPlayer && (
          <SuspendPlayerForm
            isOpen={isSuspendDialogOpen}
            onClose={() => setIsSuspendDialogOpen(false)}
            player={selectedPlayer}
          />
        )}
      </div>
    </>
  );
}
