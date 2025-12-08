const NodeMediaServer = require('node-media-server');
const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const { Pool } = require('pg');
const redis = require('redis');
require('dotenv').config();

// Environment configuration
const PORT = Number(process.env.PORT) || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// PostgreSQL Connection Setup for Cloud SQL
// In Cloud Run, the instance connection is via Unix socket
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

// Test database connection
pool.on('connect', () => {
  console.log('[db] Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('[db] PostgreSQL connection error:', err);
});

// Redis Client Setup (optional - for session management)
let redisClient = null;
if (process.env.REDIS_HOST) {
  redisClient = redis.createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
    },
  });

  redisClient.on('connect', () => {
    console.log('[redis] Connected to Redis');
  });

  redisClient.on('error', (err) => {
    console.error('[redis] Redis connection error:', err);
  });

  redisClient.connect().catch(console.error);
}

// Express API Server
const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'streamhub-backend',
    timestamp: new Date().toISOString(),
    database: pool.totalCount > 0 ? 'connected' : 'disconnected',
  });
});

// Database test endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    res.json({
      success: true,
      message: 'Database connection successful',
      time: result.rows[0].current_time
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.stack
    });
  }
});

// Database initialization endpoint (one-time setup)
app.post('/api/init-database', async (req, res) => {
  try {
    console.log('🔄 Initializing database schema...');

    const schema = `
      -- StreamHub Pro Database Initialization
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

    await pool.query(schema);

    // Verify tables were created
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('✅ Database schema initialized successfully!');
    console.log('📊 Tables created:', result.rows.map(r => r.table_name).join(', '));

    res.json({
      success: true,
      message: 'Database schema initialized successfully',
      tables: result.rows.map(r => r.table_name),
    });
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize database',
      details: error.message,
    });
  }
});

// API Routes

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, username, created_at FROM users ORDER BY created_at DESC');
    res.json({ users: result.rows });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create user
app.post('/api/users', async (req, res) => {
  const { email, username } = req.body;

  if (!email || !username) {
    return res.status(400).json({ error: 'Email and username are required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO users (email, username) VALUES ($1, $2) RETURNING id, email, username, created_at',
      [email, username]
    );
    res.status(201).json({ user: result.rows[0] });
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.code === '23505') { // Unique violation
      res.status(409).json({ error: 'Email or username already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
});

// Get destinations for a user
app.get('/api/users/:userId/destinations', async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM stream_destinations WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json({ destinations: result.rows });
  } catch (error) {
    console.error('Error fetching destinations:', error);
    res.status(500).json({ error: 'Failed to fetch destinations' });
  }
});

// Create destination
app.post('/api/users/:userId/destinations', async (req, res) => {
  const { userId } = req.params;
  const { platform, name, stream_key, stream_url } = req.body;

  if (!platform || !name || !stream_key || !stream_url) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO stream_destinations (user_id, platform, name, stream_key, stream_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, platform, name, stream_key, stream_url]
    );
    res.status(201).json({ destination: result.rows[0] });
  } catch (error) {
    console.error('Error creating destination:', error);
    res.status(500).json({ error: 'Failed to create destination' });
  }
});

// Update destination status
app.patch('/api/destinations/:id', async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  try {
    const result = await pool.query(
      'UPDATE stream_destinations SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Destination not found' });
    }

    res.json({ destination: result.rows[0] });
  } catch (error) {
    console.error('Error updating destination:', error);
    res.status(500).json({ error: 'Failed to update destination' });
  }
});

// Delete destination
app.delete('/api/destinations/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM stream_destinations WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Destination not found' });
    }

    res.json({ message: 'Destination deleted successfully' });
  } catch (error) {
    console.error('Error deleting destination:', error);
    res.status(500).json({ error: 'Failed to delete destination' });
  }
});

// Get stream sessions
app.get('/api/users/:userId/sessions', async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM stream_sessions WHERE user_id = $1 ORDER BY started_at DESC LIMIT 50',
      [userId]
    );
    res.json({ sessions: result.rows });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Create stream session
app.post('/api/sessions', async (req, res) => {
  const { user_id, title, description, metadata } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO stream_sessions (user_id, title, description, metadata) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id, title, description, metadata || {}]
    );
    res.status(201).json({ session: result.rows[0] });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// End stream session
app.patch('/api/sessions/:id/end', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE stream_sessions
       SET ended_at = CURRENT_TIMESTAMP,
           duration_seconds = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at))::INTEGER,
           status = 'ended'
       WHERE id = $1 AND ended_at IS NULL
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found or already ended' });
    }

    res.json({ session: result.rows[0] });
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

// Node-Media-Server Configuration
const nmsConfig = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60,
  },
  http: {
    port: 8000,
    allow_origin: '*',
    mediaroot: './media',
  },
  trans: {
    ffmpeg: '/usr/bin/ffmpeg',
    tasks: [
      {
        app: 'live',
        hls: true,
        hlsFlags: '[hls_time=2:hls_list_size=3:hls_flags=delete_segments]',
      },
    ],
  },
};

// Only start RTMP server in non-Cloud Run environments or if explicitly enabled
// Cloud Run doesn't support multiple ports easily, so we might need a separate service for RTMP
const ENABLE_RTMP = process.env.ENABLE_RTMP === 'true';

if (ENABLE_RTMP) {
  const nms = new NodeMediaServer(nmsConfig);
  nms.run();
  console.log('[rtmp] RTMP server started on port 1935');
  console.log('[rtmp] HLS server started on port 8000');
} else {
  console.log('[rtmp] RTMP server disabled (set ENABLE_RTMP=true to enable)');
}

// WebSocket Server for Real-time Signaling
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws, req) => {
  console.log('[ws] Client connected via WebSocket');

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      console.log('[ws] Received:', data.type);

      // Handle different message types
      switch (data.type) {
        case 'stream_start':
          // Handle stream start event
          ws.send(JSON.stringify({ type: 'stream_started', status: 'success' }));
          break;

        case 'stream_stop':
          // Handle stream stop event
          ws.send(JSON.stringify({ type: 'stream_stopped', status: 'success' }));
          break;

        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  });

  ws.on('close', () => {
    console.log('[ws] Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Start Express Server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('[server] StreamHub Backend Server Started');
  console.log(`[server] HTTP API running on port ${PORT}`);
  console.log(`[server] Environment: ${NODE_ENV}`);
  console.log(`[server] Database: ${isCloudSQL ? 'Cloud SQL' : 'Local PostgreSQL'}`);
});

// Integrate WebSocket with HTTP server
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('HTTP server closed');
  });

  await pool.end();
  console.log('Database pool closed');

  if (redisClient) {
    await redisClient.quit();
    console.log('Redis connection closed');
  }

  process.exit(0);
});

module.exports = { app, pool };
