import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";

export interface UserProfile {
  id: string;
  name: string;
  isOwner?: boolean;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface UserState {
  users: UserProfile[];
  currentUserId: string | null;
  currentUser: UserProfile | null;
  isLoading: boolean;
  addUser: (user: { id?: string; name: string; avatarUrl?: string }) => Promise<UserProfile>;
  switchUser: (userId: string) => Promise<void>;
  removeUser: (userId: string) => Promise<void>;
  updateUser: (userId: string, updates: Partial<UserProfile>) => Promise<void>;
  ensureOwner: () => Promise<UserProfile>;
}

const KEYS = {
  USERS: 'easyseas_users',
  CURRENT_USER: 'easyseas_current_user',
};

export const [UserProvider, useUser] = createContextHook((): UserState => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const currentUser = users.find(u => u.id === currentUserId) || null;

  const persistUsers = async (newUsers: UserProfile[]) => {
    try {
      await AsyncStorage.setItem(KEYS.USERS, JSON.stringify(newUsers));
      console.log('[UserProvider] Persisted users:', newUsers.length);
    } catch (error) {
      console.error('[UserProvider] Failed to persist users:', error);
    }
  };

  const persistCurrentUser = async (userId: string | null) => {
    try {
      if (userId) {
        await AsyncStorage.setItem(KEYS.CURRENT_USER, userId);
      } else {
        await AsyncStorage.removeItem(KEYS.CURRENT_USER);
      }
      console.log('[UserProvider] Persisted current user:', userId);
    } catch (error) {
      console.error('[UserProvider] Failed to persist current user:', error);
    }
  };

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const storedUsers = await AsyncStorage.getItem(KEYS.USERS);
      const storedCurrentUser = await AsyncStorage.getItem(KEYS.CURRENT_USER);
      
      if (storedUsers) {
        const parsed = JSON.parse(storedUsers) as UserProfile[];
        setUsers(parsed);
        console.log('[UserProvider] Loaded users:', parsed.length);
      }
      
      if (storedCurrentUser) {
        setCurrentUserId(storedCurrentUser);
        console.log('[UserProvider] Loaded current user:', storedCurrentUser);
      }
    } catch (error) {
      console.error('[UserProvider] Failed to load users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const addUser = async (user: { id?: string; name: string; avatarUrl?: string }): Promise<UserProfile> => {
    const now = new Date().toISOString();
    const newUser: UserProfile = {
      id: user.id || `user_${Date.now()}`,
      name: user.name,
      avatarUrl: user.avatarUrl,
      isOwner: users.length === 0,
      createdAt: now,
      updatedAt: now,
    };

    const newUsers = [...users, newUser];
    setUsers(newUsers);
    await persistUsers(newUsers);

    if (!currentUserId) {
      setCurrentUserId(newUser.id);
      await persistCurrentUser(newUser.id);
    }

    console.log('[UserProvider] Added user:', newUser.name);
    return newUser;
  };

  const switchUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUserId(userId);
      await persistCurrentUser(userId);
      console.log('[UserProvider] Switched to user:', user.name);
    }
  };

  const removeUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user?.isOwner) {
      console.warn('[UserProvider] Cannot remove owner user');
      return;
    }

    const newUsers = users.filter(u => u.id !== userId);
    setUsers(newUsers);
    await persistUsers(newUsers);

    if (currentUserId === userId && newUsers.length > 0) {
      const owner = newUsers.find(u => u.isOwner) || newUsers[0];
      setCurrentUserId(owner.id);
      await persistCurrentUser(owner.id);
    }

    console.log('[UserProvider] Removed user:', userId);
  };

  const updateUser = async (userId: string, updates: Partial<UserProfile>) => {
    const newUsers = users.map(u => 
      u.id === userId 
        ? { ...u, ...updates, updatedAt: new Date().toISOString() }
        : u
    );
    setUsers(newUsers);
    await persistUsers(newUsers);
    console.log('[UserProvider] Updated user:', userId);
  };

  const ensureOwner = async (): Promise<UserProfile> => {
    const owner = users.find(u => u.isOwner);
    if (owner) {
      if (!currentUserId) {
        setCurrentUserId(owner.id);
        await persistCurrentUser(owner.id);
      }
      return owner;
    }

    const newOwner = await addUser({ name: 'Me' });
    const updatedUsers = users.map(u => 
      u.id === newOwner.id ? { ...u, isOwner: true } : u
    );
    if (updatedUsers.find(u => u.id === newOwner.id)) {
      setUsers(updatedUsers);
      await persistUsers(updatedUsers);
    }
    
    return newOwner;
  };

  return {
    users,
    currentUserId,
    currentUser,
    isLoading,
    addUser,
    switchUser,
    removeUser,
    updateUser,
    ensureOwner,
  };
});
