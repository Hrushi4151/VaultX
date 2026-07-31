-- Add missing columns to users table for phone verification, wallet, and biometrics

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_phone_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS face_data TEXT;
