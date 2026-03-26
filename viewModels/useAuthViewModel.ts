"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ROUTES } from "@/constants/routes.constants";
import type { LoginInput, RegisterInput } from "@/lib/validators";

export interface AuthViewModelReturn {
  isLoading: boolean;
  error: string | null;
  login: (data: LoginInput) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthViewModel = (): AuthViewModelReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const login = async ({ email, password }: LoginInput): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      router.push(ROUTES.DASHBOARD);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const register = async ({ email, password, fullName }: RegisterInput): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (authError) throw authError;
      router.push(ROUTES.DASHBOARD);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      router.push(ROUTES.LOGIN);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign out");
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return { isLoading, error, login, register, logout, clearError };
};
