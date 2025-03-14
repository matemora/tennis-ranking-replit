import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import type { Ranking, InsertRanking } from "@shared/schema";

// Extended schema for ranking form
const rankingFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  isPublic: z.boolean().default(true),
  requiresValidation: z.boolean().default(false),
});

type RankingFormValues = z.infer<typeof rankingFormSchema>;

interface RankingFormProps {
  isOpen: boolean;
  onClose: () => void;
  existingRanking?: Ranking | null;
}

const RankingForm = ({ isOpen, onClose, existingRanking }: RankingFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Form setup
  const form = useForm<RankingFormValues>({
    resolver: zodResolver(rankingFormSchema),
    defaultValues: {
      name: existingRanking?.name || "",
      description: existingRanking?.description || "",
      isPublic: existingRanking?.isPublic ?? true,
      requiresValidation: existingRanking?.requiresValidation ?? false,
    },
  });

  // Create ranking mutation
  const createMutation = useMutation({
    mutationFn: async (values: RankingFormValues) => {
      if (!user) throw new Error("User not authenticated");
      
      const rankingData: InsertRanking = {
        ...values,
        createdById: user.id,
      };
      
      return apiRequest('POST', '/api/rankings', rankingData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rankings'] });
      toast({
        title: "Success",
        description: "Ranking created successfully",
      });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create ranking",
        variant: "destructive",
      });
    },
  });

  // Update ranking mutation
  const updateMutation = useMutation({
    mutationFn: async (values: RankingFormValues) => {
      if (!existingRanking) throw new Error("No ranking to update");
      
      return apiRequest('PATCH', `/api/rankings/${existingRanking.id}`, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rankings'] });
      toast({
        title: "Success",
        description: "Ranking updated successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update ranking",
        variant: "destructive",
      });
    },
  });

  // Form submission
  const onSubmit = (values: RankingFormValues) => {
    if (existingRanking) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{existingRanking ? "Edit Ranking" : "Create New Ranking"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="City Championship 2023" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Details about the ranking, rules, etc."
                      className="resize-none"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Public Ranking</FormLabel>
                    <FormDescription>
                      Make this ranking visible to all players
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="requiresValidation"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Require Match Validation</FormLabel>
                    <FormDescription>
                      Matches must be approved by an admin before counting
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : existingRanking
                  ? "Update Ranking"
                  : "Create Ranking"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default RankingForm;
