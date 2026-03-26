export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  default_currency: string;
  theme: "light" | "dark" | "system";
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileInput {
  full_name?: string;
  default_currency?: string;
  theme?: "light" | "dark" | "system";
}
