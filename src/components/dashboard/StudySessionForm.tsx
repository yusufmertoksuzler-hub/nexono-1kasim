import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Loader2 } from "lucide-react";

interface StudySessionFormProps {
  onSubmit: (data: {
    lesson_name: string;
    topic: string;
    duration_minutes?: number;
    notes?: string;
  }) => Promise<void>;
  loading?: boolean;
}

export function StudySessionForm({ onSubmit, loading }: StudySessionFormProps) {
  const [lessonName, setLessonName] = useState("");
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonName.trim() || !topic.trim()) return;

    await onSubmit({
      lesson_name: lessonName.trim(),
      topic: topic.trim(),
      duration_minutes: duration ? parseInt(duration) : undefined,
      notes: notes.trim() || undefined,
    });

    setLessonName("");
    setTopic("");
    setDuration("");
    setNotes("");
  };

  return (
    <form onSubmit={handleSubmit} className="form-section">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="lesson">Ders Adı *</Label>
          <Input
            id="lesson"
            value={lessonName}
            onChange={(e) => setLessonName(e.target.value)}
            placeholder="Örn: Matematik"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="topic">Konu *</Label>
          <Input
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Örn: Türev"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="duration">Süre (dakika)</Label>
        <Input
          id="duration"
          type="number"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="Örn: 45"
          min="1"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notlar</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Bugünkü çalışma hakkında notlar..."
          rows={2}
        />
      </div>

      <Button type="submit" disabled={loading || !lessonName.trim() || !topic.trim()}>
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Plus className="h-4 w-4 mr-2" />
        )}
        Kaydet
      </Button>
    </form>
  );
}
