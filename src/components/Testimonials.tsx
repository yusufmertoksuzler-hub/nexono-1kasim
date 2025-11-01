
import React from 'react';

const Testimonials = () => {
  const testimonials = [
    {
      quote: "Platform sayesinde süreçlerimizi sadeleştirdik; raporlama ve analiz çok daha hızlı.",
      author: "Ayşe Yılmaz",
      position: "Finans Direktörü",
      avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg"
    },
    {
      quote: "Gerçek zamanlı göstergeler ve uyarılar, riskleri erken görmemizi sağlıyor.",
      author: "Mehmet Demir",
      position: "Risk Yöneticisi",
      avatarUrl: "https://randomuser.me/api/portraits/men/32.jpg"
    },
    {
      quote: "Uyum ve denetim süreçleri çok daha kolay hale geldi; zamandan kazanıyoruz.",
      author: "Elif Kaya",
      position: "Operasyon Müdürü",
      avatarUrl: "https://randomuser.me/api/portraits/women/65.jpg"
    }
  ];
  
  return (
    <section className="w-full py-20 px-6 md:px-12 bg-card relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 cosmic-grid opacity-20"></div>
      
      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-foreground">
            Kullanıcılarımız ne diyor?
          </h2>
          <p className="text-muted-foreground text-lg">
            Platformumuzun finans operasyonlarını nasıl dönüştürdüğünü keşfedin
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="p-6 rounded-xl border border-border bg-background/80 backdrop-blur-sm hover:border-border/60 transition-all duration-300"
            >
              <div className="mb-6">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-primary inline-block mr-1">★</span>
                ))}
              </div>
              <p className="text-lg mb-8 text-foreground/90 italic">"{testimonial.quote}"</p>
              <div className="flex items-center gap-4">
                <img src={testimonial.avatarUrl} alt={testimonial.author} className="h-12 w-12 rounded-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(testimonial.author); }} />
                <div>
                  <h4 className="font-medium text-foreground">{testimonial.author}</h4>
                  <p className="text-sm text-muted-foreground">{testimonial.position}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
