CREATE TABLE user_settings (
    user_id INTEGER PRIMARY KEY,
    page_animation_enabled BOOLEAN NOT NULL DEFAULT 1,
    language TEXT NOT NULL DEFAULT 'pt-BR',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
