import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthUser } from '../types';

const TOKEN_KEY = '@bj_auth_token';
const USER_KEY = '@bj_auth_user';

export const authStorage = {
  async saveSession(token: string, user: AuthUser): Promise<void> {
    try {
      await AsyncStorage.multiSet([
        [TOKEN_KEY, token],
        [USER_KEY, JSON.stringify(user)],
      ]);
    } catch (e) {
      console.error('Error saving session:', e);
    }
  },

  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async getUser(): Promise<AuthUser | null> {
    try {
      const data = await AsyncStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async clearSession(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    } catch (e) {
      console.error('Error clearing session:', e);
    }
  },
};
