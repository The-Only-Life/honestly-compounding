import React, { createContext, useContext, useMemo } from 'react';
import { useCurrentUser, useLogin, useLogout } from '@/hooks/use-auth-api';
import { toast } from '@/hooks/use-toast';
import type { AuthUser } from '@/lib/api-client';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: currentUserData, isLoading } = useCurrentUser();
  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  const user = currentUserData?.user || null;
  const isAuthenticated = !!user;

  const signIn = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  const signOut = async () => {
    await logoutMutation.mutateAsync();
  };

  const signUp = async (_email: string, _password: string, _fullName: string) => {
    toast({
      title: "Feature coming soon",
      description: "Sign up will be available soon.",
    });
  };

  const value: AuthContextType = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated,
      signIn,
      signOut,
      signUp,
    }),
    [user, isLoading, isAuthenticated, signIn, signOut, signUp]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};