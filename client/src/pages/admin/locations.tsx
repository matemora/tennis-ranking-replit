import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import TabNavigation from "@/components/layout/tab-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MapPin, Plus, Settings, Trash } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import LocationForm from "@/components/admin/location-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import type { Location } from "@shared/schema";

export default function AdminLocations() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLocationFormOpen, setIsLocationFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [deletingLocation, setDeletingLocation] = useState<Location | null>(null);

  // Fetch all locations
  const { data: locations, isLoading } = useQuery<Location[]>({
    queryKey: ['/api/locations'],
  });

  // Redirect if not admin
  if (user?.role !== 'admin') {
    navigate('/rankings');
    return null;
  }

  // Handle create new location
  const handleCreateLocation = () => {
    setEditingLocation(null);
    setIsLocationFormOpen(true);
  };

  // Handle edit location
  const handleEditLocation = (location: Location) => {
    setEditingLocation(location);
    setIsLocationFormOpen(true);
  };

  // Handle delete location
  const handleDeleteClick = (location: Location) => {
    setDeletingLocation(location);
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete location
  const confirmDelete = async () => {
    if (!deletingLocation) return;
    
    try {
      await apiRequest('DELETE', `/api/locations/${deletingLocation.id}`);
      queryClient.invalidateQueries({ queryKey: ['/api/locations'] });
      toast({
        title: "Location deleted",
        description: `${deletingLocation.name} has been deleted successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete location",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingLocation(null);
    }
  };

  return (
    <>
      <TabNavigation />
      
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-2xl font-bold">Locations Management</CardTitle>
            <Button onClick={handleCreateLocation}>
              <Plus className="mr-2 h-4 w-4" />
              Add Location
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
            ) : !locations || locations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No locations found. Add your first location.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Coordinates</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.map((location) => (
                    <TableRow key={location.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 text-primary mr-2" />
                          {location.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        {location.address || <span className="text-gray-500 italic">No address specified</span>}
                      </TableCell>
                      <TableCell>
                        {location.coordinates ? (
                          <span className="text-xs font-mono">
                            {location.coordinates.lat.toFixed(6)}, {location.coordinates.lng.toFixed(6)}
                          </span>
                        ) : (
                          <span className="text-gray-500 italic">No coordinates</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditLocation(location)}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteClick(location)}
                          >
                            <Trash className="h-4 w-4" />
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
        
        {/* Location Form Dialog */}
        <LocationForm
          isOpen={isLocationFormOpen}
          onClose={() => setIsLocationFormOpen(false)}
          existingLocation={editingLocation}
        />
        
        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the location "{deletingLocation?.name}".
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}
