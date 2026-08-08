import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Loader2, Send, UserX } from "lucide-react";
import api from "@/api/axios";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/context/ToastContext";

export default function PublicProfile() {
  const { username } = useParams();
  const { showToast } = useToast();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const content = watch("content", "");

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const { data } = await api.get(`/users/${username}`);
        setProfile(data.data.user);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [username]);

  const onSubmit = async (formData) => {
    try {
      await api.post(`/messages/send/${username}`, formData);
      showToast("Message sent anonymously");
      reset();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to send", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 px-4 text-center">
        <UserX className="h-8 w-8 text-muted" />
        <p className="text-sm font-medium text-ink">User not found</p>
        <p className="text-sm text-muted">This profile doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <Card className="w-full max-w-sm p-8">
        <h1 className="text-xl font-semibold tracking-tight text-ink">
          @{profile.username}
        </h1>
        <p className="mt-1 text-sm text-muted">Send an anonymous message.</p>

        {!profile.isAcceptingMessages ? (
          <div className="mt-6 rounded-xl bg-surface px-4 py-6 text-center text-sm text-muted">
            This user isn't accepting messages right now.
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-3" noValidate>
            <div>
              <label htmlFor="content" className="sr-only">
                Anonymous message
              </label>
              <textarea
                id="content"
                rows={4}
                placeholder="Say something anonymous..."
                aria-invalid={!!errors.content}
                aria-describedby="content-error content-count"
                className={`w-full resize-none rounded-xl border px-4 py-3 text-sm transition-colors duration-150 placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 ${
                  errors.content ? "border-red-500" : "border-line"
                }`}
                {...register("content", {
                  required: "Message can't be empty",
                  maxLength: { value: 500, message: "Max 500 characters" },
                  validate: (v) => v.trim().length > 0 || "Message can't be empty",
                })}
              />
              <div className="mt-1 flex items-center justify-between">
                <span id="content-error" role="alert" className="text-xs text-red-500">
                  {errors.content?.message}
                </span>
                <span id="content-count" className="text-xs text-muted">
                  {content.length}/500
                </span>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send anonymously
                </>
              )}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
