export interface ApiToken {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  last_used_at: string | null;
  is_active: boolean;
}

export interface CreateApiTokenInput {
  name: string;
}

export interface CreateApiTokenResult {
  token: ApiToken;
  rawToken: string;
}
