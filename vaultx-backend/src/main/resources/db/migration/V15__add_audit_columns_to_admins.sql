-- Add missing audit columns from BaseEntity to admins table

ALTER TABLE admins ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE admins ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);
