-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create tables table
CREATE TABLE public.tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  master_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tables"
  ON public.tables FOR SELECT
  USING (true);

CREATE POLICY "Masters can manage their tables"
  ON public.tables FOR ALL
  USING (auth.uid() = master_id);

-- Create table_members table
CREATE TABLE public.table_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID REFERENCES public.tables(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(table_id, user_id)
);

ALTER TABLE public.table_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view table members"
  ON public.table_members FOR SELECT
  USING (true);

CREATE POLICY "Table masters can manage members"
  ON public.table_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tables
      WHERE tables.id = table_members.table_id
      AND tables.master_id = auth.uid()
    )
  );

CREATE POLICY "Users can join tables"
  ON public.table_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create characters table
CREATE TABLE public.characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID REFERENCES public.tables(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Table masters can manage all characters"
  ON public.characters FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tables
      WHERE tables.id = characters.table_id
      AND tables.master_id = auth.uid()
    )
  );

CREATE POLICY "Players can view table characters"
  ON public.characters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.table_members
      WHERE table_members.table_id = characters.table_id
      AND table_members.user_id = auth.uid()
    )
    OR player_id = auth.uid()
  );

CREATE POLICY "Players can manage own characters"
  ON public.characters FOR ALL
  USING (auth.uid() = player_id);

-- Create npcs table
CREATE TABLE public.npcs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID REFERENCES public.tables(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  is_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.npcs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Table masters can manage npcs"
  ON public.npcs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tables
      WHERE tables.id = npcs.table_id
      AND tables.master_id = auth.uid()
    )
  );

CREATE POLICY "Players can view shared npcs"
  ON public.npcs FOR SELECT
  USING (
    is_shared = true
    AND EXISTS (
      SELECT 1 FROM public.table_members
      WHERE table_members.table_id = npcs.table_id
      AND table_members.user_id = auth.uid()
    )
  );

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID REFERENCES public.tables(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'chat' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Table members can view messages"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.table_members
      WHERE table_members.table_id = chat_messages.table_id
      AND table_members.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.tables
      WHERE tables.id = chat_messages.table_id
      AND tables.master_id = auth.uid()
    )
  );

CREATE POLICY "Table members can send messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      EXISTS (
        SELECT 1 FROM public.table_members
        WHERE table_members.table_id = chat_messages.table_id
        AND table_members.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.tables
        WHERE tables.id = chat_messages.table_id
        AND tables.master_id = auth.uid()
      )
    )
  );

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add triggers for updated_at
CREATE TRIGGER update_characters_updated_at
  BEFORE UPDATE ON public.characters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_npcs_updated_at
  BEFORE UPDATE ON public.npcs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;