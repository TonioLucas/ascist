export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
  providerId: string | null;
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: Error | null;
}