import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { DailyChecklist } from "@/components/dashboard/DailyChecklist";
import { StudySessionForm } from "@/components/dashboard/StudySessionForm";
import { SportSessionForm } from "@/components/dashboard/SportSessionForm";
import { StudySessionList, SportSessionList } from "@/components/dashboard/SessionList";
import { AIPanel } from "@/components/dashboard/AIPanel";
import { ReminderCard } from "@/components/dashboard/ReminderCard";
import { useDay } from "@/hooks/useDay";
import { useStudySessions } from "@/hooks/useStudySessions";
import { useSportSessions } from "@/hooks/useSportSessions";
import { useAI } from "@/hooks/useAI";
import { formatTurkishDate, getTodayString } from "@/lib/turkish-date";
import { BookOpen, Dumbbell, Loader2, PanelRight } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";

const weatherDescriptions: Record<number, string> = {
  0: "Açık",
  1: "Çoğunlukla açık",
  2: "Parçalı bulutlu",
  3: "Bulutlu",
  45: "Sis",
  48: "Sis",
  51: "Çiseleme",
  53: "Çiseleme",
  55: "Yoğun çiseleme",
  56: "Donmuş çiseleme",
  57: "Yoğun donmuş çiseleme",
  61: "Hafif yağmur",
  63: "Yağmur",
  65: "Kuvvetli yağmur",
  66: "Donmuş yağmur",
  67: "Yoğun donmuş yağmur",
  71: "Hafif kar",
  73: "Kar",
  75: "Kuvvetli kar",
  77: "Kar taneleri",
  80: "Hafif sağanak",
  81: "Sağanak",
  82: "Kuvvetli sağanak",
  85: "Kar sağanağı",
  86: "Yoğun kar sağanağı",
  95: "Fırtına",
  96: "Fırtına (dolu)",
  99: "Şiddetli fırtına (dolu)",
};

export default function Index() {
  const [now, setNow] = useState(new Date());
  const [weather, setWeather] = useState<{
    temperature: number | null;
    description: string | null;
    windSpeed: number | null;
    error?: string;
  }>({
    temperature: null,
    description: null,
    windSpeed: null,
  });

  const today = getTodayString();
  const { day, isLoading: dayLoading, toggle, isToggling } = useDay(today);
  const { sessions: studySessions, isLoading: studyLoading, addSession: addStudy, deleteSession: deleteStudy, isAdding: isAddingStudy } = useStudySessions(today);
  const { sessions: sportSessions, isLoading: sportLoading, addSession: addSport, deleteSession: deleteSport, isAdding: isAddingSport } = useSportSessions(today);
  const { getDailySummary } = useAI();

  const isLoading = dayLoading || studyLoading || sportLoading;
  const currentHour = new Date().getHours();
  const isEvening = currentHour >= 18;
  const timeString = now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

  const handleOpenNotes = () => {
    window.open("/notes", "_blank", "noreferrer");
  };

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;

    const fetchWeather = async () => {
      try {
        const response = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=38.468&longitude=27.1074&current=temperature_2m,wind_speed_10m,weather_code"
        );

        if (!response.ok) {
          throw new Error("Beklenmeyen yanıt");
        }

        const data = await response.json();
        if (!active) return;

        const code = data?.current?.weather_code as number | undefined;

        setWeather({
          temperature: data?.current?.temperature_2m ?? null,
          windSpeed: data?.current?.wind_speed_10m ?? null,
          description: code ? weatherDescriptions[code] ?? "Hava durumu" : null,
        });
      } catch (error) {
        if (!active) return;
        setWeather((prev) => ({ ...prev, error: "Hava durumu alınamadı" }));
      }
    };

    fetchWeather();
    return () => {
      active = false;
    };
  }, []);

  // Calculate streak (simplified)
  const showReminders = day && isEvening;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Helmet>
        <title>YusufMert Coach - Bugün</title>
        <meta name="description" content="Yusuf Mert için kişisel AI koçluk uygulaması" />
      </Helmet>

      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="text-center md:text-left">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                Merhaba, Yusuf Mert 👋
              </h1>
              <p className="text-muted-foreground mt-1">
                {formatTurkishDate(new Date())}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 text-sm md:justify-end">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 shadow-sm">
                <span className="font-medium text-foreground">İzmir / Karşıyaka</span>
                <span className="text-foreground">
                  {weather.temperature !== null ? `${weather.temperature.toFixed(1)}°C` : "Yükleniyor..."}
                  {weather.description ? `, ${weather.description}` : ""}
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 shadow-sm">
                <span className="font-medium text-foreground">Saat</span>
                <span className="text-foreground">{timeString}</span>
              </div>
              <Button variant="default" size="sm" className="gap-2" onClick={handleOpenNotes}>
                <PanelRight className="h-4 w-4" />
                Notlar
              </Button>
            </div>
          </div>
        </div>

        {/* Daily Checklist */}
        <section className="section-card">
          <DailyChecklist
            namazDone={day?.namaz_done ?? false}
            dersDone={day?.ders_done ?? false}
            sporDone={day?.spor_done ?? false}
            onToggle={toggle}
            loading={isToggling}
          />
        </section>

        {/* Reminders */}
        {showReminders && (
          <div className="space-y-3">
            {!day.ders_done && (
              <ReminderCard
                type="warning"
                icon="study"
                message="Bugün henüz ders çalışmadın. Küçük bir oturum eklemeye ne dersin?"
              />
            )}
            {!day.spor_done && (
              <ReminderCard
                type="warning"
                icon="sport"
                message="Bugün henüz spor yapmadın. 15 dakikalık bir yürüyüş bile fark yaratır!"
              />
            )}
          </div>
        )}

        {/* Study & Sport Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Study Section */}
          <section className="section-card space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">Ders Çalışma</h2>
                <p className="text-sm text-muted-foreground">
                  Bugün ne çalıştın?
                </p>
              </div>
            </div>

            <StudySessionForm onSubmit={addStudy} loading={isAddingStudy} />

            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-medium mb-3">Bugünün Kayıtları</h3>
              <StudySessionList sessions={studySessions} onDelete={deleteStudy} />
            </div>
          </section>

          {/* Sport Section */}
          <section className="section-card space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center">
                <Dumbbell className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <h2 className="font-semibold">Spor</h2>
                <p className="text-sm text-muted-foreground">
                  Bugün ne yaptın?
                </p>
              </div>
            </div>

            <SportSessionForm onSubmit={addSport} loading={isAddingSport} />

            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-medium mb-3">Bugünün Kayıtları</h3>
              <SportSessionList sessions={sportSessions} onDelete={deleteSport} />
            </div>
          </section>
        </div>

        {/* AI Panel */}
        <section>
          <AIPanel onGetFeedback={() => getDailySummary(today)} />
        </section>
      </div>
    </Layout>
  );
}
