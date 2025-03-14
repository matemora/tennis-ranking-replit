import React, { createContext, useContext, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { LoginUser, RegisterUser } from "@shared/schema";

interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  photoUrl?: string;
  role: 'player' | 'admin';
  suspendedUntil?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginUser) => Promise<void>;
  register: (data: RegisterUser) => Promise<void>;
  logout: () => Promise<void>;
  updateUserPhoto: (photoUrl: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);

  // Fetch the authenticated user
  const { data: userData, isLoading, refetch } = useQuery<User>({
    queryKey: ['/api/auth/me'],
    enabled: true,
    retry: false,
    onError: () => {
      // Clear user data if unauthorized
      setUser(null);
    },
  });

  // Set user data when query succeeds
  useEffect(() => {
    if (userData) {
      setUser(userData);
    }
  }, [userData]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginUser) => {
      return apiRequest('POST', '/api/auth/login', credentials);
    },
    onSuccess: async (response) => {
      const userData = await response.json();
      setUser(userData);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.fullName}!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterUser) => {
      return apiRequest('POST', '/api/auth/register', userData);
    },
    onSuccess: () => {
      toast({
        title: "Registration successful",
        description: "Your account has been created. You can now log in.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/auth/logout', {});
    },
    onSuccess: () => {
      setUser(null);
      queryClient.clear();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Logout failed",
        description: error.message || "Could not log out",
        variant: "destructive",
      });
    },
  });

  // Update user photo mutation
  const updatePhotoMutation = useMutation({
    mutationFn: async (photoUrl: string) => {
      if (!user) throw new Error("User not authenticated");
      return apiRequest('PATCH', `/api/users/${user.id}/photo`, { photoUrl });
    },
    onSuccess: () => {
      refetch();
      toast({
        title: "Photo updated",
        description: "Your profile photo has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Could not update profile photo",
        variant: "destructive",
      });
    },
  });

  const login = async (credentials: LoginUser) => {
    await loginMutation.mutateAsync(credentials);
  };

  const register = async (userData: RegisterUser) => {
    await registerMutation.mutateAsync(userData);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const updateUserPhoto = async (photoUrl: string) => {
    await updatePhotoMutation.mutateAsync(photoUrl);
  };

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    updateUserPhoto,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
