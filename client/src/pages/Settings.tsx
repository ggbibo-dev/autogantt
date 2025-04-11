import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { insertJiraSettingsSchema, type JiraSettings } from "@db/schema";
import { useToast } from "@/hooks/use-toast";

export function Settings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<JiraSettings>({
    defaultValues: {
      domain: "",
      apiToken: "",
      email: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: JiraSettings) => {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to save settings");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast({ title: "Settings saved successfully" });
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "Error saving settings",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="container max-w-2xl mx-auto my-auto" >
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-6">JIRA Settings</h2>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="domain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>JIRA Domain</FormLabel>
                  <FormControl>
                    <Input placeholder="your-domain.atlassian.net" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="apiToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Token</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/")}
              >
                Cancel
              </Button>
              <Button type="submit">Save Settings</Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
}
