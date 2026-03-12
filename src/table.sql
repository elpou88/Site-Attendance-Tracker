CREATE TABLE IF NOT EXISTS users (
 id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
 username text NOT NULL UNIQUE,
 password text NOT NULL,
 full_name text NOT NULL,
 role text NOT NULL DEFAULT 'worker',
 contract_type text,
 active boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS attendance (
 id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id varchar NOT NULL,
 date date NOT NULL,
 sign_in_time timestamp NOT NULL,
 sign_out_time timestamp,
 sign_in_lat double precision,
 sign_in_lng double precision,
 sign_out_lat double precision,
 sign_out_lng double precision
);
CREATE TABLE IF NOT EXISTS feed_entries (
 id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id varchar NOT NULL,
 note text,
 image_url text,
 created_at timestamp NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS chat_messages (
 id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id varchar NOT NULL,
 message text NOT NULL,
 created_at timestamp NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS session (
 sid varchar PRIMARY KEY,
 sess json NOT NULL,
 expire timestamp NOT NULL
);
