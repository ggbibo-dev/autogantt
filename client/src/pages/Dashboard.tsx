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
    <div className="flex min-h-screen flex-col bg-muted/20">
      <Header />
      <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-4 px-6 py-6">
        <CsvUploadControl
          disabled={uploadMutation.isPending}
          onUpload={handleFileUpload}
        />
        <GanttChart />
      </main>
    </div>
  );
}
