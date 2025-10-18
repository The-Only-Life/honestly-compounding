import React, { createContext, useContext, useMemo } from 'react';
import { useCurrentUser, useLogin, useLogout } from '@/hooks/use-auth-api';
import { toast } from '@/hooks/use-toast';
import type { AuthUser } from '@/lib/api-client';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  userRole: string | null;
  signIn: (email: string, password: string, captchaToken?: string) => Promise<void>;
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
  const userRole = user?.role || null;

  const signIn = async (email: string, password: string, captchaToken?: string) => {
    await loginMutation.mutateAsync({ email, password, captchaToken });
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
      userRole,
      signIn,
      signOut,
      signUp,
    }),
    [user, isLoading, isAuthenticated, userRole, signIn, signOut, signUp]
  );

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};