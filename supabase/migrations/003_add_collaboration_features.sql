-- Migration: Add Collaboration Features
-- Description: Adds tables and features for project collaboration, members, invitations, and knowledge bases
-- Version: 003
-- Date: 2026-01-11

-- Enable RLS on all tables
SET row_security = on;

-- 1. PROJECT MEMBERS TABLE
-- Manages project membership and roles
CREATE TABLE IF NOT EXISTS project_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    permissions JSONB DEFAULT '{"read": true, "write": false, "admin": false}'::jsonb,
    invited_by UUID REFERENCES profiles(id),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique membership per project
    UNIQUE(project_id, user_id)
);

-- 2. PROJECT INVITATIONS TABLE
-- Manages pending project invitations
CREATE TABLE IF NOT EXISTS project_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
    permissions JSONB DEFAULT '{"read": true, "write": false, "admin": false}'::jsonb,
    token TEXT NOT NULL UNIQUE,
    invited_by UUID NOT NULL REFERENCES profiles(id),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMP WITH TIME ZONE,
    accepted_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique pending invitation per project/email
    UNIQUE(project_id, email)
);

-- 3. DOCUMENT SHARES TABLE
-- Manages document sharing and permissions
CREATE TABLE IF NOT EXISTS document_shares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    shared_by UUID NOT NULL REFERENCES profiles(id),
    shared_with UUID REFERENCES profiles(id), -- NULL for public shares
    share_type TEXT NOT NULL DEFAULT 'private' CHECK (share_type IN ('private', 'project', 'public')),
    permissions JSONB DEFAULT '{"read": true, "download": false}'::jsonb,
    share_token TEXT UNIQUE, -- For public/token-based shares
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ACTIVITY LOG TABLE
-- Tracks user and project activities
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id),
    project_id UUID REFERENCES projects(id),
    action TEXT NOT NULL, -- 'created', 'updated', 'deleted', 'shared', 'joined', etc.
    resource_type TEXT NOT NULL, -- 'project', 'document', 'conversation', 'member', etc.
    resource_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. KNOWLEDGE BASES TABLE
-- Manages knowledge base collections
CREATE TABLE IF NOT EXISTS knowledge_bases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    user_id UUID NOT NULL REFERENCES profiles(id),
    project_id UUID REFERENCES projects(id),
    is_public BOOLEAN DEFAULT FALSE,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. KNOWLEDGE BASE DOCUMENTS TABLE
-- Links documents to knowledge bases
CREATE TABLE IF NOT EXISTS knowledge_base_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    knowledge_base_id UUID NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    added_by UUID NOT NULL REFERENCES profiles(id),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique document per knowledge base
    UNIQUE(knowledge_base_id, document_id)
);

-- 7. USER SESSIONS TABLE
-- Enhanced session management
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    device_info JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- UPDATE EXISTING TABLES

-- Add collaboration fields to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS allow_member_invite BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS max_members INTEGER DEFAULT 10;

-- Add project reference to conversations
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id),
ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;

-- Add enhanced metadata to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- CREATE INDEXES FOR PERFORMANCE

-- Project members indexes
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_role ON project_members(role);

-- Project invitations indexes
CREATE INDEX IF NOT EXISTS idx_project_invitations_project_id ON project_invitations(project_id);
CREATE INDEX IF NOT EXISTS idx_project_invitations_email ON project_invitations(email);
CREATE INDEX IF NOT EXISTS idx_project_invitations_token ON project_invitations(token);
CREATE INDEX IF NOT EXISTS idx_project_invitations_expires_at ON project_invitations(expires_at);

-- Document shares indexes
CREATE INDEX IF NOT EXISTS idx_document_shares_document_id ON document_shares(document_id);
CREATE INDEX IF NOT EXISTS idx_document_shares_shared_by ON document_shares(shared_by);
CREATE INDEX IF NOT EXISTS idx_document_shares_shared_with ON document_shares(shared_with);
CREATE INDEX IF NOT EXISTS idx_document_shares_share_token ON document_shares(share_token);

-- Activity log indexes
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_project_id ON activity_log(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON activity_log(action);
CREATE INDEX IF NOT EXISTS idx_activity_log_resource_type ON activity_log(resource_type);

-- Knowledge bases indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_bases_user_id ON knowledge_bases(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_bases_project_id ON knowledge_bases(project_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_bases_is_public ON knowledge_bases(is_public);

-- Knowledge base documents indexes
CREATE INDEX IF NOT EXISTS idx_kb_documents_kb_id ON knowledge_base_documents(knowledge_base_id);
CREATE INDEX IF NOT EXISTS idx_kb_documents_document_id ON knowledge_base_documents(document_id);

-- User sessions indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Conversations project index
CREATE INDEX IF NOT EXISTS idx_conversations_project_id ON conversations(project_id);
CREATE INDEX IF NOT EXISTS idx_conversations_share_token ON conversations(share_token);

-- ROW LEVEL SECURITY POLICIES

-- Project Members RLS
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view project members for their projects" ON project_members
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
            UNION
            SELECT project_id FROM project_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Project owners can manage members" ON project_members
    FOR ALL USING (
        project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can leave projects" ON project_members
    FOR DELETE USING (user_id = auth.uid());

-- Project Invitations RLS
ALTER TABLE project_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invitations for their projects" ON project_invitations
    FOR SELECT USING (
        project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
        OR invited_by = auth.uid()
    );

CREATE POLICY "Project owners can manage invitations" ON project_invitations
    FOR ALL USING (
        project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    );

-- Document Shares RLS
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view shares for their documents" ON document_shares
    FOR SELECT USING (
        document_id IN (SELECT id FROM documents WHERE user_id = auth.uid())
        OR shared_with = auth.uid()
        OR shared_by = auth.uid()
    );

CREATE POLICY "Document owners can manage shares" ON document_shares
    FOR ALL USING (
        document_id IN (SELECT id FROM documents WHERE user_id = auth.uid())
    );

-- Activity Log RLS
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activity" ON activity_log
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view project activity for their projects" ON activity_log
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
            UNION
            SELECT project_id FROM project_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create activity logs" ON activity_log
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Knowledge Bases RLS
ALTER TABLE knowledge_bases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their knowledge bases" ON knowledge_bases
    FOR SELECT USING (
        user_id = auth.uid() 
        OR is_public = TRUE
        OR project_id IN (
            SELECT project_id FROM project_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their knowledge bases" ON knowledge_bases
    FOR ALL USING (user_id = auth.uid());

-- Knowledge Base Documents RLS
ALTER TABLE knowledge_base_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view KB documents for accessible KBs" ON knowledge_base_documents
    FOR SELECT USING (
        knowledge_base_id IN (
            SELECT id FROM knowledge_bases 
            WHERE user_id = auth.uid() 
            OR is_public = TRUE
            OR project_id IN (
                SELECT project_id FROM project_members WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "KB owners can manage KB documents" ON knowledge_base_documents
    FOR ALL USING (
        knowledge_base_id IN (SELECT id FROM knowledge_bases WHERE user_id = auth.uid())
    );

-- User Sessions RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions" ON user_sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own sessions" ON user_sessions
    FOR ALL USING (user_id = auth.uid());

-- FUNCTIONS AND TRIGGERS

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_project_members_updated_at 
    BEFORE UPDATE ON project_members 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_shares_updated_at 
    BEFORE UPDATE ON document_shares 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_bases_updated_at 
    BEFORE UPDATE ON knowledge_bases 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to log activity
CREATE OR REPLACE FUNCTION log_activity(
    p_user_id UUID,
    p_project_id UUID DEFAULT NULL,
    p_action TEXT,
    p_resource_type TEXT,
    p_resource_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    activity_id UUID;
BEGIN
    INSERT INTO activity_log (user_id, project_id, action, resource_type, resource_id, metadata)
    VALUES (p_user_id, p_project_id, p_action, p_resource_type, p_resource_id, p_metadata)
    RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired invitations
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM project_invitations 
    WHERE expires_at < NOW() AND accepted_at IS NULL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- INITIAL DATA

-- Create default knowledge base for existing users
INSERT INTO knowledge_bases (name, description, user_id, is_public)
SELECT 
    'My Knowledge Base',
    'Default knowledge base for personal documents',
    id,
    FALSE
FROM profiles
WHERE NOT EXISTS (
    SELECT 1 FROM knowledge_bases WHERE user_id = profiles.id
);

-- Add project owners as members with owner role
INSERT INTO project_members (project_id, user_id, role, permissions, joined_at)
SELECT 
    id,
    user_id,
    'owner',
    '{"read": true, "write": true, "admin": true}'::jsonb,
    created_at
FROM projects
WHERE NOT EXISTS (
    SELECT 1 FROM project_members 
    WHERE project_id = projects.id AND user_id = projects.user_id
);

-- COMMENTS
COMMENT ON TABLE project_members IS 'Manages project membership and user roles';
COMMENT ON TABLE project_invitations IS 'Manages pending project invitations with expiration';
COMMENT ON TABLE document_shares IS 'Manages document sharing permissions and tokens';
COMMENT ON TABLE activity_log IS 'Tracks all user and project activities for audit trail';
COMMENT ON TABLE knowledge_bases IS 'Manages knowledge base collections for organizing documents';
COMMENT ON TABLE knowledge_base_documents IS 'Links documents to knowledge bases';
COMMENT ON TABLE user_sessions IS 'Enhanced session management with device tracking';

COMMENT ON FUNCTION log_activity IS 'Logs user activities for audit trail and notifications';
COMMENT ON FUNCTION cleanup_expired_invitations IS 'Removes expired project invitations';
COMMENT ON FUNCTION cleanup_expired_sessions IS 'Removes expired user sessions';