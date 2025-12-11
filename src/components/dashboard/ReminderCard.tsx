import { AlertCircle, Trophy, BookOpen, Dumbbell } from "lucide-react";

interface ReminderCardProps {
  type: "warning" | "celebration";
  message: string;
  icon?: "study" | "sport" | "trophy";
}

export function ReminderCard({ type, message, icon }: ReminderCardProps) {
  const icons = {
    study: BookOpen,
    sport: Dumbbell,
    trophy: Trophy,
  };
  
  const Icon = icon ? icons[icon] : (type === "celebration" ? Trophy : AlertCircle);

  if (type === "celebration") {
    return (
      <div className="p-4 rounded-xl bg-gradient-to-r from-accent/20 to-success/20 border border-accent/30 flex items-center gap-3 animate-slide-up">
        <div className="h-10 w-10 rounded-full bg-accent/30 flex items-center justify-center">
          <Icon className="h-5 w-5 text-accent-foreground" />
        </div>
        <p className="text-sm font-medium">{message}</p>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-warning/10 border border-warning/30 flex items-start gap-3 animate-fade-in">
      <div className="h-8 w-8 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4 text-warning" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
