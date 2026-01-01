-- Pokemon data from PokeAPI
CREATE TABLE IF NOT EXISTS pokemon (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  sprite_front TEXT,
  sprite_back TEXT,
  height INTEGER,
  weight INTEGER,
  base_experience INTEGER,
  is_baby BOOLEAN DEFAULT 0,
  is_starter BOOLEAN DEFAULT 0,
  pokeapi_data TEXT
);

-- Pokemon types
CREATE TABLE IF NOT EXISTS pokemon_types (
  pokemon_id INTEGER NOT NULL,
  type_name TEXT NOT NULL,
  slot INTEGER NOT NULL,
  PRIMARY KEY (pokemon_id, slot),
  FOREIGN KEY (pokemon_id) REFERENCES pokemon(id)
);

-- Pokemon stats
CREATE TABLE IF NOT EXISTS pokemon_stats (
  pokemon_id INTEGER NOT NULL,
  stat_name TEXT NOT NULL,
  base_stat INTEGER NOT NULL,
  PRIMARY KEY (pokemon_id, stat_name),
  FOREIGN KEY (pokemon_id) REFERENCES pokemon(id)
);

-- Evolution chains
CREATE TABLE IF NOT EXISTS evolutions (
  pokemon_id INTEGER NOT NULL,
  evolves_to_id INTEGER,
  min_level INTEGER,
  trigger TEXT,
  PRIMARY KEY (pokemon_id, evolves_to_id),
  FOREIGN KEY (pokemon_id) REFERENCES pokemon(id),
  FOREIGN KEY (evolves_to_id) REFERENCES pokemon(id)
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  starter_pokemon_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME,
  FOREIGN KEY (starter_pokemon_id) REFERENCES pokemon(id)
);

-- User positions
CREATE TABLE IF NOT EXISTS user_positions (
  user_id INTEGER PRIMARY KEY,
  x REAL NOT NULL DEFAULT 0,
  y REAL NOT NULL DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- User's Pokemon collection
CREATE TABLE IF NOT EXISTS user_pokemon (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  pokemon_id INTEGER NOT NULL,
  nickname TEXT,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 0,
  caught_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (pokemon_id) REFERENCES pokemon(id)
);

-- Interactions/chat history
CREATE TABLE IF NOT EXISTS interactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_user_id INTEGER NOT NULL,
  to_user_id INTEGER NOT NULL,
  interaction_type TEXT NOT NULL,
  message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (from_user_id) REFERENCES users(id),
  FOREIGN KEY (to_user_id) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_user_positions_coords ON user_positions(x, y);
CREATE INDEX IF NOT EXISTS idx_pokemon_baby ON pokemon(is_baby);
CREATE INDEX IF NOT EXISTS idx_pokemon_starter ON pokemon(is_starter);
CREATE INDEX IF NOT EXISTS idx_interactions_users ON interactions(from_user_id, to_user_id);
