-- =====================================================
-- SEAPEDIA Seed Data
-- Demo accounts for all roles
-- =====================================================
-- Passwords are all: "Password123!" (bcrypt hashed)
-- Hash generated with bcrypt, 10 salt rounds

SET NAMES utf8mb4;

-- ---------------------------------------------------
-- DEMO USERS
-- ---------------------------------------------------
INSERT INTO users (username, email, phone, password_hash, full_name, is_verified) VALUES
('admin1',    'admin@seapedia.com',    '081200000001', '$2b$10$placeholder_hash_replace_on_first_run', 'Admin SEAPEDIA', TRUE),
('seller1',   'seller1@seapedia.com',  '081200000002', '$2b$10$placeholder_hash_replace_on_first_run', 'Toko Makmur', TRUE),
('seller2',   'seller2@seapedia.com',  '081200000003', '$2b$10$placeholder_hash_replace_on_first_run', 'Elektronik Jaya', TRUE),
('buyer1',    'buyer1@seapedia.com',   '081200000004', '$2b$10$placeholder_hash_replace_on_first_run', 'Budi Santoso', TRUE),
('buyer2',    'buyer2@seapedia.com',   '081200000005', '$2b$10$placeholder_hash_replace_on_first_run', 'Siti Rahayu', TRUE),
('driver1',   'driver1@seapedia.com',  '081200000006', '$2b$10$placeholder_hash_replace_on_first_run', 'Agus Kurniawan', TRUE),
('multirole', 'multirole@seapedia.com','081200000007', '$2b$10$placeholder_hash_replace_on_first_run', 'Dewi Lestari', TRUE);

-- ---------------------------------------------------
-- ROLE ASSIGNMENTS
-- ---------------------------------------------------
-- admin1: Admin only
INSERT INTO user_roles (user_id, role) VALUES (1, 'admin');

-- seller1 & seller2: Seller only
INSERT INTO user_roles (user_id, role) VALUES (2, 'seller');
INSERT INTO user_roles (user_id, role) VALUES (3, 'seller');

-- buyer1 & buyer2: Buyer only
INSERT INTO user_roles (user_id, role) VALUES (4, 'buyer');
INSERT INTO user_roles (user_id, role) VALUES (5, 'buyer');

-- driver1: Driver only
INSERT INTO user_roles (user_id, role) VALUES (6, 'driver');

-- multirole: Seller + Buyer + Driver (demonstrates multi-role)
INSERT INTO user_roles (user_id, role) VALUES (7, 'seller');
INSERT INTO user_roles (user_id, role) VALUES (7, 'buyer');
INSERT INTO user_roles (user_id, role) VALUES (7, 'driver');

-- ---------------------------------------------------
-- NOTE: Password hashes above are placeholders.
-- The actual seed script in the backend will generate
-- proper bcrypt hashes at runtime via a seed command.
-- ---------------------------------------------------
