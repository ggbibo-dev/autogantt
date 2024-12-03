import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Filter, Calendar, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "wouter";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className = "" }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  const { data: epics } = useQuery({
    queryKey: ["epics"],
    queryFn: async () => {
      const response = await fetch("/api/epics");
      if (!response.ok) throw new Error("Failed to fetch epics");
      return response.json();
    },
  });

  const statusOptions = [
    "To Do",
    "In Progress",
    "Done",
    "Blocked",
  ];

  return (
    <Card
      className={`h-full relative border-r transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      } ${className}`}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-4 rounded-full border shadow-sm"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>

      {!collapsed && (
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="font-medium">Filters</span>
            </div>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
              </SelectContent>
            </Select>

            <Accordion type="single" collapsible>
              <AccordionItem value="status">
                <AccordionTrigger>Status</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {statusOptions.map((status) => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox
                          id={status}
                          checked={selectedStatuses.includes(status)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedStatuses([...selectedStatuses, status]);
                            } else {
                              setSelectedStatuses(
                                selectedStatuses.filter((s) => s !== status)
                              );
                            }
                          }}
                        />
                        <label htmlFor={status}>{status}</label>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">Epics</span>
            </div>
            <ScrollArea className="h-[400px]">
              {epics?.map((epic: any) => (
                <div
                  key={epic.id}
                  className="p-2 hover:bg-accent rounded-md cursor-pointer"
                >
                  <div className="text-sm font-medium">{epic.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {epic.status}
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>

          <Separator />

          <Link href="/settings">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </Link>
        </div>
      )}

      {collapsed && (
        <div className="p-2 space-y-4">
          <Button variant="ghost" size="icon" className="w-full">
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="w-full">
            <Calendar className="h-4 w-4" />
          </Button>
          <Link href="/settings">
            <Button variant="ghost" size="icon" className="w-full">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}
    </Card>
  );
}
