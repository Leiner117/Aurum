"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validators";
import { useAuthViewModel } from "@/viewModels/useAuthViewModel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@/constants/routes.constants";

export default function RegisterPage() {
  const { isLoading, error, register: registerUser } = useAuthViewModel();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
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
              Create your account
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(registerUser)} className="space-y-4">
          <Input
            label="Full name"
            type="text"
            placeholder="John Doe"
            error={errors.fullName?.message}
            {...register("fullName")}
          />
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
          <Input
            label="Confirm password"
            type="password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />

          {error && (
            <p className="text-sm text-[var(--color-danger)] text-center">{error}</p>
          )}

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--color-muted-foreground)]">
          Already have an account?{" "}
          <Link
            href={ROUTES.LOGIN}
            className="font-medium text-[var(--color-primary)] hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
