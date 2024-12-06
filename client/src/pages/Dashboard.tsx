import { Header } from "@/components/layout/Header";
import { GanttChart } from "@/components/gantt/GanttChart";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const text = await file.text();
      console.log('Sending CSV data:', text.substring(0, 200) + '...');
      const response = await fetch("/api/upload/csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: text })
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
        variant: "destructive" 
      });
    }
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File upload triggered');
    const file = event.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }
    console.log('File selected:', file.name);
    uploadMutation.mutate(file);
  };

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <main className="flex-1 p-6 overflow-auto">
        <div className="flex justify-end mb-4">
          <div>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csvUpload"
            />
            <Label htmlFor="csvUpload" className="cursor-pointer">
              <Button
                type="button"
                disabled={uploadMutation.isPending}
                onClick={() => {
                  console.log('Upload button clicked');
                  const input = document.getElementById('csvUpload');
                  if (input) {
                    input.click();
                  } else {
                    console.log('Could not find upload input');
                  }
                }}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload CSV
              </Button>
            </Label>
          </div>
        </div>
        <GanttChart />
      </main>
    </div>
  );
}
