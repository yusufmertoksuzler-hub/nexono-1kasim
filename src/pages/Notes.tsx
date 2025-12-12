import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, StickyNote, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getTodayString } from "@/lib/turkish-date";
import { useToast } from "@/components/ui/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type NoteRow = Tables<"ai_notes">;

export default function Notes() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<FileList | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const { toast } = useToast();

  const formattedNotes = useMemo(
    () =>
      notes.map((note) => {
        const lines = note.content.split("\n");
        const titlePart = lines.shift() || "(Başlık yok)";

        let imageUrls: string[] = [];
        const imageLineIndex = lines.findIndex((l) => l.startsWith("[images]:"));
        if (imageLineIndex >= 0) {
          const raw = lines[imageLineIndex].replace("[images]:", "").trim();
          imageUrls = raw ? raw.split(",").map((u) => u.trim()).filter(Boolean) : [];
          lines.splice(imageLineIndex, 1);
        }

        const body = lines.join("\n").trim();
        return { ...note, titlePart, body, imageUrls };
      }),
    [notes]
  );

  const fetchNotes = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("ai_notes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      setNotes(data);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Eksik bilgi",
        description: "Başlık ve not içeriği doldurulmalı.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      let uploadedUrls: string[] = [];

      if (images && images.length > 0) {
        const bucket = "note-images";
        const uploads = Array.from(images).map(async (file) => {
          const ext = file.name.split(".").pop() || "jpg";
          const path = `${getTodayString()}-${crypto.randomUUID?.() ?? Date.now()}.${ext}`;

          const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
            contentType: file.type,
            upsert: false,
          });
          if (uploadError) throw uploadError;

          const { data } = supabase.storage.from(bucket).getPublicUrl(path);
          if (data?.publicUrl) {
            uploadedUrls.push(data.publicUrl);
          }
        });

        await Promise.all(uploads);
      }

      const imagesLine = uploadedUrls.length ? `\n\n[images]:${uploadedUrls.join(",")}` : "";

      const { error } = await supabase.from("ai_notes").insert({
        content: `${title.trim()}\n\n${content.trim()}${imagesLine}`,
        date: getTodayString(),
        note_type: "note",
      });

      if (error) throw error;

      setTitle("");
      setContent("");
      setImages(null);
      toast({ title: "Kaydedildi", description: "Not Lovable DB'ye eklendi." });
      fetchNotes();
    } catch (err) {
      toast({
        title: "Kayıt hatası",
        description: err instanceof Error ? err.message : "Bilinmeyen hata",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Layout>
      <Helmet>
        <title>Notlar</title>
        <meta name="description" content="Kişisel notlarını kaydet ve görüntüle" />
      </Helmet>

      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10">
            <StickyNote className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">Notlar</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Başlık ekleyip notunu kaydet, son notlarını aşağıda gör.
          </p>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Yeni Not</CardTitle>
            <CardDescription>Başlık ve not içeriğini doldurup kaydet.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Başlık</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Örn: Çalışma planı" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Not</label>
              <Textarea
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Örn: Bugün odaklanmam gerekenler..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Görsel ekle (isteğe bağlı)</label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setImages(e.target.files)}
              />
              <p className="text-xs text-muted-foreground">
                Çoklu seçim desteklenir; yüklenen görseller public URL olarak notla kaydedilir.
              </p>
            </div>
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <StickyNote className="h-4 w-4" />}
              {isSaving ? "Kaydediliyor..." : "Notu Kaydet"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Son Notlar</CardTitle>
            <CardDescription>Son 20 not listelenir.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Notlar yükleniyor...
              </div>
            ) : formattedNotes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz not yok.</p>
            ) : (
              <div className="space-y-3">
                {formattedNotes.map((note) => (
                  <div key={note.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{note.titlePart}</p>
                        <p className="text-xs text-muted-foreground">{new Date(note.created_at).toLocaleString("tr-TR")}</p>
                      </div>
                      <span className="text-xs rounded-full bg-muted px-2 py-1 text-muted-foreground">{note.note_type}</span>
                    </div>
                    {note.body && <p className="mt-2 text-sm whitespace-pre-wrap">{note.body}</p>}
                    {note.imageUrls && note.imageUrls.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-3">
                        {note.imageUrls.map((url) => (
                          <a
                            key={url}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="group relative block h-24 w-32 overflow-hidden rounded-lg border border-border bg-muted"
                          >
                            <img
                              src={url}
                              alt="Not görseli"
                              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

