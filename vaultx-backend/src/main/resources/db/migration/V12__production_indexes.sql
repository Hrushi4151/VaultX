-- Production Optimizations & Indexes

-- Bundle Table Optimizations
CREATE INDEX IF NOT EXISTS idx_bundles_owner_id ON bundles(owner_id);
CREATE INDEX IF NOT EXISTS idx_bundles_is_archived ON bundles(is_archived);

-- Documents Table Optimizations
-- We already have owner_id, but let's ensure category searches are fast
CREATE INDEX IF NOT EXISTS idx_documents_category_id ON documents(category_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);

-- Shares Table Optimizations
-- Fast lookups for public share links
CREATE INDEX IF NOT EXISTS idx_shares_token ON shares(token);
CREATE INDEX IF NOT EXISTS idx_shares_expires_at ON shares(expires_at);

-- Ocr Results & AI Metadata Optimizations
CREATE INDEX IF NOT EXISTS idx_document_ai_metadata_doc_id ON document_ai_metadata(document_id);
CREATE INDEX IF NOT EXISTS idx_document_expiry_doc_id ON document_expiry(document_id);
CREATE INDEX IF NOT EXISTS idx_ocr_results_doc_id ON ocr_results(document_id);

-- Document Upload Validations (Check constraint)
-- While application level handles it, database can provide a safety net for sizes (example: max 100MB roughly)
-- ALTER TABLE documents ADD CONSTRAINT chk_file_size_limit CHECK (file_size <= 104857600);
