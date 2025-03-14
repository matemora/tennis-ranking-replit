import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import TabNavigation from "@/components/layout/tab-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Plus, Settings, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import RankingForm from "@/components/admin/ranking-form";
import type { Ranking } from "@shared/schema";

export default function AdminRankings() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [isRankingFormOpen, setIsRankingFormOpen] = useState(false);
  const [editingRanking, setEditingRanking] = useState<Ranking | null>(null);

  // Fetch all rankings
  const { data: rankings, isLoading } = useQuery<Ranking[]>({
    queryKey: ['/api/rankings'],
  });

  // Redirect if not admin
  if (user?.role !== 'admin') {
    navigate('/rankings');
    return null;
  }

  // Handle create new ranking
  const handleCreateRanking = () => {
    setEditingRanking(null);
    setIsRankingFormOpen(true);
  };

  // Handle edit ranking
  const handleEditRanking = (ranking: Ranking) => {
    setEditingRanking(ranking);
    setIsRankingFormOpen(true);
  };

  return (
    <>
      <TabNavigation />
      
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-2xl font-bold">Rankings Management</CardTitle>
            <Button onClick={handleCreateRanking}>
              <Plus className="mr-2 h-4 w-4" />
              Create Ranking
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
            ) : !rankings || rankings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No rankings found. Create your first ranking.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead>Validation</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rankings.map((ranking) => (
                    <TableRow key={ranking.id}>
                      <TableCell className="font-medium">{ranking.name}</TableCell>
                      <TableCell>
                        {ranking.description ? (
                          <span className="text-sm">{ranking.description.substring(0, 50)}...</span>
                        ) : (
                          <span className="text-sm text-gray-500 italic">No description</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={ranking.isPublic ? 
                            "bg-green-100 text-green-800 border-green-300" : 
                            "bg-amber-100 text-amber-800 border-amber-300"
                          }
                        >
                          {ranking.isPublic ? (
                            <><Eye className="h-3 w-3 mr-1" /> Public</>
                          ) : (
                            <><EyeOff className="h-3 w-3 mr-1" /> Private</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={ranking.requiresValidation ? 
                            "bg-blue-100 text-blue-800 border-blue-300" : 
                            "bg-gray-100 text-gray-800 border-gray-300"
                          }
                        >
                          {ranking.requiresValidation ? "Required" : "Not Required"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/admin/rankings/${ranking.id}/players`)}
                            disabled
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditRanking(ranking)}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        
        {/* Ranking Form Dialog */}
        <RankingForm
          isOpen={isRankingFormOpen}
          onClose={() => setIsRankingFormOpen(false)}
          existingRanking={editingRanking}
        />
      </div>
    </>
  );
}
