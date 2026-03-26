"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validators";
import { useAuthViewModel } from "@/viewModels/useAuthViewModel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@/constants/routes.constants";

export default function LoginPage() {
  const { isLoading, error, login } = useAuthViewModel();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-[var(--color-background)]">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <Image src="/logo.png" alt="Aurum" width={64} height={64} />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Aurum</h1>
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
              Sign in to your account
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(login)} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password")}
          />

          {error && (
            <p className="text-sm text-[var(--color-danger)] text-center">{error}</p>
          )}

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--color-muted-foreground)]">
          Don&apos;t have an account?{" "}
          <Link
            href={ROUTES.REGISTER}
            className="font-medium text-[var(--color-primary)] hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
