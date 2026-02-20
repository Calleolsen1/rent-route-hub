
-- Create demo users in auth.users with known passwords
-- guest@demo.com / demoguest12345
-- host@demo.com / demohost12345

-- Insert demo guest user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud
) VALUES (
  'aaaaaaaa-0001-0001-0001-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'guest@demo.com',
  crypt('demoguest12345', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"first_name":"Demo","last_name":"Guest"}',
  false,
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO UPDATE SET
  encrypted_password = crypt('demoguest12345', gen_salt('bf')),
  email_confirmed_at = now(),
  updated_at = now();

-- Insert demo host user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud
) VALUES (
  'aaaaaaaa-0002-0002-0002-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'host@demo.com',
  crypt('demohost12345', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"first_name":"Demo","last_name":"Host"}',
  false,
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO UPDATE SET
  encrypted_password = crypt('demohost12345', gen_salt('bf')),
  email_confirmed_at = now(),
  updated_at = now();

-- Create profiles for demo users
INSERT INTO public.profiles (id, email, first_name, last_name, status, is_demo)
VALUES 
  ('aaaaaaaa-0001-0001-0001-000000000001', 'guest@demo.com', 'Demo', 'Guest', 'active', true),
  ('aaaaaaaa-0002-0002-0002-000000000002', 'host@demo.com', 'Demo', 'Host', 'active', true)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  is_demo = true;

-- Assign roles
INSERT INTO public.user_roles (user_id, role)
VALUES 
  ('aaaaaaaa-0001-0001-0001-000000000001', 'guest'),
  ('aaaaaaaa-0002-0002-0002-000000000002', 'host')
ON CONFLICT (user_id, role) DO NOTHING;

-- Create identity records required for password login
INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  'aaaaaaaa-0001-0001-0001-000000000001',
  'aaaaaaaa-0001-0001-0001-000000000001',
  'guest@demo.com',
  jsonb_build_object('sub', 'aaaaaaaa-0001-0001-0001-000000000001', 'email', 'guest@demo.com'),
  'email',
  now(),
  now(),
  now()
) ON CONFLICT (provider_id, provider) DO NOTHING;

INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  'aaaaaaaa-0002-0002-0002-000000000002',
  'aaaaaaaa-0002-0002-0002-000000000002',
  'host@demo.com',
  jsonb_build_object('sub', 'aaaaaaaa-0002-0002-0002-000000000002', 'email', 'host@demo.com'),
  'email',
  now(),
  now(),
  now()
) ON CONFLICT (provider_id, provider) DO NOTHING;
