-- V3: Create refresh_tokens table for JWT token management

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    token       TEXT      NOT NULL UNIQUE,
    expiry_date TIMESTAMP NOT NULL,
    is_revoked  BOOLEAN   NOT NULL DEFAULT FALSE,
    user_id     UUID      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP,
    created_by  VARCHAR(255),
    updated_by  VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token   ON refresh_tokens (token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expiry  ON refresh_tokens (expiry_date);
