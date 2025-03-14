import { useState } from "react";
import { useAuth } from "@/lib/auth";
import TabNavigation from "@/components/layout/tab-navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MatchValidation from "@/components/admin/match-validation";
import { Trophy, Users, MapPin, Volleyball } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("validation");

  // Fetch counts for dashboard
  const { data: pendingMatches } = useQuery({
    queryKey: ['/api/matches', { status: 'pending' }],
  });

  const { data: rankings } = useQuery({
    queryKey: ['/api/rankings'],
  });

  const { data: users } = useQuery({
    queryKey: ['/api/users'],
  });

  const { data: locations } = useQuery({
    queryKey: ['/api/locations'],
  });

  // Redirect if not admin
  if (user?.role !== 'admin') {
    navigate('/rankings');
    return null;
  }

  return (
    <>
      <TabNavigation />
      
      <div className="container mx-auto px-4 py-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Admin Dashboard</CardTitle>
            <CardDescription>Manage tennis rankings, players, and matches</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <Card onClick={() => navigate('/admin/rankings')} className="cursor-pointer hover:bg-gray-50 transition">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <Trophy className="h-10 w-10 text-primary mb-2" />
                  <CardTitle className="text-xl mb-1">Rankings</CardTitle>
                  <p className="text-3xl font-bold">{rankings?.length || 0}</p>
                  <p className="text-sm text-gray-500 mt-2">Manage all tennis rankings</p>
                </CardContent>
              </Card>
              
              <Card onClick={() => navigate('/admin/players')} className="cursor-pointer hover:bg-gray-50 transition">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <Users className="h-10 w-10 text-green-500 mb-2" />
                  <CardTitle className="text-xl mb-1">Players</CardTitle>
                  <p className="text-3xl font-bold">{users?.filter(u => u.role === 'player').length || 0}</p>
                  <p className="text-sm text-gray-500 mt-2">Manage player accounts</p>
                </CardContent>
              </Card>
              
              <Card onClick={() => navigate('/admin/locations')} className="cursor-pointer hover:bg-gray-50 transition">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <MapPin className="h-10 w-10 text-amber-500 mb-2" />
                  <CardTitle className="text-xl mb-1">Locations</CardTitle>
                  <p className="text-3xl font-bold">{locations?.length || 0}</p>
                  <p className="text-sm text-gray-500 mt-2">Manage match locations</p>
                </CardContent>
              </Card>
              
              <Card onClick={() => setActiveTab("validation")} className="cursor-pointer hover:bg-gray-50 transition">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <Volleyball className="h-10 w-10 text-red-500 mb-2" />
                  <CardTitle className="text-xl mb-1">Pending Matches</CardTitle>
                  <p className="text-3xl font-bold">{pendingMatches?.length || 0}</p>
                  <p className="text-sm text-gray-500 mt-2">Validate match submissions</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end mb-6 space-x-2">
          <Button variant="outline" asChild>
            <Link href="/admin/rankings">Manage Rankings</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/players">Manage Players</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/locations">Manage Locations</Link>
          </Button>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="validation">Match Validation</TabsTrigger>
          </TabsList>
          
          <TabsContent value="validation">
            <MatchValidation />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
