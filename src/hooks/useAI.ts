import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getTodayString } from "@/lib/turkish-date";
import { useToast } from "@/hooks/use-toast";

interface AINoteInput {
  date: string;
  note_type: string;
  content: string;
}

export function useAI() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const getDailySummary = useMutation({
    mutationFn: async (date: string = getTodayString()) => {
      const { data, error } = await supabase.functions.invoke("ai-coach", {
        body: { type: "daily", date },
      });

      if (error) throw error;
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Save to ai_notes
      await supabase.from("ai_notes").insert({
        date,
        note_type: "daily_summary",
        content: data.feedback,
      });

      return data.feedback as string;
    },
    onSuccess: (_, date) => {
      queryClient.invalidateQueries({ queryKey: ["ai_notes", date] });
    },
    onError: (error: Error) => {
      if (error.message.includes("Rate limit")) {
        toast({
          title: "Bekleme Süresi",
          description: "Lütfen birkaç saniye bekleyip tekrar deneyin.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Hata",
          description: "AI yanıtı alınamadı. Lütfen tekrar deneyin.",
          variant: "destructive",
        });
      }
    },
  });

  const getPeriodSummary = useMutation({
    mutationFn: async ({ days }: { days: number }) => {
      const endDate = getTodayString();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString().split("T")[0];

      const { data, error } = await supabase.functions.invoke("ai-coach", {
        body: { type: "period", startDate: startDateStr, endDate },
      });

      if (error) throw error;
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Save to ai_notes
      await supabase.from("ai_notes").insert({
        date: endDate,
        note_type: "period_summary",
        content: data.feedback,
      });

      return data.feedback as string;
    },
    onError: (error: Error) => {
      if (error.message.includes("Rate limit")) {
        toast({
          title: "Bekleme Süresi",
          description: "Lütfen birkaç saniye bekleyip tekrar deneyin.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Hata",
          description: "AI yanıtı alınamadı. Lütfen tekrar deneyin.",
          variant: "destructive",
        });
      }
    },
  });

  const askQuestion = useMutation({
    mutationFn: async ({ question }: { question: string }) => {
      const { data, error } = await supabase.functions.invoke("ai-coach", {
        body: { type: "ask", question },
      });

      if (error) throw error;
      
      if (data.error) {
        throw new Error(data.error);
      }

      return data.feedback as string;
    },
    onError: (error: Error) => {
      if (error.message.includes("Rate limit")) {
        toast({
          title: "Bekleme Süresi",
          description: "Lütfen birkaç saniye bekleyip tekrar deneyin.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Hata",
          description: "AI yanıtı alınamadı. Lütfen tekrar deneyin.",
          variant: "destructive",
        });
      }
    },
  });

  return {
    getDailySummary: getDailySummary.mutateAsync,
    getPeriodSummary: getPeriodSummary.mutateAsync,
    askQuestion: askQuestion.mutateAsync,
    isLoadingDaily: getDailySummary.isPending,
    isLoadingPeriod: getPeriodSummary.isPending,
    isLoadingQuestion: askQuestion.isPending,
  };
}

export function useAINotes(date: string) {
  return useQuery({
    queryKey: ["ai_notes", date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_notes")
        .select("*")
        .eq("date", date)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}
