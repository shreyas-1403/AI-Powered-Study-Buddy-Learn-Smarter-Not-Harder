
-- Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name text,
  subscription_tier text NOT NULL DEFAULT 'free',
  credits_remaining integer NOT NULL DEFAULT 20,
  uploads_this_month integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add user_id and created_at to notes table
ALTER TABLE public.notes RENAME COLUMN "user-id" TO user_id;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT 'Untitled';
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notes" ON public.notes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notes" ON public.notes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes" ON public.notes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Add user_id to flashcards via note relationship
ALTER TABLE public.flashcards RENAME COLUMN "note-id" TO note_id;
ALTER TABLE public.flashcards ADD COLUMN IF NOT EXISTS difficulty text DEFAULT 'medium';
ALTER TABLE public.flashcards ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own flashcards" ON public.flashcards
  FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.notes WHERE notes.id = flashcards.note_id AND notes.user_id = auth.uid()));
CREATE POLICY "Users can insert flashcards for own notes" ON public.flashcards
  FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM public.notes WHERE notes.id = flashcards.note_id AND notes.user_id = auth.uid()));

-- Add RLS to quizzes
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own quizzes" ON public.quizzes
  FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.notes WHERE notes.id = quizzes.note_id AND notes.user_id = auth.uid()));
CREATE POLICY "Users can insert quizzes for own notes" ON public.quizzes
  FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM public.notes WHERE notes.id = quizzes.note_id AND notes.user_id = auth.uid()));

-- Add RLS to progress
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own progress" ON public.progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON public.progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Create storage bucket for note uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('note-uploads', 'note-uploads', false, 20971520);

CREATE POLICY "Users can upload their own files" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'note-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read their own files" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'note-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);
