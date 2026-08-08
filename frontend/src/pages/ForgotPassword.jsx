import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import api from "@/api/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/context/ToastContext";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [step, setStep] = useState("request"); // request | reset
  const [email, setEmail] = useState("");
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onRequest = async (data) => {
    setServerError("");
    try {
      await api.post("/auth/forgot-password", { email: data.email });
      setEmail(data.email);
      setStep("reset");
      showToast("Reset code sent if account exists");
    } catch (err) {
      setServerError(err.response?.data?.message || "Request failed");
    }
  };

  const onReset = async (data) => {
    setServerError("");
    try {
      await api.post("/auth/reset-password", {
        email,
        otp: data.otp,
        newPassword: data.newPassword,
      });
      showToast("Password reset. Log in now.");
      navigate("/login");
    } catch (err) {
      setServerError(err.response?.data?.message || "Reset failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <Card className="w-full max-w-sm p-8">
        {step === "request" ? (
          <>
            <h1 className="text-xl font-semibold tracking-tight text-ink">
              Forgot password
            </h1>
            <p className="mt-1 text-sm text-muted">
              We'll email a reset code.
            </p>

            <form onSubmit={handleSubmit(onRequest)} className="mt-6 space-y-4" noValidate>
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
                    pattern: { value: /^\S+@\S+\.\S+$/, message: "Invalid email format" },
                  })}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
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
                    Sending...
                  </>
                ) : (
                  "Send reset code"
                )}
              </Button>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold tracking-tight text-ink">Reset password</h1>
            <p className="mt-1 text-sm text-muted">
              Code sent to <span className="font-medium text-ink">{email}</span>
            </p>

            <form onSubmit={handleSubmit(onReset)} className="mt-6 space-y-4" noValidate>
              <div>
                <label htmlFor="otp" className="mb-1.5 block text-sm font-medium text-ink">
                  Reset code
                </label>
                <Input
                  id="otp"
                  placeholder="123456"
                  error={!!errors.otp}
                  {...register("otp", { required: "Code required" })}
                />
                {errors.otp && (
                  <p className="mt-1 text-xs text-red-500">{errors.otp.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="newPassword" className="mb-1.5 block text-sm font-medium text-ink">
                  New password
                </label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  error={!!errors.newPassword}
                  {...register("newPassword", {
                    required: "New password required",
                    minLength: { value: 6, message: "Min 6 characters" },
                  })}
                />
                {errors.newPassword && (
                  <p className="mt-1 text-xs text-red-500">{errors.newPassword.message}</p>
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
                    Resetting...
                  </>
                ) : (
                  "Reset password"
                )}
              </Button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-muted">
          <Link to="/login" className="font-medium text-ink underline underline-offset-2">
            Back to login
          </Link>
        </p>
      </Card>
    </div>
  );
}
