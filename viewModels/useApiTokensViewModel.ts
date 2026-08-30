"use client";

import { useState, useEffect, useCallback } from "react";
import type { ApiToken } from "@/types/api-token";

export interface ApiTokensViewModelReturn {
  tokens: ApiToken[];
  isLoading: boolean;
  error: string | null;
  newRawToken: string | null;
  createToken: (name: string) => Promise<boolean>;
  deleteToken: (id: string) => Promise<boolean>;
  clearNewToken: () => void;
  refetch: () => void;
}

export const useApiTokensViewModel = (): ApiTokensViewModelReturn => {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newRawToken, setNewRawToken] = useState<string | null>(null);

  const fetchTokens = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/api-tokens");
      if (!res.ok) throw new Error("Failed to load tokens");
      setTokens(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchTokens(); }, [fetchTokens]);

  const createToken = async (name: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/api-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed to create token");
      const { token, rawToken } = await res.json();
      setTokens((prev) => [token, ...prev]);
      setNewRawToken(rawToken);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteToken = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/api-tokens?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete token");
      setTokens((prev) => prev.filter((t) => t.id !== id));
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    tokens,
    isLoading,
    error,
    newRawToken,
    createToken,
    deleteToken,
    clearNewToken: () => setNewRawToken(null),
    refetch: fetchTokens,
  };
};
