import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Camera, X, MapPin } from "lucide-react";
import { useAuth } from "@/lib/auth";
import type { Ranking, Location, User } from "@shared/schema";

// Schema for match form validation
const matchFormSchema = z.object({
  rankingId: z.string().min(1, "Ranking is required"),
  player2Id: z.string().min(1, "Opponent is required"),
  locationId: z.string().optional(),
  locationName: z.string().optional(),
  photoUrl: z.string().optional(),
  // Define score structure
  set1Player1: z.number().min(0).max(7),
  set1Player2: z.number().min(0).max(7),
  set2Player1: z.number().min(0).max(7),
  set2Player2: z.number().min(0).max(7),
  set3Player1: z.number().optional(),
  set3Player2: z.number().optional(),
  hasTiebreak: z.boolean().default(false),
  tiebreakPlayer1: z.number().optional(),
  tiebreakPlayer2: z.number().optional(),
}).refine(data => {
  // If we have a tiebreak, make sure we have tiebreak scores
  if (data.hasTiebreak) {
    return data.tiebreakPlayer1 !== undefined && data.tiebreakPlayer2 !== undefined;
  }
  return true;
}, {
  message: "Tiebreak scores are required when match includes a tiebreak",
  path: ["tiebreakPlayer1"]
}).refine(data => {
  // Ensure either locationId or locationName is provided
  return !!data.locationId || !!data.locationName;
}, {
  message: "Either select a location or enter a custom location",
  path: ["locationId"]
});

type MatchFormValues = z.infer<typeof matchFormSchema>;

interface MatchFormProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRankingId?: number;
}

const MatchForm = ({ isOpen, onClose, selectedRankingId }: MatchFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [useCustomLocation, setUseCustomLocation] = useState(false);

  // Form setup
  const form = useForm<MatchFormValues>({
    resolver: zodResolver(matchFormSchema),
    defaultValues: {
      rankingId: selectedRankingId?.toString() || "",
      player2Id: "",
      locationId: "",
      locationName: "",
      photoUrl: "https://images.unsplash.com/photo-1560012307-411478b0f0e8",  // Default photo for demo
      set1Player1: 0,
      set1Player2: 0,
      set2Player1: 0,
      set2Player2: 0,
      hasTiebreak: false,
      tiebreakPlayer1: 0,
      tiebreakPlayer2: 0,
    },
  });

  // Fetch data for selects
  const { data: rankings } = useQuery<Ranking[]>({
    queryKey: ['/api/rankings'],
  });

  const { data: locations } = useQuery<Location[]>({
    queryKey: ['/api/locations'],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Submit handler
  const mutation = useMutation({
    mutationFn: async (values: MatchFormValues) => {
      // Format the data for API
      const matchData = {
        rankingId: parseInt(values.rankingId),
        player1Id: user?.id,
        player2Id: parseInt(values.player2Id),
        locationId: values.locationId ? parseInt(values.locationId) : undefined,
        locationName: useCustomLocation ? values.locationName : undefined,
        photoUrl: values.photoUrl,
        score: {
          sets: [
            {
              player1Score: values.set1Player1,
              player2Score: values.set1Player2,
            },
            {
              player1Score: values.set2Player1,
              player2Score: values.set2Player2,
            },
          ],
          tiebreak: values.hasTiebreak ? {
            player1Score: values.tiebreakPlayer1 || 0,
            player2Score: values.tiebreakPlayer2 || 0,
          } : undefined,
        }
      };

      // Add set 3 if provided
      if (values.set3Player1 !== undefined && values.set3Player2 !== undefined) {
        matchData.score.sets.push({
          player1Score: values.set3Player1,
          player2Score: values.set3Player2,
        });
      }

      return apiRequest('POST', '/api/matches', matchData);
    },
    onSuccess: () => {
      toast({
        title: "Match recorded",
        description: "Your match has been successfully recorded.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record match. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: MatchFormValues) => {
    mutation.mutate(values);
  };

  // Get current user for opponent filtering
  const opponents = users?.filter(u => u.id !== user?.id) || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Record New Match</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Ranking Selection */}
            <FormField
              control={form.control}
              name="rankingId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ranking</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ranking" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {rankings?.map((ranking) => (
                        <SelectItem key={ranking.id} value={ranking.id.toString()}>
                          {ranking.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Opponent Selection */}
            <FormField
              control={form.control}
              name="player2Id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opponent</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select opponent" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {opponents.map((opponent) => (
                        <SelectItem key={opponent.id} value={opponent.id.toString()}>
                          {opponent.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Match Photo */}
            <FormField
              control={form.control}
              name="photoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Match Photo</FormLabel>
                  <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                    <div className="flex flex-col items-center">
                      <Camera className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Upload a photo or take one now</p>
                      <Button 
                        type="button" 
                        className="mt-2"
                        onClick={() => {
                          // In a real app, this would open a file picker or camera
                          toast({
                            title: "Photo Upload",
                            description: "This would open a photo upload dialog in a real application.",
                          });
                        }}
                      >
                        Choose Photo
                      </Button>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Location Selection */}
            <div className="space-y-2">
              <FormLabel>Location</FormLabel>
              
              <div className="flex items-center space-x-2 mb-2">
                <Checkbox 
                  id="custom-location" 
                  checked={useCustomLocation} 
                  onCheckedChange={(checked) => {
                    setUseCustomLocation(!!checked);
                    // Reset the location fields when toggling
                    if (checked) {
                      form.setValue("locationId", "");
                    } else {
                      form.setValue("locationName", "");
                    }
                  }}
                />
                <label 
                  htmlFor="custom-location" 
                  className="text-sm text-gray-700 cursor-pointer"
                >
                  Enter custom location
                </label>
              </div>
              
              {useCustomLocation ? (
                <FormField
                  control={form.control}
                  name="locationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Enter location name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="locationId"
                  render={({ field }) => (
                    <FormItem>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {locations?.map((location) => (
                            <SelectItem key={location.id} value={location.id.toString()}>
                              {location.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="text-primary"
                onClick={() => {
                  // In a real app, this would use geolocation
                  toast({
                    title: "Geolocation",
                    description: "This would capture your current location in a real application.",
                  });
                }}
              >
                <MapPin className="h-4 w-4 mr-1" /> Use current location
              </Button>
            </div>
            
            {/* Match Score */}
            <div className="space-y-4">
              <FormLabel>Match Score</FormLabel>
              
              {/* Set 1 */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="set1Player1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-gray-500">Set 1 - Your Score</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={0} 
                          max={7} 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="set1Player2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-gray-500">Set 1 - Opponent Score</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={0} 
                          max={7} 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Set 2 */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="set2Player1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-gray-500">Set 2 - Your Score</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={0} 
                          max={7} 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="set2Player2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-gray-500">Set 2 - Opponent Score</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={0} 
                          max={7} 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Set 3 (Optional) */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="set3Player1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-gray-500">Set 3 - Your Score (optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={0} 
                          max={7} 
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value === "" ? undefined : parseInt(e.target.value);
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="set3Player2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-gray-500">Set 3 - Opponent Score</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={0} 
                          max={7} 
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value === "" ? undefined : parseInt(e.target.value);
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Tie Break */}
              <div className="space-y-4">
                <div className="flex items-center">
                  <FormField
                    control={form.control}
                    name="hasTiebreak"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox 
                            id="tiebreak-check"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel htmlFor="tiebreak-check" className="text-sm text-gray-700 cursor-pointer">
                          Match included tie-break
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
                
                {form.watch("hasTiebreak") && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="tiebreakPlayer1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-gray-500">Your Tie-break Score</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={0}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tiebreakPlayer2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-gray-500">Opponent Tie-break Score</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={0}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            </div>
          
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Submitting..." : "Submit Match"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default MatchForm;
