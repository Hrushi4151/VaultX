-- Create bundles table
CREATE TABLE bundles (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(50),
    icon VARCHAR(50),
    is_favourite BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create bundle_settings table
CREATE TABLE bundle_settings (
    id UUID PRIMARY KEY,
    bundle_id UUID NOT NULL UNIQUE REFERENCES bundles(id) ON DELETE CASCADE,
    include_cover_page BOOLEAN DEFAULT TRUE,
    include_toc BOOLEAN DEFAULT TRUE,
    include_page_numbers BOOLEAN DEFAULT TRUE,
    watermark_text VARCHAR(255),
    compress_output BOOLEAN DEFAULT FALSE,
    output_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create bundle_documents table
CREATE TABLE bundle_documents (
    id UUID PRIMARY KEY,
    bundle_id UUID NOT NULL REFERENCES bundles(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(bundle_id, document_id)
);

-- Create bundle_activities table for audit logs
CREATE TABLE bundle_activities (
    id UUID PRIMARY KEY,
    bundle_id UUID NOT NULL REFERENCES bundles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_bundles_owner ON bundles(owner_id);
CREATE INDEX idx_bundle_documents_bundle ON bundle_documents(bundle_id);
CREATE INDEX idx_bundle_activities_bundle ON bundle_activities(bundle_id);
