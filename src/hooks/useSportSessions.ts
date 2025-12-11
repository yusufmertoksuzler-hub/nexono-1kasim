import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getTodayString } from "@/lib/turkish-date";
import { useToast } from "@/hooks/use-toast";

interface SportSession {
  id: string;
  date: string;
  activity_type: string;
  duration_minutes: number;
  intensity: string;
  notes?: string;
  created_at: string;
}

export function useSportSessions(date: string = getTodayString()) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["sport_sessions", date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sport_sessions")
        .select("*")
        .eq("date", date)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SportSession[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (session: {
      activity_type: string;
      duration_minutes: number;
      intensity: "hafif" | "orta" | "yüksek";
      notes?: string;
    }) => {
      const { error } = await supabase.from("sport_sessions").insert({
        ...session,
        date,
      });

      if (error) throw error;

      // Auto-mark spor_done
      const { error: dayError } = await supabase
        .from("days")
        .upsert({ date, spor_done: true }, { onConflict: "date" });

      if (dayError) throw dayError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sport_sessions", date] });
      queryClient.invalidateQueries({ queryKey: ["day", date] });
      toast({
        title: "Başarılı",
        description: "Spor kaydedildi!",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Kayıt yapılırken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sport_sessions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sport_sessions", date] });
      toast({
        title: "Silindi",
        description: "Spor kaydı silindi.",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Silme işlemi başarısız oldu.",
        variant: "destructive",
      });
    },
  });

  return {
    sessions,
    isLoading,
    addSession: addMutation.mutateAsync,
    deleteSession: deleteMutation.mutate,
    isAdding: addMutation.isPending,
  };
}
