import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getTodayString } from "@/lib/turkish-date";
import { useToast } from "@/hooks/use-toast";

interface StudySession {
  id: string;
  date: string;
  lesson_name: string;
  topic: string;
  duration_minutes?: number;
  notes?: string;
  created_at: string;
}

export function useStudySessions(date: string = getTodayString()) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["study_sessions", date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_sessions")
        .select("*")
        .eq("date", date)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as StudySession[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (session: {
      lesson_name: string;
      topic: string;
      duration_minutes?: number;
      notes?: string;
    }) => {
      const { error } = await supabase.from("study_sessions").insert({
        ...session,
        date,
      });

      if (error) throw error;

      // Auto-mark ders_done
      const { error: dayError } = await supabase
        .from("days")
        .upsert({ date, ders_done: true }, { onConflict: "date" });

      if (dayError) throw dayError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["study_sessions", date] });
      queryClient.invalidateQueries({ queryKey: ["day", date] });
      toast({
        title: "Başarılı",
        description: "Çalışma kaydedildi!",
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
      const { error } = await supabase.from("study_sessions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["study_sessions", date] });
      toast({
        title: "Silindi",
        description: "Çalışma kaydı silindi.",
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
