import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Trash2, Plus } from "lucide-react";

const AdminProjects = () => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Planning");
  const [targetAmount, setTargetAmount] = useState("");
  const [amountRaised, setAmountRaised] = useState("");

  const { data: projects, isLoading } = useQuery({
    queryKey: ["admin-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("projects").insert({
        title,
        description,
        status,
        target_amount: parseFloat(targetAmount) || 0,
        amount_raised: parseFloat(amountRaised) || 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      setTitle("");
      setDescription("");
      setStatus("Planning");
      setTargetAmount("");
      setAmountRaised("");
      toast({ title: "Project added successfully" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      toast({ title: "Project deleted" });
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="font-semibold text-lg">Add New Project</h3>
          <Input placeholder="Project Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Planning">Planning</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Ongoing">Ongoing</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Input type="number" placeholder="Target Amount" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} />
            <Input type="number" placeholder="Amount Raised" value={amountRaised} onChange={(e) => setAmountRaised(e.target.value)} />
          </div>
          <Button onClick={() => addMutation.mutate()} disabled={!title || addMutation.isPending}>
            <Plus className="h-4 w-4 mr-2" /> Add Project
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="space-y-3">
          {projects?.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{p.status}</span>
                  <h4 className="font-semibold mt-1">{p.title}</h4>
                  <p className="text-sm text-muted-foreground">{p.description}</p>
                  <p className="text-sm mt-1">
                    Raised: <strong>${Number(p.amount_raised).toLocaleString()}</strong>
                    {p.target_amount > 0 && <> / ${Number(p.target_amount).toLocaleString()}</>}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(p.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminProjects;
