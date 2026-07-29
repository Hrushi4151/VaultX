-- Create ocr_results table
CREATE TABLE ocr_results (
    id UUID PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    extracted_text TEXT,
    language VARCHAR(10) DEFAULT 'eng',
    confidence NUMERIC(5, 2),
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, COMPLETED, FAILED, UNSUPPORTED
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT
);

-- Create document_ai_metadata table
CREATE TABLE document_ai_metadata (
    id UUID PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    detected_category VARCHAR(100), -- Education, Identity, Finance, etc.
    detected_type VARCHAR(100), -- Aadhaar, Passport, Invoice, etc.
    confidence_score NUMERIC(5, 2),
    extracted_fields_json TEXT, -- JSON blob of key-value pairs (Name, Issue Date, etc.)
    tags_json TEXT, -- JSON array of strings
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create document_expiry table
CREATE TABLE document_expiry (
    id UUID PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    expiry_date DATE NOT NULL,
    is_expired BOOLEAN DEFAULT FALSE,
    notified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add full text search capability to documents
ALTER TABLE documents ADD COLUMN search_vector tsvector;
-- Create trigger to automatically update search_vector
CREATE OR REPLACE FUNCTION documents_search_trigger() RETURNS trigger AS $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.display_name,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.description,'')), 'B');
  return new;
end
$$ LANGUAGE plpgsql;

CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE
ON documents FOR EACH ROW EXECUTE FUNCTION documents_search_trigger();

-- Indexes for performance
CREATE INDEX idx_ocr_results_doc ON ocr_results(document_id);
CREATE INDEX idx_doc_ai_meta_doc ON document_ai_metadata(document_id);
CREATE INDEX idx_doc_expiry_doc ON document_expiry(document_id);
CREATE INDEX idx_doc_expiry_date ON document_expiry(expiry_date);
CREATE INDEX idx_documents_search ON documents USING GIN(search_vector);
