import { Header } from "@/components/layout/Header";
import { GanttChart } from "@/components/gantt/GanttChart";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CsvUploadControl } from "@/components/dashboard/CsvUploadControl";
import { useToast } from "@/hooks/use-toast";

export function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const text = await file.text();
      const response = await fetch("/api/upload/csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: text }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.details || "Failed to upload CSV");
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate both epics and tasks queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["epics"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({ title: "Successfully imported tasks from CSV" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to import CSV", 
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (file: File) => {
    uploadMutation.mutate(file);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-6 px-6 py-6">
        <section className="neo-surface relative overflow-hidden px-6 py-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.7),transparent_48%),linear-gradient(135deg,rgba(255,255,255,0.1),rgba(216,226,239,0.06))]" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="neo-badge">Neumorphic Planner</div>
              <div className="space-y-2">
                <h2 className="text-3xl font-semibold tracking-tight text-slate-700">
                  Shape the roadmap before the real CSV lands.
                </h2>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  The first load now opens in demo mode with curated sample work.
                  Upload a CSV whenever you want to replace it with imported tasks.
                </p>
              </div>
            </div>
            <CsvUploadControl
              disabled={uploadMutation.isPending}
              onUpload={handleFileUpload}
            />
          </div>
        </section>
        <GanttChart />
      </main>
    </div>
  );
}
