"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  AuthUser,
  AccountType,
  login as loginRequest,
  logout as logoutRequest,
  getMe,
} from "@/lib/auth";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isDoctor: boolean;
  login: (email: string, password: string, accountType: AccountType) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// No localStorage, no document.cookie here. The session lives in an
// httpOnly cookie set by our Next.js route handlers (lib/authCookies.ts);
// this context only ever asks the server "who am I?" via /api/auth/me and
// holds the answer in React state for the duration of the tab.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      const current = await getMe();
      setUser(current);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refreshUser();
      setLoading(false);
    })();
  }, [refreshUser]);

  async function login(email: string, password: string, accountType: AccountType) {
    const { user: loggedInUser } = await loginRequest({
      email,
      password,
      account_type: accountType,
    });
    setUser(loggedInUser);
    return loggedInUser;
  }

  async function logout() {
    await logoutRequest();
    setUser(null);
    router.push("/login");
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        isAdmin: user?.role === "admin",
        isDoctor: user?.role === "doctor",
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
