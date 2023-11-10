-- Migration number: 0000 	 2023-11-10T06:52:05.640Z

CREATE TABLE user(
    id TEXT PRIMARY KEY,
    firebase_uid TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime'))
);

CREATE TRIGGER user_updated_at AFTER UPDATE ON user
BEGIN
    UPDATE user SET updated_at = DATETIME('now', 'localtime') WHERE rowid == NEW.rowid;
END;

CREATE TABLE format (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    tags TEXT,
    block TEXT NOT NULL,
    download INTEGER NOT NULL DEFAULT 0,
    user_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES user(id)
);

CREATE TRIGGER format_updated_at AFTER UPDATE ON format
BEGIN
    UPDATE format SET updated_at = DATETIME('now', 'localtime') WHERE rowid == NEW.rowid;
END;

CREATE TABLE format_url (
    format_id TEXT,
    order_no INT,
    url TEXT NOT NULL,
    FOREIGN KEY (format_id) REFERENCES format(id),
    PRIMARY KEY(format_id, order_no)
);

CREATE TABLE format_thumbnail (
    format_id TEXT,
    order_no INT,
    src TEXT NOT NULL,
    FOREIGN KEY (format_id) REFERENCES format(id),
    PRIMARY KEY(format_id, order_no)
);

CREATE TABLE comment (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    format_id TEXT NOT NULL,
    star INTEGER,
    comment TEXT,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (format_id) REFERENCES format(id)
);

CREATE TRIGGER comment_updated_at AFTER UPDATE ON comment
BEGIN
    UPDATE comment SET updated_at = DATETIME('now', 'localtime') WHERE rowid == NEW.rowid;
END;
