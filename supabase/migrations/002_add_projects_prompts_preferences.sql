-- ============================================================================
-- Migration 002: Add Projects, Prompts, and User Preferences Tables
-- ============================================================================
-- Adds support for project organization, reusable prompts, and user preferences
-- Created: 2025-01-08

-- ============================================================================
-- Projects Table - Organize documents and conversations by project
-- ============================================================================

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  icon TEXT DEFAULT 'folder',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_project_name UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_is_default ON projects(user_id, is_default);

-- ============================================================================
-- Prompts Table - Reusable prompt templates
-- ============================================================================

CREATE TABLE IF NOT EXISTS prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  description TEXT,
  variables JSONB DEFAULT '[]',
  category TEXT,
  is_favorite BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_prompt_name UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts(user_id, category);
CREATE INDEX IF NOT EXISTS idx_prompts_is_favorite ON prompts(user_id, is_favorite);

-- ============================================================================
-- User Preferences Table - Store user settings
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  default_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  chat_settings JSONB DEFAULT '{"temperature": 0.1, "maxTokens": 1000}',
  ui_settings JSONB DEFAULT '{"sidebarCollapsed": false, "useKnowledgeBase": true}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Extend Conversations Table - Add project scoping and features
-- ============================================================================

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_conversations_project_id ON conversations(project_id);
CREATE INDEX IF NOT EXISTS idx_conversations_is_pinned ON conversations(user_id, is_pinned);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(user_id, last_message_at DESC NULLS LAST);

-- ============================================================================
-- Extend Documents Table - Add project scoping
-- ============================================================================

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_project ON documents(user_id, project_id);

-- ============================================================================
-- Create Initial Default Projects for Existing Users
-- ============================================================================

INSERT INTO projects (user_id, name, description, is_default)
SELECT DISTINCT user_id, 'General', 'Default project for all documents', true
FROM profiles
WHERE NOT EXISTS (
  SELECT 1 FROM projects p WHERE p.user_id = profiles.id AND p.is_default = true
)
ON CONFLICT (user_id, name) DO NOTHING;

-- ============================================================================
-- Enable RLS on new tables
-- ============================================================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies for Projects
-- ============================================================================

DROP POLICY IF EXISTS "projects_select_own" ON projects;
DROP POLICY IF EXISTS "projects_insert_own" ON projects;
DROP POLICY IF EXISTS "projects_update_own" ON projects;
DROP POLICY IF EXISTS "projects_delete_own" ON projects;

CREATE POLICY "projects_select_own" ON projects
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "projects_insert_own" ON projects
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "projects_update_own" ON projects
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "projects_delete_own" ON projects
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- RLS Policies for Prompts
-- ============================================================================

DROP POLICY IF EXISTS "prompts_select_own" ON prompts;
DROP POLICY IF EXISTS "prompts_insert_own" ON prompts;
DROP POLICY IF EXISTS "prompts_update_own" ON prompts;
DROP POLICY IF EXISTS "prompts_delete_own" ON prompts;

CREATE POLICY "prompts_select_own" ON prompts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "prompts_insert_own" ON prompts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "prompts_update_own" ON prompts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "prompts_delete_own" ON prompts
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- RLS Policies for User Preferences
-- ============================================================================

DROP POLICY IF EXISTS "user_preferences_select_own" ON user_preferences;
DROP POLICY IF EXISTS "user_preferences_insert_own" ON user_preferences;
DROP POLICY IF EXISTS "user_preferences_update_own" ON user_preferences;

CREATE POLICY "user_preferences_select_own" ON user_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_preferences_insert_own" ON user_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_preferences_update_own" ON user_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);
