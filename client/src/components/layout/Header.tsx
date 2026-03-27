import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { Link } from "wouter";

export function Header() {
  return (
    <header className="px-6 pt-6">
      <div className="neo-surface mx-auto flex w-full max-w-[1600px] items-center justify-between px-6 py-4">
        <div>
          <div className="neo-badge mb-2 w-fit">Delivery Console</div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-700">
            JIRA Gantt
          </h1>
          <p className="text-sm text-muted-foreground">
            Soft-UI planning view for imported delivery work
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
