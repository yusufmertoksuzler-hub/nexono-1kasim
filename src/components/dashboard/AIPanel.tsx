import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bot, Sparkles, Loader2, AlertCircle } from "lucide-react";

interface AIPanelProps {
  onGetFeedback: () => Promise<string | null>;
  existingFeedback?: string;
}

export function AIPanel({ onGetFeedback, existingFeedback }: AIPanelProps) {
  const [feedback, setFeedback] = useState<string | null>(existingFeedback || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetFeedback = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await onGetFeedback();
      if (result) {
        setFeedback(result);
      }
    } catch (err) {
      setError("Geri bildirim alınırken bir hata oluştu. Lütfen tekrar deneyin.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-panel space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">AI Koç</h3>
          <p className="text-sm text-muted-foreground">
            Bugünkü performansını değerlendir
          </p>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-card border border-border animate-fade-in">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{feedback}</p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3 animate-fade-in">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <Button
        onClick={handleGetFeedback}
        disabled={loading}
        className="w-full"
        variant={feedback ? "secondary" : "default"}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Değerlendiriliyor...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2" />
            {feedback ? "Yeniden Değerlendir" : "Bugünü Değerlendir (AI)"}
          </>
        )}
      </Button>
    </div>
  );
}
