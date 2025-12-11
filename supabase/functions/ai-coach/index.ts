import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, date, startDate, endDate, question } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let contextData = "";
    let systemPrompt = "";

    if (type === "daily") {
      // Fetch today's data
      const { data: dayData } = await supabase
        .from("days")
        .select("*")
        .eq("date", date)
        .maybeSingle();

      const { data: studySessions } = await supabase
        .from("study_sessions")
        .select("*")
        .eq("date", date);

      const { data: sportSessions } = await supabase
        .from("sport_sessions")
        .select("*")
        .eq("date", date);

      contextData = `
Bugünün Tarihi: ${date}

Günlük Hedefler:
- Namaz: ${dayData?.namaz_done ? "Tamamlandı ✓" : "Yapılmadı ✗"}
- Ders: ${dayData?.ders_done ? "Tamamlandı ✓" : "Yapılmadı ✗"}
- Spor: ${dayData?.spor_done ? "Tamamlandı ✓" : "Yapılmadı ✗"}

Ders Çalışmaları (${studySessions?.length || 0} kayıt):
${studySessions?.map(s => `- ${s.lesson_name}: ${s.topic} ${s.duration_minutes ? `(${s.duration_minutes} dk)` : ""} ${s.notes ? `- Not: ${s.notes}` : ""}`).join("\n") || "Kayıt yok"}

Spor Aktiviteleri (${sportSessions?.length || 0} kayıt):
${sportSessions?.map(s => `- ${s.activity_type}: ${s.duration_minutes} dk, Yoğunluk: ${s.intensity} ${s.notes ? `- Not: ${s.notes}` : ""}`).join("\n") || "Kayıt yok"}
`;

      systemPrompt = `Sen Yusuf Mert'in kişisel koçusun. Türkçe konuşuyorsun. Yusuf Mert'e günlük performansı hakkında kısa, motive edici ve samimi bir geri bildirim ver. 

Kurallar:
- Maksimum 3-5 cümle yaz
- Yusuf Mert'e ismiyle hitap et
- Olumlu şeyleri vurgula
- İyileştirilecek alanlar varsa nazikçe öner
- Emoji kullanabilirsin ama fazla abartma
- Türkçe yaz`;

    } else if (type === "period") {
      // Fetch period data
      const { data: days } = await supabase
        .from("days")
        .select("*")
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true });

      const { data: studySessions } = await supabase
        .from("study_sessions")
        .select("*")
        .gte("date", startDate)
        .lte("date", endDate);

      const { data: sportSessions } = await supabase
        .from("sport_sessions")
        .select("*")
        .gte("date", startDate)
        .lte("date", endDate);

      const namazCount = days?.filter(d => d.namaz_done).length || 0;
      const dersCount = days?.filter(d => d.ders_done).length || 0;
      const sporCount = days?.filter(d => d.spor_done).length || 0;
      const totalDays = days?.length || 0;

      const totalStudyTime = studySessions?.reduce((acc, s) => acc + (s.duration_minutes || 0), 0) || 0;
      const totalSportTime = sportSessions?.reduce((acc, s) => acc + s.duration_minutes, 0) || 0;

      contextData = `
Dönem: ${startDate} - ${endDate} (${totalDays} gün)

Hedef Tamamlama Oranları:
- Namaz: ${namazCount}/${totalDays} gün (%${totalDays ? Math.round(namazCount/totalDays*100) : 0})
- Ders: ${dersCount}/${totalDays} gün (%${totalDays ? Math.round(dersCount/totalDays*100) : 0})
- Spor: ${sporCount}/${totalDays} gün (%${totalDays ? Math.round(sporCount/totalDays*100) : 0})

Toplam Çalışma Süresi: ${totalStudyTime} dakika
Toplam Spor Süresi: ${totalSportTime} dakika

Çalışılan Dersler:
${[...new Set(studySessions?.map(s => s.lesson_name))].join(", ") || "Kayıt yok"}

Yapılan Spor Aktiviteleri:
${[...new Set(sportSessions?.map(s => s.activity_type))].join(", ") || "Kayıt yok"}
`;

      systemPrompt = `Sen Yusuf Mert'in kişisel koçusun. Türkçe konuşuyorsun. Yusuf Mert'in belirli bir dönemdeki performansını analiz edip ona kapsamlı bir geri bildirim ver.

Kurallar:
- Maksimum 6-8 cümle yaz
- Yusuf Mert'e ismiyle hitap et
- İstatistikleri yorumla
- Güçlü yönleri vurgula
- Gelişim alanlarını belirt
- En az 2 somut, uygulanabilir öneri ver
- Motive edici ol
- Türkçe yaz`;

    } else if (type === "ask") {
      // Fetch recent data for context
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const startDateStr = thirtyDaysAgo.toISOString().split("T")[0];

      const { data: days } = await supabase
        .from("days")
        .select("*")
        .gte("date", startDateStr)
        .order("date", { ascending: false })
        .limit(14);

      const { data: studySessions } = await supabase
        .from("study_sessions")
        .select("*")
        .gte("date", startDateStr);

      const { data: sportSessions } = await supabase
        .from("sport_sessions")
        .select("*")
        .gte("date", startDateStr);

      const namazCount = days?.filter(d => d.namaz_done).length || 0;
      const dersCount = days?.filter(d => d.ders_done).length || 0;
      const sporCount = days?.filter(d => d.spor_done).length || 0;
      const totalDays = days?.length || 0;

      contextData = `
Son ${totalDays} günlük veriler:

Hedef Tamamlama:
- Namaz: ${namazCount}/${totalDays} gün
- Ders: ${dersCount}/${totalDays} gün
- Spor: ${sporCount}/${totalDays} gün

Çalışılan Dersler: ${[...new Set(studySessions?.map(s => s.lesson_name))].join(", ") || "Yok"}
Yapılan Sporlar: ${[...new Set(sportSessions?.map(s => s.activity_type))].join(", ") || "Yok"}

Kullanıcının Sorusu: ${question}
`;

      systemPrompt = `Sen Yusuf Mert'in kişisel koçusun. Türkçe konuşuyorsun. Yusuf Mert sana bir soru soruyor ve sen onun verilerine dayanarak cevap vereceksin.

Kurallar:
- Soruyu doğrudan cevapla
- Verilerine referans ver
- Pratik ve uygulanabilir öneriler sun
- Motive edici ol ama gerçekçi kal
- Maksimum 5-6 cümle yaz
- Türkçe yaz`;
    }

    console.log("Calling AI with context:", contextData.substring(0, 500));

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: contextData },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const feedback = data.choices?.[0]?.message?.content || "Geri bildirim oluşturulamadı.";

    console.log("AI response received successfully");

    return new Response(
      JSON.stringify({ feedback }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in ai-coach function:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
