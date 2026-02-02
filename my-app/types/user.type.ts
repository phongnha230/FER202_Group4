import { Profile } from './database.types';

export type UserRole = 'admin' | 'customer';

export interface User extends Profile {
  email: string;
}

export interface UserState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: UserRole | null;
  checkSession: () => Promise<void>;
  logout: () => Promise<void>;
}
