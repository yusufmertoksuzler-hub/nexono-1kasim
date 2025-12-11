import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getTodayString } from "@/lib/turkish-date";
import { useToast } from "@/hooks/use-toast";

interface Day {
  id: string;
  date: string;
  namaz_done: boolean;
  ders_done: boolean;
  spor_done: boolean;
}

export function useDay(date: string = getTodayString()) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: day, isLoading } = useQuery({
    queryKey: ["day", date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("days")
        .select("*")
        .eq("date", date)
        .maybeSingle();

      if (error) throw error;

      // Create today's record if it doesn't exist
      if (!data) {
        const { data: newDay, error: createError } = await supabase
          .from("days")
          .insert({ date })
          .select()
          .single();

        if (createError) throw createError;
        return newDay as Day;
      }

      return data as Day;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({
      key,
      value,
    }: {
      key: "namaz_done" | "ders_done" | "spor_done";
      value: boolean;
    }) => {
      if (!day) return;

      const { error } = await supabase
        .from("days")
        .update({ [key]: value })
        .eq("id", day.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["day", date] });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Güncelleme yapılırken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  const toggle = (key: "namaz" | "ders" | "spor") => {
    if (!day) return;
    const dbKey = `${key}_done` as "namaz_done" | "ders_done" | "spor_done";
    toggleMutation.mutate({ key: dbKey, value: !day[dbKey] });
  };

  return {
    day,
    isLoading,
    toggle,
    isToggling: toggleMutation.isPending,
  };
}
