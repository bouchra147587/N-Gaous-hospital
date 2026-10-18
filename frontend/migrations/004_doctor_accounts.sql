-- Doctor accounts. (The API also applies this automatically at startup.)
-- users.role is stored as text, so the new 'doctor' role needs no change.
ALTER TABLE users ADD COLUMN doctor_id INTEGER NULL;
-- Optional (PostgreSQL / MySQL InnoDB):
-- ALTER TABLE users ADD CONSTRAINT fk_users_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL;
