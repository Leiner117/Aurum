import type { ProfileTheme } from "./profile.types";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  default_currency: string;
  theme: ProfileTheme;
  created_at: string;
  updated_at: string;
}
