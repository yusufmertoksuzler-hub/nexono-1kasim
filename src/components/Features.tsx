
import React, { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Layers, Grid3x3, ListCheck, BookOpen, Star, LayoutDashboard } from "lucide-react";

const Features = () => {
  const [openFeature, setOpenFeature] = useState<number | null>(null);
  
  const features = [
    {
      title: "Ödeme Otomasyonu",
      description: "Ödeme süreçlerini otomatikleştirerek hata payını azaltın ve verimi artırın.",
      expandedDescription: "Özel onay zincirleriyle iş akışları tanımlayın. Tekrarlayan ödemeleri planlayın ve fatura işlemlerini otomatikleştirin.",
      icon: (
        <Layers size={24} className="text-cosmic-accent" />
      )
    },
    {
      title: "Anlık Analitik",
      description: "Gerçek zamanlı paneller ve raporlarla performansı izleyin.",
      expandedDescription: "Nakit akışı, hacim ve başarı oranlarını takip edin; özelleştirilebilir panolarla rapor üretin.",
      icon: (
        <Grid3x3 size={24} className="text-cosmic-accent" />
      )
    },
    {
      title: "Risk Yönetimi",
      description: "Gelişmiş sahtekârlık tespiti ve risk analiz araçları.",
      expandedDescription: "Şüpheli işlemleri tespit edin, özel kurallarla anlık uyarılar alın ve güvenliği artırın.",
      icon: (
        <LayoutDashboard size={24} className="text-cosmic-accent" />
      )
    },
    {
      title: "Uyum Araçları",
      description: "Regülasyon gerekliliklerini kolayca karşılayın.",
      expandedDescription: "KYC/AML kontrolleri, işlem izleme ve raporlama ile denetime hazır kalın.",
      icon: (
        <ListCheck size={24} className="text-cosmic-accent" />
      )
    },
    {
      title: "Çoklu Para Birimi",
      description: "Anlık kur oranlarıyla çoklu para birimi desteği.",
      expandedDescription: "150+ para birimi desteği, otomatik kur çevirimi ve çoklu para birimi muhasebesi.",
      icon: (
        <Star size={24} className="text-cosmic-accent" />
      )
    },
    // API Integration kartı çıkarıldı
  ];
  
  const toggleFeature = (index: number) => {
    setOpenFeature(openFeature === index ? null : index);
  };
  
  return (
    <section id="features" className="w-full py-12 md:py-16 px-6 md:px-12">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-medium tracking-tighter">
            İşiniz için gereken her şey
          </h2>
          <p className="text-cosmic-muted text-lg">
            Finansal operasyonları sadeleştiren kapsamlı çözümler
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Collapsible
              key={index}
              open={openFeature === index}
              onOpenChange={() => toggleFeature(index)}
              className={`rounded-xl border ${openFeature === index ? 'border-cosmic-light/40' : 'border-cosmic-light/20'} cosmic-gradient transition-all duration-300`}
            >
              <CollapsibleTrigger className="w-full text-left p-6 flex flex-col">
                <div className="flex justify-between items-start">
                  <div className="h-16 w-16 rounded-full bg-cosmic-light/10 flex items-center justify-center mb-6">
                    {feature.icon}
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-cosmic-muted transition-transform duration-200 ${
                      openFeature === index ? 'rotate-180' : ''
                    }`}
                  />
                </div>
                <h3 className="text-xl font-medium tracking-tighter mb-3">{feature.title}</h3>
                <p className="text-cosmic-muted">{feature.description}</p>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-6 pb-6 pt-2">
                <div className="pt-3 border-t border-cosmic-light/10">
                  <p className="text-cosmic-muted">{feature.expandedDescription}</p>
                  <div className="mt-4 flex justify-end">
                    <button className="text-cosmic-accent hover:text-cosmic-accent/80 text-sm font-medium">
                      Detaylar →
                    </button>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
