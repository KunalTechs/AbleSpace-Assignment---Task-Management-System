'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api-client';

export interface UserProfile {
  id?: string;
  email: string;
  fullName: string;
  title?: string;
  username?: string;
  avatarUrl?: string;
  theme?: 'LIGHT' | 'DARK';
  colorMode?: string;
}

interface UserContextType {
  user: UserProfile | null;
  loading: boolean;
  refetchUser: () => Promise<void>;
  updateUser: (data: Partial<UserProfile>) => Promise<UserProfile | null>;
}

const defaultContext: UserContextType = {
  user: null,
  loading: true,
  refetchUser: async () => {},
  updateUser: async () => null,
};

const UserContext = createContext<UserContextType>(defaultContext);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/users/me');
      if (res.data) {
        setUser(res.data);
        if (typeof window !== 'undefined') {
          localStorage.setItem('user_profile', JSON.stringify(res.data));
        }
      }
    } catch (err) {
      console.error('Failed to load user profile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user_profile');
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch (e) {}
      }
    }
    fetchUser();
  }, [fetchUser]);

  const updateUser = async (data: Partial<UserProfile>): Promise<UserProfile | null> => {
    try {
      const res = await api.patch('/users/me', data);
      if (res.data) {
        setUser(res.data);
        if (typeof window !== 'undefined') {
          localStorage.setItem('user_profile', JSON.stringify(res.data));
        }
        return res.data;
      }
    } catch (err) {
      console.error('Failed to update user profile:', err);
      throw err;
    }
    return null;
  };

  return (
    <UserContext.Provider value={{ user, loading, refetchUser: fetchUser, updateUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
