import { Link } from "react-router-dom";
import { MessageSquareText, ShieldCheck, ToggleRight, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: ShieldCheck,
    title: "Truly anonymous",
    desc: "No sender data ever stored. Not hidden — never captured.",
  },
  {
    icon: ToggleRight,
    title: "Full control",
    desc: "Toggle message requests on or off anytime.",
  },
  {
    icon: Send,
    title: "One link, share anywhere",
    desc: "Drop your profile link in bio, story, wherever.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-[1280px] items-center justify-between px-4 py-6 sm:px-8">
        <div className="flex items-center gap-2">
          <MessageSquareText className="h-5 w-5" />
          <span className="text-sm font-semibold tracking-tight text-ink">AnonMsg</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm">Log in</Button>
          </Link>
          <Link to="/signup">
            <Button size="sm">Sign up</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-4 pb-24 pt-12 sm:px-8 sm:pt-20">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-5xl">
            Say it anonymously.
          </h1>
          <p className="mt-4 text-base text-muted sm:text-lg">
            Get honest messages from anyone, no name attached. Share your link,
            open your inbox, control who can reach you.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/signup" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto">
                Create your link
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                I have an account
              </Button>
            </Link>
          </div>
        </div>

        {/* preview card - asymmetric note style, signature element */}
        <div className="mx-auto mt-16 max-w-sm">
          <Card className="rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-sm p-6">
            <p className="text-sm leading-relaxed text-ink">
              "you're the reason our team hits every deadline. seriously, thank you."
            </p>
            <p className="mt-3 text-xs text-muted">Anonymous · just now</p>
          </Card>
        </div>

        <div className="mt-24 grid gap-6 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="p-6">
              <Icon className="h-6 w-6 text-ink" />
              <h3 className="mt-4 text-sm font-semibold text-ink">{title}</h3>
              <p className="mt-1.5 text-sm text-muted">{desc}</p>
            </Card>
          ))}
        </div>
      </main>

      <footer className="border-t border-line px-4 py-8 text-center text-xs text-muted sm:px-8">
        Built with the MERN stack.
      </footer>
    </div>
  );
}
