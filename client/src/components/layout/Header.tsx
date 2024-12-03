import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { Link } from "wouter";

export function Header() {
  return (
    <header className="border-b px-6 py-3 flex justify-between items-center">
      <h1 className="text-xl font-semibold">JIRA Gantt</h1>
      <Link href="/settings">
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </Link>
    </header>
  );
}
