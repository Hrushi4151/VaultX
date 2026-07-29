-- V6__create_document_tables.sql

-- 1. Categories (Global system predefined)
CREATE TABLE categories (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    color VARCHAR(20) DEFAULT '#3B82F6', -- Hex code for default color
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed predefined categories
INSERT INTO categories (id, name, description, color) VALUES
    (gen_random_uuid(), 'Identity', 'Passports, IDs, Driver Licenses', '#EF4444'),
    (gen_random_uuid(), 'Education', 'Degrees, Transcripts, Certificates', '#F59E0B'),
    (gen_random_uuid(), 'Finance', 'Bank statements, Tax returns, Receipts', '#10B981'),
    (gen_random_uuid(), 'Medical', 'Prescriptions, Health records, Test results', '#06B6D4'),
    (gen_random_uuid(), 'Insurance', 'Policies, Claims, Vehicle insurance', '#8B5CF6'),
    (gen_random_uuid(), 'Government', 'Tax forms, Legal documents', '#64748B'),
    (gen_random_uuid(), 'Employment', 'Contracts, Payslips, Resumes', '#F97316'),
    (gen_random_uuid(), 'Certificates', 'Birth, Marriage, Death certificates', '#EC4899'),
    (gen_random_uuid(), 'Personal', 'Personal letters, journals', '#14B8A6'),
    (gen_random_uuid(), 'Other', 'Uncategorized documents', '#9CA3AF');

-- 2. Tags (User specific)
CREATE TABLE tags (
    id UUID PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(20) DEFAULT '#3B82F6',
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (name, user_id)
);

-- 3. Collections (User specific)
CREATE TABLE collections (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (name, user_id)
);

-- 4. Documents
CREATE TABLE documents (
    id UUID PRIMARY KEY,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    mime_type VARCHAR(100) NOT NULL,
    extension VARCHAR(20) NOT NULL,
    file_size BIGINT NOT NULL,
    checksum VARCHAR(64) NOT NULL,
    storage_path VARCHAR(1000) NOT NULL,
    bucket_name VARCHAR(255) NOT NULL,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_favourite BOOLEAN NOT NULL DEFAULT FALSE,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documents_owner ON documents(owner_id);
CREATE INDEX idx_documents_category ON documents(category_id);
CREATE INDEX idx_documents_is_deleted ON documents(is_deleted);

-- 5. Document Tags Mapping
CREATE TABLE document_tags (
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (document_id, tag_id)
);

-- 6. Document Collections Mapping
CREATE TABLE document_collections (
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    PRIMARY KEY (document_id, collection_id)
);

-- 7. Document Activities (Audit Log)
CREATE TABLE document_activities (
    id UUID PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- UPLOAD, RENAME, DELETE, RESTORE, ARCHIVE, FAVOURITE, DOWNLOAD, etc.
    details TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_document_activities_doc ON document_activities(document_id);
CREATE INDEX idx_document_activities_user ON document_activities(user_id);
