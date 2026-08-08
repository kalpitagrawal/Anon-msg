import { useState, useEffect, useCallback } from "react";
import { Copy, Check, MessageSquare, LogOut, Trash2, Loader2, RefreshCw } from "lucide-react";
import api from "@/api/axios";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmModal } from "@/components/ui/modal";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accepting, setAccepting] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const profileUrl = `${window.location.origin}/u/${user?.username}`;

  const fetchMessages = useCallback(async (pageToFetch = 1) => {
    if (pageToFetch === 1) setLoading(true);
    else setLoadingMore(true);
    setError("");
    try {
      const { data } = await api.get("/messages", { params: { page: pageToFetch } });
      setMessages((prev) =>
        pageToFetch === 1 ? data.data.messages : [...prev, ...data.data.messages]
      );
      setPage(data.data.pagination.page);
      setTotalPages(data.data.pagination.totalPages);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load messages");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages(1);
  }, [fetchMessages]);

  useEffect(() => {
    if (!user?.username) return;
    api
      .get(`/users/${user.username}`)
      .then(({ data }) => {
        setAccepting(data.data.user.isAcceptingMessages);
      })
      .catch(() => {});
  }, [user?.username]);

  const handleLoadMore = () => fetchMessages(page + 1);

  const handleToggle = async () => {
    setToggling(true);
    const prev = accepting;
    setAccepting(!prev);
    try {
      const { data } = await api.patch("/messages/toggle-accept");
      setAccepting(data.data.isAcceptingMessages);
    } catch {
      setAccepting(prev);
      showToast("Failed to update preference", "error");
    } finally {
      setToggling(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    showToast("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    const id = deleteTarget;
    setDeleting(true);
    const prevMessages = messages;
    setMessages((cur) => cur.filter((m) => m._id !== id));
    try {
      await api.delete(`/messages/${id}`);
      showToast("Message deleted");
    } catch (err) {
      setMessages(prevMessages);
      showToast(err.response?.data?.message || "Delete failed", "error");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-[1280px] items-center justify-between px-4 py-6 sm:px-8">
        <h1 className="text-lg font-semibold tracking-tight text-ink">Dashboard</h1>
        <Button variant="ghost" size="sm" onClick={logout}>
          <LogOut className="h-4 w-4" />
          Log out
        </Button>
      </header>

      <main className="mx-auto max-w-[1280px] px-4 pb-16 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Profile card */}
          <Card className="h-fit p-6">
            <p className="text-sm text-muted">Logged in as</p>
            <p className="mt-1 text-lg font-semibold text-ink">@{user?.username}</p>
            <p className="text-sm text-muted">{user?.email}</p>

            <div className="mt-6 flex items-center justify-between rounded-xl bg-surface px-4 py-3">
              <span className="text-sm font-medium text-ink">Accept messages</span>
              <button
                role="switch"
                aria-checked={accepting}
                onClick={handleToggle}
                disabled={toggling}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:opacity-50 ${accepting ? "bg-ink" : "bg-neutral-300"
                  }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-150 ${accepting ? "translate-x-5" : "translate-x-0"
                    }`}
                />
              </button>
            </div>

            <div className="mt-4">
              <p className="mb-1.5 text-xs font-medium text-muted">Your profile link</p>
              <div className="flex items-center gap-2 rounded-xl border border-line px-3 py-2">
                <span className="flex-1 truncate text-sm text-ink">{profileUrl}</span>
                <button
                  onClick={handleCopy}
                  aria-label="Copy profile link"
                  className="shrink-0 rounded-lg p-1.5 hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4 text-muted" />
                  )}
                </button>
              </div>
            </div>
          </Card>

          {/* Messages list */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted">
                {loading ? "Loading messages..." : `${messages.length} message${messages.length !== 1 ? "s" : ""}`}
              </h2>
              <button
                onClick={() => fetchMessages(1)}
                disabled={loading}
                aria-label="Refresh messages"
                className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink transition-colors duration-150 hover:bg-surface disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>

            {loading && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            )}

            {!loading && error && (
              <Card className="p-8 text-center">
                <p className="text-sm text-red-600">{error}</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => fetchMessages(1)}>
                  Retry
                </Button>
              </Card>
            )}

            {!loading && !error && messages.length === 0 && (
              <Card className="flex flex-col items-center gap-2 p-10 text-center">
                <MessageSquare className="h-8 w-8 text-muted" />
                <p className="text-sm font-medium text-ink">No messages yet</p>
                <p className="text-sm text-muted">
                  Share your profile link to start receiving anonymous messages.
                </p>
              </Card>
            )}

            {!loading && !error && messages.length > 0 && (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <Card
                    key={msg._id}
                    className="group relative rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-sm p-5"
                  >
                    <button
                      onClick={() => setDeleteTarget(msg._id)}
                      aria-label="Delete message"
                      className="absolute right-3 top-3 rounded-lg p-1.5 text-muted opacity-0 transition-opacity duration-150 hover:bg-red-50 hover:text-red-600 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <p className="pr-6 text-sm leading-relaxed text-ink">{msg.content}</p>
                    <p className="mt-3 text-xs text-muted">
                      {new Date(msg.createdAt).toLocaleString()}
                    </p>
                  </Card>
                ))}

                {page < totalPages && (
                  <div className="pt-2 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        "Load more"
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete message?"
        description="This can't be undone."
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
