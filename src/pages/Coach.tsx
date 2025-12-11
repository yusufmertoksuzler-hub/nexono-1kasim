import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAI } from "@/hooks/useAI";
import { Bot, Sparkles, Send, Loader2, MessageSquare } from "lucide-react";
import { Helmet } from "react-helmet-async";

export default function Coach() {
  const [period, setPeriod] = useState("7");
  const [periodSummary, setPeriodSummary] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);

  const { getPeriodSummary, askQuestion, isLoadingPeriod, isLoadingQuestion } =
    useAI();

  const handleGetSummary = async () => {
    try {
      const result = await getPeriodSummary({ days: parseInt(period) });
      setPeriodSummary(result);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) return;
    try {
      const result = await askQuestion({ question: question.trim() });
      setAnswer(result);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Layout>
      <Helmet>
        <title>YusufMert Coach - AI Koç</title>
        <meta name="description" content="AI destekli kişisel koçluk" />
      </Helmet>

      <div className="space-y-8 animate-fade-in max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-4">
            <Bot className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">AI Koç</h1>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            Burada yapay zekâ, son günlerde yaptıklarına bakarak sana kısa
            tavsiyeler verecek.
          </p>
        </div>

        {/* Period Summary Section */}
        <section className="section-card space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <h2 className="font-semibold">Dönem Özeti</h2>
              <p className="text-sm text-muted-foreground">
                Belirli bir dönemin analizini al
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Dönem seç" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">Son 3 gün</SelectItem>
                <SelectItem value="7">Son 7 gün</SelectItem>
                <SelectItem value="30">Son 30 gün</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={handleGetSummary}
              disabled={isLoadingPeriod}
              className="flex-1 sm:flex-none"
            >
              {isLoadingPeriod ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analiz ediliyor...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Özet ve Tavsiye Oluştur
                </>
              )}
            </Button>
          </div>

          {periodSummary && (
            <div className="p-4 rounded-xl bg-muted/50 border border-border animate-fade-in">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {periodSummary}
              </p>
            </div>
          )}
        </section>

        {/* Ask Question Section */}
        <section className="section-card space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">Soru Sor</h2>
              <p className="text-sm text-muted-foreground">
                Koçuna bir soru sor, verilerine göre cevap alsın
              </p>
            </div>
          </div>

          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Örn: 'Programıma nasıl daha sadık kalırım?' veya 'Spor rutinimde ne değiştirmeliyim?'"
            rows={3}
          />

          <Button
            onClick={handleAskQuestion}
            disabled={isLoadingQuestion || !question.trim()}
            className="w-full sm:w-auto"
          >
            {isLoadingQuestion ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Düşünüyor...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                AI'ya Sor
              </>
            )}
          </Button>

          {answer && (
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 animate-fade-in">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {answer}
              </p>
            </div>
          )}
        </section>

        {/* Tips */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            💡 İpucu: Günlük kayıtlarını düzenli girersen AI daha doğru
            önerilerde bulunabilir.
          </p>
        </div>
      </div>
    </Layout>
  );
}
