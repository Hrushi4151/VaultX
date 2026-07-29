-- Insert new roles
INSERT INTO roles (id, name, description, created_at, updated_at) VALUES 
(gen_random_uuid(), 'ROLE_SUPER_ADMIN', 'Super Administrator with full access', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'ROLE_MODERATOR', 'Moderator for document review', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'ROLE_SUPPORT', 'Customer Support representative', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (name) DO NOTHING;

-- Ensure an admin user exists (promote user with ID 1 or specific email if needed)
-- For safety, any user who registers as 'admin@vaultx.com' will be super admin.
-- We can seed an admin user here for testing, or we handle it via application startup logic.

-- Admin Logs Table
CREATE TABLE admin_logs (
    id UUID PRIMARY KEY,
    admin_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100),
    entity_id VARCHAR(255),
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- System Settings Table
CREATE TABLE system_settings (
    id UUID PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed basic settings
INSERT INTO system_settings (id, setting_key, setting_value, description) VALUES
(gen_random_uuid(), 'APP_NAME', 'VaultX Enterprise', 'The global application name'),
(gen_random_uuid(), 'MAINTENANCE_MODE', 'false', 'Enable to block non-admin access'),
(gen_random_uuid(), 'ALLOW_REGISTRATIONS', 'true', 'Allow new user signups');

-- Announcements Table
CREATE TABLE announcements (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'INFO', -- INFO, WARNING, SUCCESS, ERROR
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX idx_system_settings_key ON system_settings(setting_key);
