import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import TabNavigation from "@/components/layout/tab-navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Camera, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { MatchWithDetails } from "@shared/schema";

// Form schema for photo URL
const photoFormSchema = z.object({
  photoUrl: z.string().url("Please enter a valid URL"),
});

type PhotoFormValues = z.infer<typeof photoFormSchema>;

export default function Profile() {
  const { user, logout, updateUserPhoto } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Fetch match statistics
  const { data: matches } = useQuery<MatchWithDetails[]>({
    queryKey: ['/api/matches', { playerId: user?.id, status: 'approved' }],
    enabled: !!user?.id,
  });

  // Calculate statistics
  const stats = {
    totalMatches: matches?.length || 0,
    wins: matches?.filter(match => {
      let player1Sets = 0;
      let player2Sets = 0;
      
      match.score.sets.forEach(set => {
        if (set.player1Score > set.player2Score) player1Sets++;
        else if (set.player2Score > set.player1Score) player2Sets++;
      });
      
      const player1IsWinner = player1Sets > player2Sets;
      return match.player1Id === user?.id ? player1IsWinner : !player1IsWinner;
    }).length || 0,
  };
  
  stats.losses = stats.totalMatches - stats.wins;
  stats.winRate = stats.totalMatches > 0 ? Math.round((stats.wins / stats.totalMatches) * 100) : 0;

  // Form setup for photo URL
  const form = useForm<PhotoFormValues>({
    resolver: zodResolver(photoFormSchema),
    defaultValues: {
      photoUrl: user?.photoUrl || "",
    },
  });

  // Handle photo update
  const onSubmitPhoto = async (data: PhotoFormValues) => {
    try {
      setIsLoading(true);
      await updateUserPhoto(data.photoUrl);
      toast({
        title: "Success",
        description: "Your profile photo has been updated.",
      });
    } catch (error) {
      console.error("Failed to update photo:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await logout();
    } catch (error) {
      console.error("Failed to logout:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <>
      <TabNavigation />
      
      <div className="container mx-auto px-4 py-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold">Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center mb-6">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={user?.photoUrl} alt={user?.fullName} />
                  <AvatarFallback className="text-2xl">
                    {user?.fullName ? getInitials(user.fullName) : '?'}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-bold">{user?.fullName}</h2>
                <p className="text-gray-500">{user?.username}</p>
                {user?.role === 'admin' && (
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium mt-1">
                    Administrator
                  </span>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Email</h3>
                  <p>{user?.email}</p>
                </div>
                
                {user?.suspendedUntil && new Date(user.suspendedUntil) > new Date() && (
                  <div className="p-3 bg-red-100 border border-red-300 rounded-md">
                    <h3 className="text-sm font-bold text-red-800">Account Suspended</h3>
                    <p className="text-sm text-red-700">
                      Your account is suspended until {new Date(user.suspendedUntil).toLocaleString()}
                    </p>
                  </div>
                )}
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleLogout}
                  disabled={isLoading}
                >
                  {isLoading ? "Logging out..." : "Logout"}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Update Photo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold">Update Profile Photo</CardTitle>
              <CardDescription>Enter a URL for your profile photo</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitPhoto)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="photoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Photo URL</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input placeholder="https://example.com/photo.jpg" {...field} />
                            <Button type="submit" size="icon" disabled={isLoading}>
                              <Upload className="h-4 w-4" />
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                    <div className="flex flex-col items-center">
                      <Camera className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">
                        In a real app, this would allow uploading a photo directly
                      </p>
                    </div>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          {/* Statistics Summary */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Match Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="border rounded-lg p-4 text-center">
                  <h3 className="text-sm font-medium text-gray-500">Total Matches</h3>
                  <p className="text-3xl font-bold">{stats.totalMatches}</p>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <h3 className="text-sm font-medium text-gray-500">Wins</h3>
                  <p className="text-3xl font-bold text-green-600">{stats.wins}</p>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <h3 className="text-sm font-medium text-gray-500">Losses</h3>
                  <p className="text-3xl font-bold text-red-600">{stats.losses}</p>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <h3 className="text-sm font-medium text-gray-500">Win Rate</h3>
                  <p className="text-3xl font-bold">{stats.winRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
