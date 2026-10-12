-- ==============================================================================
-- VibeConnect — Complete Supabase PostgreSQL Schema with RLS & 5-Member Limit
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  nickname TEXT,
  avatar_url TEXT,
  bio TEXT DEFAULT 'Hey there! I am using VibeConnect.',
  status TEXT DEFAULT 'online' CHECK (status IN ('online', 'away', 'busy', 'offline')),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. USER-SPECIFIC FRIEND NICKNAMES
-- Allows User A to give User B a personal nickname that only User A sees
CREATE TABLE IF NOT EXISTS public.friend_nicknames (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, friend_id)
);

-- 3. FRIENDSHIPS / CONTACTS
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, friend_id)
);

-- 4. PRIVATE GROUPS (STRICT MAX 5 MEMBERS)
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  avatar_url TEXT,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE NOT NULL,
  max_members INT DEFAULT 5 CHECK (max_members <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. GROUP MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (group_id, user_id)
);

-- ==============================================================================
-- STRICT 5-MEMBER BACKEND LIMIT ENFORCEMENT (RACE-CONDITION SAFE)
-- ==============================================================================
CREATE OR REPLACE FUNCTION check_group_member_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count INT;
  max_allowed INT;
BEGIN
  -- Acquire an exclusive row lock on the parent group to serialize concurrent inserts
  SELECT max_members INTO max_allowed
  FROM public.groups
  WHERE id = NEW.group_id
  FOR UPDATE;

  IF max_allowed IS NULL THEN
    max_allowed := 5;
  END IF;

  SELECT COUNT(*) INTO current_count
  FROM public.group_members
  WHERE group_id = NEW.group_id;

  -- If already at or above the strict limit, reject addition
  IF current_count >= max_allowed THEN
    RAISE EXCEPTION 'VibeConnect Group is full! This private group has reached its maximum limit of % members.', max_allowed;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_group_member_limit ON public.group_members;
CREATE TRIGGER trg_enforce_group_member_limit
BEFORE INSERT ON public.group_members
FOR EACH ROW
EXECUTE FUNCTION check_group_member_limit();

-- 6. CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('direct', 'group')),
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  last_message_preview TEXT,
  last_message_time TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CONVERSATION PARTICIPANTS
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_muted BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  unread_count INT DEFAULT 0,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (conversation_id, user_id)
);

-- 8. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text TEXT,
  reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  is_edited BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. MESSAGE ATTACHMENTS
CREATE TABLE IF NOT EXISTS public.message_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. MESSAGE REACTIONS
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (message_id, user_id, emoji)
);

-- 11. CALL LOGS TABLE
CREATE TABLE IF NOT EXISTS public.call_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  caller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  call_type TEXT NOT NULL CHECK (call_type IN ('voice', 'video')),
  status TEXT NOT NULL CHECK (status IN ('completed', 'missed', 'declined')),
  duration INT DEFAULT 0, -- Duration in seconds
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- 12. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_nicknames ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone authenticated can read profiles; user can update own profile
CREATE POLICY "Public profiles are viewable by authenticated users" 
ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Friend Nicknames: User can only read/manage their own assigned nicknames
CREATE POLICY "Users can manage their own friend nicknames" 
ON public.friend_nicknames FOR ALL TO authenticated 
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Friendships: Users can view their own friendships
CREATE POLICY "Users can view own friendships" 
ON public.friendships FOR SELECT TO authenticated 
USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can manage own friendships" 
ON public.friendships FOR ALL TO authenticated 
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Groups: Viewable by group members
CREATE POLICY "Group members can view groups" 
ON public.groups FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = public.groups.id AND user_id = auth.uid()
  ) OR creator_id = auth.uid()
);

CREATE POLICY "Users can create groups" 
ON public.groups FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Admins can update their groups" 
ON public.groups FOR UPDATE TO authenticated 
USING (
  creator_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = public.groups.id AND user_id = auth.uid() AND role = 'admin'
  )
);

-- Group Members: Members can view members of their group
CREATE POLICY "Members can view fellow group members" 
ON public.group_members FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.group_members AS gm 
    WHERE gm.group_id = public.group_members.group_id AND gm.user_id = auth.uid()
  )
);

CREATE POLICY "Group creators and admins can add members" 
ON public.group_members FOR INSERT TO authenticated 
WITH CHECK (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.groups WHERE id = group_id AND creator_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.group_members WHERE group_id = public.group_members.group_id AND user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can remove members or users can leave" 
ON public.group_members FOR DELETE TO authenticated 
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.groups WHERE id = group_id AND creator_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.group_members WHERE group_id = public.group_members.group_id AND user_id = auth.uid() AND role = 'admin'
  )
);

-- Conversations & Messages: Accessible only to participants
CREATE POLICY "Participants can view conversations" 
ON public.conversations FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants 
    WHERE conversation_id = public.conversations.id AND user_id = auth.uid()
  )
);

CREATE POLICY "Participants can view messages" 
ON public.messages FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants 
    WHERE conversation_id = public.messages.conversation_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Participants can send messages" 
ON public.messages FOR INSERT TO authenticated 
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.conversation_participants 
    WHERE conversation_id = public.messages.conversation_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Senders can edit their messages" 
ON public.messages FOR UPDATE TO authenticated 
USING (auth.uid() = sender_id);

CREATE POLICY "Senders can delete their messages" 
ON public.messages FOR DELETE TO authenticated 
USING (auth.uid() = sender_id);

-- Message Attachments
CREATE POLICY "Conversation participants can view attachments" 
ON public.message_attachments FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.conversation_participants cp ON cp.conversation_id = m.conversation_id
    WHERE m.id = public.message_attachments.message_id AND cp.user_id = auth.uid()
  )
);

-- Reactions
CREATE POLICY "Participants can view reactions" 
ON public.message_reactions FOR SELECT TO authenticated 
USING (true);

CREATE POLICY "Users can add and remove own reactions" 
ON public.message_reactions FOR ALL TO authenticated 
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Call Logs
CREATE POLICY "Users can view call logs they participated in" 
ON public.call_logs FOR SELECT TO authenticated 
USING (
  auth.uid() = caller_id OR 
  auth.uid() = receiver_id OR
  EXISTS (
    SELECT 1 FROM public.group_members WHERE group_id = public.call_logs.group_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Call participants can log calls" 
ON public.call_logs FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = caller_id);

-- Notifications
CREATE POLICY "Users can view and manage their own notifications" 
ON public.notifications FOR ALL TO authenticated 
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER ON SIGNUP
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, nickname, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'nickname', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '🦊')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
