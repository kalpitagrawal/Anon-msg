import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Check, X } from "lucide-react";
import api from "@/api/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/context/ToastContext";
import { useDebounce } from "@/lib/useDebounce";

export default function Signup() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const usernameValue = watch("username", "");
  const debouncedUsername = useDebounce(usernameValue, 400);
  const [usernameStatus, setUsernameStatus] = useState(null); // null | "checking" | "available" | "taken"

  useEffect(() => {
    if (!debouncedUsername || debouncedUsername.length < 3) {
      setUsernameStatus(null);
      return;
    }
    let cancelled = false;
    setUsernameStatus("checking");
    api
      .get(`/users/check-username/${debouncedUsername}`)
      .then(({ data }) => {
        if (!cancelled) setUsernameStatus(data.data.available ? "available" : "taken");
      })
      .catch(() => {
        if (!cancelled) setUsernameStatus(null);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedUsername]);

  const onSubmit = async (formData) => {
    if (usernameStatus === "taken") {
      showToast("Username already taken, pick another", "error");
      return;
    }
    setServerError("");
    try {
      await api.post("/auth/signup", formData);
      navigate("/verify-otp", { state: { email: formData.email } });
    } catch (err) {
      const msg = err.response?.data?.message || "Signup failed. Try again.";
      setServerError(msg);
      showToast(msg, "error");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <Card className="w-full max-w-sm p-8">
        <h1 className="text-xl font-semibold tracking-tight text-ink">
          Create account
        </h1>
        <p className="mt-1 text-sm text-muted">
          Get your anonymous message link in seconds.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-ink">
              Username
            </label>
            <div className="relative">
              <Input
                id="username"
                placeholder="kalpit"
                error={!!errors.username || usernameStatus === "taken"}
                className="pr-10"
                {...register("username", {
                  required: "Username required",
                  minLength: { value: 3, message: "Min 3 characters" },
                  pattern: {
                    value: /^[a-z0-9_]+$/,
                    message: "Lowercase letters, numbers, underscore only",
                  },
                })}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameStatus === "checking" && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted" />
                )}
                {usernameStatus === "available" && (
                  <Check className="h-4 w-4 text-green-600" />
                )}
                {usernameStatus === "taken" && <X className="h-4 w-4 text-red-500" />}
              </span>
            </div>
            {errors.username && (
              <p className="mt-1 text-xs text-red-500">{errors.username.message}</p>
            )}
            {!errors.username && usernameStatus === "taken" && (
              <p className="mt-1 text-xs text-red-500">Username already taken</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              error={!!errors.email}
              {...register("email", {
                required: "Email required",
                pattern: {
                  value: /^\S+@\S+\.\S+$/,
                  message: "Invalid email format",
                },
              })}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              error={!!errors.password}
              {...register("password", {
                required: "Password required",
                minLength: { value: 6, message: "Min 6 characters" },
              })}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>

          {serverError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {serverError}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Sign up"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already have account?{" "}
          <Link to="/login" className="font-medium text-ink underline underline-offset-2">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
}
