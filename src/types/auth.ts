export type AdminRole = "SuperAdmin" | "Admin" | "Dispatcher" | "ContentEditor" | "Viewer";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  avatarUrl?: string;
  lastLoginAt?: string;
  createdAt: string;
}

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: AdminRole;
  issuedAt: number;
  expiresAt: number;
}

export interface AuthState {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
