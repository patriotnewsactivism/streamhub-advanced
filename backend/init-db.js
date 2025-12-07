const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL Connection Setup for Cloud SQL
const isCloudSQL = process.env.INSTANCE_CONNECTION_NAME;

const pgConfig = isCloudSQL ? {
  user: process.env.DB_USER || 'streamhub',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'streamhub',
  host: `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`,
} : {
  connectionString: process.env.DATABASE_URL || 'postgresql://streamhub:streamhub@localhost:5432/streamhub',
};

const pool = new Pool(pgConfig);

const schema = `
-- StreamHub Pro Database Initialization
-- PostgreSQL Schema for User Data and Stream Configurations

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stream destinations table
CREATE TABLE IF NOT EXISTS stream_destinations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    stream_key VARCHAR(500) NOT NULL,
    stream_url VARCHAR(500) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stream sessions table
CREATE TABLE IF NOT EXISTS stream_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500),
    description TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    duration_seconds INTEGER,
    status VARCHAR(50) DEFAULT 'active',
    metadata JSONB
);

-- Media assets table
CREATE TABLE IF NOT EXISTS media_assets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    asset_type VARCHAR(50) NOT NULL,
    filename VARCHAR(500) NOT NULL,
    storage_url VARCHAR(1000) NOT NULL,
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stream analytics table
CREATE TABLE IF NOT EXISTS stream_analytics (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES stream_sessions(id) ON DELETE CASCADE,
    destination_id INTEGER REFERENCES stream_destinations(id) ON DELETE SET NULL,
    viewer_count INTEGER DEFAULT 0,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metrics JSONB
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_stream_destinations_user ON stream_destinations(user_id);
CREATE INDEX IF NOT EXISTS idx_stream_sessions_user ON stream_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_user ON media_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_stream_analytics_session ON stream_analytics(session_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stream_destinations_updated_at ON stream_destinations;
CREATE TRIGGER update_stream_destinations_updated_at BEFORE UPDATE ON stream_destinations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO users (email, username) VALUES
    ('demo@streamhub.com', 'demo_user')
ON CONFLICT (email) DO NOTHING;
`;

async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database schema...');

    await pool.query(schema);

    console.log('✅ Database schema initialized successfully!');

    // Verify tables were created
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('📊 Tables created:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    await pool.end();
    process.exit(1);
  }
}

initializeDatabase();
