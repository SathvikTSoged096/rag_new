CREATE TABLE users (
 id SERIAL PRIMARY KEY,
 name TEXT,
 email TEXT UNIQUE,
 password TEXT,
 role TEXT
);

CREATE TABLE subjects (
 id SERIAL PRIMARY KEY,
 name TEXT,
 instructor_id INTEGER
);

CREATE TABLE chats (
 id SERIAL PRIMARY KEY,
 user_id INTEGER,
 question TEXT,
 answer TEXT,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);