import React, { createContext, useContext, useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  full_name?: string;
}

interface Session {
  user: User;
  access_token: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const signUp = async (_email: string, _password: string, _fullName: string) => {
    // TODO: Implement with Bun server API
    toast({
      title: "Feature coming soon",
      description: "Sign up will be available once the server is set up.",
    });

    return { error: null };
  };

  const signIn = async (_email: string, _password: string) => {
    // TODO: Implement with Bun server API
    toast({
      title: "Feature coming soon",
      description: "Sign in will be available once the server is set up.",
    });

    return { error: null };
  };

  const signOut = async () => {
    // TODO: Implement with Bun server API
    setUser(null);
    setSession(null);
    setUserRole(null);
    
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
  };

  const value = {
    user,
    session,
    userRole,
    signUp,
    signIn,
    signOut,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};