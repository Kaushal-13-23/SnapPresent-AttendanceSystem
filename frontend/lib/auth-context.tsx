'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  api,
  UserSession,
  UserType,
  SignupPayload,
  SigninPayload,
  getStoredSession,
  setStoredSession,
  clearStoredSession,
} from './api';

interface AuthContextType {
  user: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: SigninPayload) => Promise<UserSession>;
  signup: (payload: SignupPayload) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  // Hydrate from localStorage on client mount
  useEffect(() => {
    try {
      const { user: storedUser } = getStoredSession();
      if (storedUser) {
        setUser(storedUser);
      }
    } catch (e) {
      console.error('Failed to parse session from storage', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(
    async (credentials: SigninPayload): Promise<UserSession> => {
      const response = await api.signin(credentials);
      const sessionUser: UserSession = {
        ...response.user,
        userType: response.userType || credentials.userType,
        username: response.user.username || response.user.studentName || 'User',
      };

      setUser(sessionUser);
      setStoredSession(sessionUser);
      return sessionUser;
    },
    []
  );

  const signup = useCallback(
    async (payload: SignupPayload): Promise<{ success: boolean; message: string }> => {
      return await api.signup(payload);
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // Proceed with local logout regardless of server response
    } finally {
      setUser(null);
      clearStoredSession();
      router.push('/signin');
    }
  }, [router]);

  const refreshProfile = useCallback(async () => {
    try {
      const response = await api.getUserProfile();
      if (response?.user) {
        const updated = {
          ...response.user,
          userType: (response.user.userType || user?.userType || 'student') as UserType,
        };
        setUser(updated);
        setStoredSession(updated);
      }
    } catch {
      // Ignore background refresh failure
    }
  }, [user?.userType]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
