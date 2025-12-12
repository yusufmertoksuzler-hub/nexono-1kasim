import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatShortDate, parseDate, formatTurkishDate } from "@/lib/turkish-date";
import { Check, X, BookOpen, Dumbbell, Clock, ChevronDown, ChevronUp, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { Helmet } from "react-helmet-async";

interface DayData {
  id: string;
  date: string;
  namaz_done: boolean;
  ders_done: boolean;
  spor_done: boolean;
}

interface StudySession {
  id: string;
  date: string;
  lesson_name: string;
  topic: string;
  duration_minutes?: number;
  notes?: string;
}

interface SportSession {
  id: string;
  date: string;
  activity_type: string;
  duration_minutes: number;
  intensity: string;
  notes?: string;
}

interface AINote {
  id: string;
  date: string;
  note_type: string;
  content: string;
}

function StatusChip({ done, label }: { done: boolean; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
        done
          ? "bg-success/20 text-success"
          : "bg-muted text-muted-foreground"
      )}
    >
      {done ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      {label}
    </span>
  );
}

function DayCard({
  day,
  studySessions,
  sportSessions,
  aiNotes,
}: {
  day: DayData;
  studySessions: StudySession[];
  sportSessions: SportSession[];
  aiNotes: AINote[];
}) {
  const [expanded, setExpanded] = useState(false);

  const totalStudyTime = studySessions.reduce(
    (acc, s) => acc + (s.duration_minutes || 0),
    0
  );
  const totalSportTime = sportSessions.reduce(
    (acc, s) => acc + s.duration_minutes,
    0
  );

  return (
    <div className="section-card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <span className="font-semibold">
            {formatTurkishDate(parseDate(day.date))}
          </span>
          <div className="flex flex-wrap gap-2">
            <StatusChip done={day.namaz_done} label="Namaz" />
            <StatusChip done={day.ders_done} label="Ders" />
            <StatusChip done={day.spor_done} label="Spor" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          {totalStudyTime > 0 && (
            <span className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              {totalStudyTime} dk
            </span>
          )}
          {totalSportTime > 0 && (
            <span className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground">
              <Dumbbell className="h-4 w-4" />
              {totalSportTime} dk
            </span>
          )}
          {expanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-border space-y-4 animate-fade-in">
          {/* Study Sessions */}
          {studySessions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Ders Çalışmaları
              </h4>
              <div className="space-y-2">
                {studySessions.map((s) => (
                  <div
                    key={s.id}
                    className="text-sm p-2 rounded-lg bg-muted/50"
                  >
                    <span className="font-medium">{s.lesson_name}</span>
                    <span className="text-muted-foreground"> • {s.topic}</span>
                    {s.duration_minutes && (
                      <span className="text-muted-foreground">
                        {" "}
                        ({s.duration_minutes} dk)
                      </span>
                    )}
                    {s.notes && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {s.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sport Sessions */}
          {sportSessions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-accent" />
                Spor Aktiviteleri
              </h4>
              <div className="space-y-2">
                {sportSessions.map((s) => (
                  <div
                    key={s.id}
                    className="text-sm p-2 rounded-lg bg-muted/50"
                  >
                    <span className="font-medium">{s.activity_type}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      • {s.duration_minutes} dk • {s.intensity}
                    </span>
                    {s.notes && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {s.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Notes */}
          {aiNotes.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                AI Notları
              </h4>
              <div className="space-y-2">
                {aiNotes.map((n) => (
                  <div
                    key={n.id}
                    className="text-sm p-3 rounded-lg bg-primary/5 border border-primary/10"
                  >
                    <p className="whitespace-pre-wrap">{n.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {studySessions.length === 0 &&
            sportSessions.length === 0 &&
            aiNotes.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Bu gün için detaylı kayıt bulunmuyor.
              </p>
            )}
        </div>
      )}
    </div>
  );
}

export default function History() {
  const { data: days = [], isLoading: daysLoading } = useQuery({
    queryKey: ["days-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("days")
        .select("*")
        .order("date", { ascending: false })
        .limit(30);

      if (error) throw error;
      return data as DayData[];
    },
  });

  const { data: studySessions = [] } = useQuery({
    queryKey: ["study-sessions-history"],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from("study_sessions")
        .select("*")
        .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as StudySession[];
    },
  });

  const { data: sportSessions = [] } = useQuery({
    queryKey: ["sport-sessions-history"],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from("sport_sessions")
        .select("*")
        .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SportSession[];
    },
  });

  const { data: aiNotes = [] } = useQuery({
    queryKey: ["ai-notes-history"],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from("ai_notes")
        .select("*")
        .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AINote[];
    },
  });

  const getSessionsForDate = (date: string) => ({
    study: studySessions.filter((s) => s.date === date),
    sport: sportSessions.filter((s) => s.date === date),
    ai: aiNotes.filter((n) => n.date === date),
  });

  return (
    <Layout>
      <Helmet>
        <title>YusufMert Coach - Geçmiş</title>
        <meta name="description" content="Geçmiş günlerin kayıtları" />
      </Helmet>

      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Geçmiş</h1>
          <p className="text-muted-foreground mt-1">
            Son 30 günün kayıtları
          </p>
        </div>

        {daysLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : days.length === 0 ? (
          <div className="section-card text-center py-12">
            <p className="text-muted-foreground">
              Henüz kayıt bulunmuyor. Bugün sayfasından kayıt eklemeye başla!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {days.map((day) => {
              const sessions = getSessionsForDate(day.date);
              return (
                <DayCard
                  key={day.id}
                  day={day}
                  studySessions={sessions.study}
                  sportSessions={sessions.sport}
                  aiNotes={sessions.ai}
                />
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
