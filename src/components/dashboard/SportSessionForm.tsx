import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";

interface SportSessionFormProps {
  onSubmit: (data: {
    activity_type: string;
    duration_minutes: number;
    intensity: "hafif" | "orta" | "yüksek";
    notes?: string;
  }) => Promise<void>;
  loading?: boolean;
}

export function SportSessionForm({ onSubmit, loading }: SportSessionFormProps) {
  const [activityType, setActivityType] = useState("");
  const [duration, setDuration] = useState("");
  const [intensity, setIntensity] = useState<"hafif" | "orta" | "yüksek">("orta");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityType.trim() || !duration) return;

    await onSubmit({
      activity_type: activityType.trim(),
      duration_minutes: parseInt(duration),
      intensity,
      notes: notes.trim() || undefined,
    });

    setActivityType("");
    setDuration("");
    setIntensity("orta");
    setNotes("");
  };

  return (
    <form onSubmit={handleSubmit} className="form-section">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="activity">Aktivite Türü *</Label>
          <Input
            id="activity"
            value={activityType}
            onChange={(e) => setActivityType(e.target.value)}
            placeholder="Örn: Koşu, Fitness"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sport-duration">Süre (dakika) *</Label>
          <Input
            id="sport-duration"
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="Örn: 30"
            min="1"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="intensity">Yoğunluk</Label>
        <Select value={intensity} onValueChange={(v) => setIntensity(v as typeof intensity)}>
          <SelectTrigger id="intensity">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hafif">Hafif</SelectItem>
            <SelectItem value="orta">Orta</SelectItem>
            <SelectItem value="yüksek">Yüksek</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sport-notes">Notlar</Label>
        <Textarea
          id="sport-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Antrenman hakkında notlar..."
          rows={2}
        />
      </div>

      <Button type="submit" disabled={loading || !activityType.trim() || !duration}>
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
