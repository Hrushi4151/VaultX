-- Create shares table
CREATE TABLE shares (
    id UUID PRIMARY KEY,
    token VARCHAR(50) NOT NULL UNIQUE,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    target_type VARCHAR(50) NOT NULL, -- DOCUMENT, COLLECTION, BUNDLE, PDF_EXPORT
    
    -- Security
    hashed_password VARCHAR(255),
    expires_at TIMESTAMP WITH TIME ZONE,
    max_downloads INTEGER,
    downloads_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Permissions
    allow_download BOOLEAN DEFAULT TRUE,
    allow_print BOOLEAN DEFAULT FALSE,
    allow_copy BOOLEAN DEFAULT FALSE,
    allow_pdf_export BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create share_files table to map shares to documents
CREATE TABLE share_files (
    id UUID PRIMARY KEY,
    share_id UUID NOT NULL REFERENCES shares(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    UNIQUE(share_id, document_id)
);

-- Create share_views for analytics
CREATE TABLE share_views (
    id UUID PRIMARY KEY,
    share_id UUID NOT NULL REFERENCES shares(id) ON DELETE CASCADE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    browser VARCHAR(100),
    operating_system VARCHAR(100),
    country VARCHAR(100),
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create share_downloads for analytics
CREATE TABLE share_downloads (
    id UUID PRIMARY KEY,
    share_id UUID NOT NULL REFERENCES shares(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL, -- NULL if ZIP download of whole share
    ip_address VARCHAR(45),
    user_agent TEXT,
    downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast lookup
CREATE INDEX idx_shares_token ON shares(token);
CREATE INDEX idx_shares_owner ON shares(owner_id);
CREATE INDEX idx_share_views_share ON share_views(share_id);
CREATE INDEX idx_share_downloads_share ON share_downloads(share_id);
