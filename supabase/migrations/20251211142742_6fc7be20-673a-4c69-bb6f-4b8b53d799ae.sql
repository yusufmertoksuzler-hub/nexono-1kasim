-- Days table for daily checklist
CREATE TABLE public.days (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  namaz_done BOOLEAN NOT NULL DEFAULT false,
  ders_done BOOLEAN NOT NULL DEFAULT false,
  spor_done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Study sessions table
CREATE TABLE public.study_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  lesson_name TEXT NOT NULL,
  topic TEXT NOT NULL,
  notes TEXT,
  duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sport sessions table
CREATE TABLE public.sport_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  activity_type TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  intensity TEXT NOT NULL CHECK (intensity IN ('hafif', 'orta', 'yüksek')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- AI notes table
CREATE TABLE public.ai_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  note_type TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables (but allow all access since no auth required)
ALTER TABLE public.days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sport_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (single user app)
CREATE POLICY "Allow all access to days" ON public.days FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to study_sessions" ON public.study_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to sport_sessions" ON public.sport_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to ai_notes" ON public.ai_notes FOR ALL USING (true) WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for days table
CREATE TRIGGER update_days_updated_at
  BEFORE UPDATE ON public.days
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_days_date ON public.days(date);
CREATE INDEX idx_study_sessions_date ON public.study_sessions(date);
CREATE INDEX idx_sport_sessions_date ON public.sport_sessions(date);
CREATE INDEX idx_ai_notes_date ON public.ai_notes(date);