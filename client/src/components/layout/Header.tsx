import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { Link } from "wouter";

export function Header() {
  return (
    <header className="border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-6 py-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">JIRA Gantt</h1>
          <p className="text-sm text-muted-foreground">
            Planning view for imported delivery work
          </p>
        </div>
      <Link href="/settings">
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </Link>
      </div>
    </header>
  );
}
