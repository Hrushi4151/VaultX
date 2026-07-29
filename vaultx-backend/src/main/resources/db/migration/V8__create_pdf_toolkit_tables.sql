-- Create pdf_settings table
CREATE TABLE pdf_settings (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    include_cover_page BOOLEAN DEFAULT FALSE,
    include_toc BOOLEAN DEFAULT FALSE,
    page_numbers_position VARCHAR(50), -- TOP_LEFT, BOTTOM_RIGHT, etc.
    watermark_text VARCHAR(255),
    watermark_opacity DECIMAL(3,2),
    watermark_rotation INTEGER,
    watermark_color VARCHAR(20),
    compression_level VARCHAR(20), -- LOW, MEDIUM, HIGH
    owner_password VARCHAR(255),
    user_password VARCHAR(255),
    allow_print BOOLEAN DEFAULT TRUE,
    allow_copy BOOLEAN DEFAULT TRUE,
    allow_edit BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(owner_id)
);

-- Create pdf_templates table
CREATE TABLE pdf_templates (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    settings_json JSONB, -- Storing template settings flexibly
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create pdf_exports table for history
CREATE TABLE pdf_exports (
    id UUID PRIMARY KEY,
    export_name VARCHAR(255) NOT NULL,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_size BIGINT,
    status VARCHAR(50) NOT NULL, -- PENDING, PROCESSING, SUCCESS, FAILED
    error_message TEXT,
    export_type VARCHAR(50), -- MERGE, COMPRESS, SPLIT, etc.
    format VARCHAR(20), -- PDF, ZIP
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_pdf_exports_owner ON pdf_exports(owner_id);
CREATE INDEX idx_pdf_templates_owner ON pdf_templates(owner_id);
