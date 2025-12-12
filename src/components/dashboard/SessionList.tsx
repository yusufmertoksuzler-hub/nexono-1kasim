import { BookOpen, Dumbbell, Clock, Flame, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StudySession {
  id: string;
  lesson_name: string;
  topic: string;
  duration_minutes?: number;
  notes?: string;
}

interface SportSession {
  id: string;
  activity_type: string;
  duration_minutes: number;
  intensity: string;
  notes?: string;
}

interface StudySessionListProps {
  sessions: StudySession[];
  onDelete?: (id: string) => void;
}

interface SportSessionListProps {
  sessions: SportSession[];
  onDelete?: (id: string) => void;
}

export function StudySessionList({ sessions, onDelete }: StudySessionListProps) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Henüz çalışma kaydı yok</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <div
          key={session.id}
          className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 animate-fade-in"
        >
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{session.lesson_name}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">{session.topic}</span>
            </div>
            {session.duration_minutes && (
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{session.duration_minutes} dakika</span>
              </div>
            )}
            {session.notes && (
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                {session.notes}
              </p>
            )}
          </div>
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(session.id)}
              className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

const intensityColors = {
  hafif: "text-green-600",
  orta: "text-amber-600",
  yüksek: "text-red-600",
};

const intensityLabels = {
  hafif: "Hafif",
  orta: "Orta",
  yüksek: "Yüksek",
};

export function SportSessionList({ sessions, onDelete }: SportSessionListProps) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Dumbbell className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Henüz spor kaydı yok</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <div
          key={session.id}
          className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 animate-fade-in"
        >
          <div className="h-8 w-8 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
            <Dumbbell className="h-4 w-4 text-accent-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{session.activity_type}</span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {session.duration_minutes} dakika
              </span>
              <span className={`flex items-center gap-1 ${intensityColors[session.intensity as keyof typeof intensityColors] || ''}`}>
                <Flame className="h-3 w-3" />
                {intensityLabels[session.intensity as keyof typeof intensityLabels] || session.intensity}
              </span>
            </div>
            {session.notes && (
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                {session.notes}
              </p>
            )}
          </div>
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(session.id)}
              className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
