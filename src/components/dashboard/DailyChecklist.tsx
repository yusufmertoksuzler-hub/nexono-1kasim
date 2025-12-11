import { Check, BookOpen, Dumbbell, HandHeart } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChecklistItem {
  key: "namaz" | "ders" | "spor";
  label: string;
  icon: React.ElementType;
  checked: boolean;
}

interface DailyChecklistProps {
  namazDone: boolean;
  dersDone: boolean;
  sporDone: boolean;
  onToggle: (key: "namaz" | "ders" | "spor") => void;
  loading?: boolean;
}

export function DailyChecklist({
  namazDone,
  dersDone,
  sporDone,
  onToggle,
  loading,
}: DailyChecklistProps) {
  const items: ChecklistItem[] = [
    { key: "namaz", label: "Namaz", icon: HandHeart, checked: namazDone },
    { key: "ders", label: "Ders", icon: BookOpen, checked: dersDone },
    { key: "spor", label: "Spor", icon: Dumbbell, checked: sporDone },
  ];

  const completedCount = items.filter((item) => item.checked).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Günlük Hedefler</h2>
        <span className="text-sm text-muted-foreground">
          {completedCount}/{items.length} tamamlandı
        </span>
      </div>
      
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => onToggle(item.key)}
              disabled={loading}
              className={cn(
                "checklist-btn",
                item.checked ? "checklist-btn-checked" : "checklist-btn-unchecked",
                loading && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="relative">
                <Icon className="h-8 w-8 md:h-10 md:w-10" />
                {item.checked && (
                  <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-success flex items-center justify-center">
                    <Check className="h-3 w-3 text-success-foreground" />
                  </div>
                )}
              </div>
              <span className="font-medium text-sm md:text-base">{item.label}</span>
            </button>
          );
        })}
      </div>

      {completedCount === 3 && (
        <div className="p-4 rounded-xl bg-success/10 border border-success/20 text-center animate-fade-in">
          <p className="text-success font-medium">
            🎉 Harika! Bugün tüm hedeflerini tamamladın!
          </p>
        </div>
      )}
    </div>
  );
}
