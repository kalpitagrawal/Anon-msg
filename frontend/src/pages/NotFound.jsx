import { Link } from "react-router-dom";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <Card className="flex w-full max-w-sm flex-col items-center gap-4 p-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface">
          <FileQuestion className="h-8 w-8 text-muted" />
        </div>
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-ink">404</h1>
          <p className="mt-2 text-sm text-muted">
            This page doesn't exist or has been moved.
          </p>
        </div>
        <Link to="/" className="w-full">
          <Button variant="outline" className="w-full">
            Back to home
          </Button>
        </Link>
      </Card>
    </div>
  );
}
