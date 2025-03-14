import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertTriangle, UserCheck, UserX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User } from "@shared/schema";

// Schema for suspension form
const suspendFormSchema = z.object({
  days: z.number().min(1, "Must be at least 1 day").max(365, "Cannot exceed 365 days"),
});

type SuspendFormValues = z.infer<typeof suspendFormSchema>;

interface SuspendPlayerFormProps {
  isOpen: boolean;
  onClose: () => void;
  player: User;
}

const SuspendPlayerForm = ({ isOpen, onClose, player }: SuspendPlayerFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if player is currently suspended
  const isPlayerSuspended = player.suspendedUntil && new Date(player.suspendedUntil) > new Date();

  // Form setup
  const form = useForm<SuspendFormValues>({
    resolver: zodResolver(suspendFormSchema),
    defaultValues: {
      days: 7,
    },
  });

  // Suspend player mutation
  const suspendMutation = useMutation({
    mutationFn: async (values: SuspendFormValues) => {
      return apiRequest('POST', `/api/admin/suspend-player/${player.id}`, { days: values.days });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Player suspended",
        description: `${player.fullName} has been suspended for ${form.getValues().days} days.`,
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to suspend player",
        variant: "destructive",
      });
    },
  });

  // Form submission
  const onSubmit = (values: SuspendFormValues) => {
    suspendMutation.mutate(values);
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isPlayerSuspended ? "Modify Suspension" : "Suspend Player"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex items-center gap-4 mb-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={player.photoUrl} alt={player.fullName} />
            <AvatarFallback>{getInitials(player.fullName)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">{player.fullName}</h3>
            <p className="text-sm text-gray-500">{player.username}</p>
          </div>
        </div>
        
        {isPlayerSuspended && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4 flex items-start">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                This player is currently suspended
              </p>
              <p className="text-sm text-amber-700">
                Suspension ends on: {new Date(player.suspendedUntil!).toLocaleString()}
              </p>
              <p className="text-sm text-amber-700 mt-1">
                Submitting this form will override the current suspension.
              </p>
            </div>
          </div>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Suspension Period (Days)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={1} 
                      max={365} 
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    The player will be unable to record matches during this period.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={suspendMutation.isPending}
              >
                <UserCheck className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button 
                type="submit"
                variant="destructive"
                disabled={suspendMutation.isPending}
              >
                <UserX className="h-4 w-4 mr-1" />
                {suspendMutation.isPending 
                  ? "Suspending..." 
                  : isPlayerSuspended 
                  ? "Update Suspension" 
                  : "Suspend Player"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default SuspendPlayerForm;
