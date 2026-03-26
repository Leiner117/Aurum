import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes.constants";

// Root redirects to dashboard — middleware handles auth protection
export default function RootPage() {
  redirect(ROUTES.DASHBOARD);
}
