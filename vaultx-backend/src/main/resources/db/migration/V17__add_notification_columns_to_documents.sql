-- Add missing notification columns to documents table

ALTER TABLE documents ADD COLUMN IF NOT EXISTS notified_7d BOOLEAN DEFAULT FALSE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS notified_1d BOOLEAN DEFAULT FALSE;
