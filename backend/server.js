const NodeMediaServer = require('node-media-server');
const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const { Pool } = require('pg');
const redis = require('redis');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import custom modules
const streamManager = require('./streamManager');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  hashPassword,
  comparePassword,
  authMiddleware,
  optionalAuthMiddleware
} = require('./auth');

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

// Database connection retry logic
const connectWithRetry = async (retries = 5, delay = 3000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      console.log('[db] PostgreSQL connection verified successfully');
      client.release();
      return true;
    } catch (err) {
      console.log(`[db] Connection attempt ${i + 1}/${retries} failed, retrying in ${delay}ms...`);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  console.error('[db] Failed to connect to PostgreSQL after all retries');
  return false;
};

// Connect to database on startup
connectWithRetry();

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

// CORS configuration - restrict to specific origins in production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? (process.env.FRONTEND_URL || 'http://localhost:8080')
    : ['http://localhost:5173', 'http://localhost:8080', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(express.json());

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
});

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
      -- Users table with full auth support
      -- Plan tiers: always_free, free_trial, creator ($14.99), pro ($29.99), business ($59.99), admin
      CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          username VARCHAR(100) UNIQUE NOT NULL,
          password_hash VARCHAR(255),
          plan VARCHAR(50) DEFAULT 'always_free',
          cloud_hours_used INTEGER DEFAULT 0,
          cloud_hours_limit INTEGER DEFAULT 5,
          trial_end_date TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Add columns to existing users table if they don't exist
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_hash') THEN
          ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'plan') THEN
          ALTER TABLE users ADD COLUMN plan VARCHAR(50) DEFAULT 'always_free';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'cloud_hours_used') THEN
          ALTER TABLE users ADD COLUMN cloud_hours_used INTEGER DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'cloud_hours_limit') THEN
          ALTER TABLE users ADD COLUMN cloud_hours_limit INTEGER DEFAULT 5;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'trial_end_date') THEN
          ALTER TABLE users ADD COLUMN trial_end_date TIMESTAMP;
        END IF;
      END $$;

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

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================

// Register new user
app.post('/api/auth/register',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('username').isLength({ min: 3, max: 30 }).trim(),
    body('password').isLength({ min: 8 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, username, password } = req.body;

    try {
      // Hash password
      const passwordHash = await hashPassword(password);

      // Insert user with hashed password and default plan (free_trial gives full access for 7 days)
      const result = await pool.query(
        `INSERT INTO users (email, username, password_hash, plan, cloud_hours_used, cloud_hours_limit, trial_end_date)
         VALUES ($1, $2, $3, 'free_trial', 0, 5, CURRENT_TIMESTAMP + INTERVAL '7 days')
         RETURNING id, email, username, plan, cloud_hours_used, cloud_hours_limit, trial_end_date, created_at`,
        [email, username, passwordHash]
      );

      const user = result.rows[0];

      // Generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // Store refresh token in Redis (optional, for revocation)
      if (redisClient) {
        await redisClient.set(`refresh_token:${user.id}`, refreshToken, {
          EX: 30 * 24 * 60 * 60 // 30 days
        });
      }

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          plan: user.plan,
          cloudHoursUsed: user.cloud_hours_used,
          cloudHoursLimit: user.cloud_hours_limit,
          trialEndDate: user.trial_end_date
        },
        accessToken,
        refreshToken
      });
    } catch (error) {
      console.error('Error creating user:', error);
      if (error.code === '23505') { // Unique violation
        res.status(409).json({ error: 'Email or username already exists' });
      } else {
        res.status(500).json({ error: 'Failed to create user' });
      }
    }
  }
);

// Login
app.post('/api/auth/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const result = await pool.query(
        'SELECT id, email, username, password_hash, plan, cloud_hours_used, cloud_hours_limit, trial_end_date, created_at FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const user = result.rows[0];

      // Check if user has password set (for legacy users)
      if (!user.password_hash) {
        return res.status(401).json({ error: 'Account requires password setup. Please register again.' });
      }

      // Verify password
      const isValid = await comparePassword(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // Store refresh token in Redis
      if (redisClient) {
        await redisClient.set(`refresh_token:${user.id}`, refreshToken, {
          EX: 30 * 24 * 60 * 60 // 30 days
        });
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          plan: user.plan || 'always_free',
          cloudHoursUsed: user.cloud_hours_used || 0,
          cloudHoursLimit: user.cloud_hours_limit || 5,
          trialEndDate: user.trial_end_date
        },
        accessToken,
        refreshToken
      });
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

// Refresh token
app.post('/api/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' });
  }

  try {
    const decoded = verifyToken(refreshToken);

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Verify token exists in Redis (if using Redis)
    if (redisClient) {
      const storedToken = await redisClient.get(`refresh_token:${decoded.id}`);
      if (storedToken !== refreshToken) {
        return res.status(401).json({ error: 'Refresh token revoked or invalid' });
      }
    }

    // Get user data
    const result = await pool.query(
      'SELECT id, email, username FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // Generate new access token
    const newAccessToken = generateAccessToken(user);

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

// Get current user profile
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, username, plan, cloud_hours_used, cloud_hours_limit, trial_end_date, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        plan: user.plan || 'always_free',
        cloudHoursUsed: user.cloud_hours_used || 0,
        cloudHoursLimit: user.cloud_hours_limit || 5,
        trialEndDate: user.trial_end_date
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Logout (revoke refresh token)
app.post('/api/auth/logout', authMiddleware, async (req, res) => {
  try {
    if (redisClient) {
      await redisClient.del(`refresh_token:${req.user.id}`);
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// ============================================================================
// USER ROUTES
// ============================================================================

// Get all users (protected)
app.get('/api/users', authMiddleware, async (req, res) => {
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

// Get destinations for a user (protected + authorization check)
app.get('/api/users/:userId/destinations', authMiddleware, async (req, res) => {
  const { userId } = req.params;

  // Authorization check - users can only access their own data
  if (req.user.id.toString() !== userId) {
    return res.status(403).json({ error: 'Access denied' });
  }

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

// Create destination (protected + authorization check)
app.post('/api/users/:userId/destinations', authMiddleware, async (req, res) => {
  const { userId } = req.params;
  const { platform, name, stream_key, stream_url } = req.body;

  // Authorization check
  if (req.user.id.toString() !== userId) {
    return res.status(403).json({ error: 'Access denied' });
  }

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

// Update destination status (protected + ownership check)
app.patch('/api/destinations/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  try {
    // First verify ownership
    const ownerCheck = await pool.query(
      'SELECT user_id FROM stream_destinations WHERE id = $1',
      [id]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Destination not found' });
    }

    if (ownerCheck.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      'UPDATE stream_destinations SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [is_active, id]
    );

    res.json({ destination: result.rows[0] });
  } catch (error) {
    console.error('Error updating destination:', error);
    res.status(500).json({ error: 'Failed to update destination' });
  }
});

// Delete destination (protected + ownership check)
app.delete('/api/destinations/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    // First verify ownership
    const ownerCheck = await pool.query(
      'SELECT user_id FROM stream_destinations WHERE id = $1',
      [id]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Destination not found' });
    }

    if (ownerCheck.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await pool.query('DELETE FROM stream_destinations WHERE id = $1', [id]);

    res.json({ message: 'Destination deleted successfully' });
  } catch (error) {
    console.error('Error deleting destination:', error);
    res.status(500).json({ error: 'Failed to delete destination' });
  }
});

// Get stream sessions (protected + authorization)
app.get('/api/users/:userId/sessions', authMiddleware, async (req, res) => {
  const { userId } = req.params;

  // Authorization check
  if (req.user.id.toString() !== userId) {
    return res.status(403).json({ error: 'Access denied' });
  }

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

// Create stream session (protected)
app.post('/api/sessions', authMiddleware, async (req, res) => {
  const { title, description, metadata } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO stream_sessions (user_id, title, description, metadata) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, title, description, metadata || {}]
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

// ============================================================================
// STREAMING ROUTES
// ============================================================================

// Start stream session
app.post('/api/stream/start', authMiddleware, async (req, res) => {
  const { destinations, title, description } = req.body;

  if (!destinations || !Array.isArray(destinations) || destinations.length === 0) {
    return res.status(400).json({ error: 'At least one destination is required' });
  }

  try {
    // Check if user already has an active stream
    if (streamManager.hasActiveStream(req.user.id)) {
      return res.status(409).json({ error: 'User already has an active stream' });
    }

    // Create stream session in database
    const sessionResult = await pool.query(
      `INSERT INTO stream_sessions (user_id, title, description, status)
       VALUES ($1, $2, $3, 'active')
       RETURNING id, started_at`,
      [req.user.id, title || 'Untitled Stream', description || '']
    );

    const session = sessionResult.rows[0];

    // Start stream with StreamManager
    const streamInfo = streamManager.startStream(req.user.id, destinations);

    res.json({
      success: true,
      sessionId: streamInfo.sessionId,
      dbSessionId: session.id,
      destinations: streamInfo.destinations,
      startTime: session.started_at
    });
  } catch (error) {
    console.error('Error starting stream:', error);
    res.status(500).json({ error: 'Failed to start stream', details: error.message });
  }
});

// Stop stream session
app.post('/api/stream/stop', authMiddleware, async (req, res) => {
  try {
    if (!streamManager.hasActiveStream(req.user.id)) {
      return res.status(404).json({ error: 'No active stream found' });
    }

    // Stop stream
    const summary = streamManager.stopStream(req.user.id);

    // Update session in database
    await pool.query(
      `UPDATE stream_sessions
       SET ended_at = CURRENT_TIMESTAMP,
           duration_seconds = $1,
           status = 'ended'
       WHERE user_id = $2 AND status = 'active'`,
      [summary.duration, req.user.id]
    );

    res.json({
      success: true,
      duration: summary.duration,
      destinations: summary.destinations
    });
  } catch (error) {
    console.error('Error stopping stream:', error);
    res.status(500).json({ error: 'Failed to stop stream', details: error.message });
  }
});

// Get stream status
app.get('/api/stream/status', authMiddleware, async (req, res) => {
  try {
    const status = streamManager.getStreamStatus(req.user.id);

    if (!status) {
      return res.json({ active: false });
    }

    res.json({
      active: true,
      ...status
    });
  } catch (error) {
    console.error('Error getting stream status:', error);
    res.status(500).json({ error: 'Failed to get stream status' });
  }
});

// Get stream history
app.get('/api/stream/history', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, description, started_at, ended_at, duration_seconds, status
       FROM stream_sessions
       WHERE user_id = $1
       ORDER BY started_at DESC
       LIMIT 50`,
      [req.user.id]
    );

    res.json({ sessions: result.rows });
  } catch (error) {
    console.error('Error fetching stream history:', error);
    res.status(500).json({ error: 'Failed to fetch stream history' });
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

// WebSocket Server for Real-time Signaling and Stream Data
const wss = new WebSocket.Server({ noServer: true });

// Track WebSocket to user mapping
const wsUserMap = new Map();

wss.on('connection', (ws, req) => {
  console.log('[ws] Client connected via WebSocket');
  let userId = null;
  let isAuthenticated = false;

  ws.on('message', async (message) => {
    try {
      // Check if message is binary (stream data) or text (control message)
      if (message instanceof Buffer) {
        // Binary data - stream chunk
        if (!isAuthenticated || !userId) {
          console.warn('[ws] Received stream data from unauthenticated client');
          return;
        }

        if (!streamManager.hasActiveStream(userId)) {
          console.warn('[ws] Received stream data but no active stream for user', userId);
          return;
        }

        try {
          streamManager.writeChunk(userId, message);
        } catch (error) {
          console.error('[ws] Error writing stream chunk:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Failed to process stream data'
          }));
        }
        return;
      }

      // Text message - parse as JSON
      const data = JSON.parse(message.toString());
      console.log('[ws] Received control message:', data.type);

      // Handle different message types
      switch (data.type) {
        case 'authenticate':
          // Authenticate WebSocket connection
          if (!data.token) {
            ws.send(JSON.stringify({ type: 'error', message: 'Token required' }));
            return;
          }

          try {
            const decoded = verifyToken(data.token);
            userId = decoded.id;
            isAuthenticated = true;
            wsUserMap.set(ws, userId);

            ws.send(JSON.stringify({
              type: 'authenticated',
              userId: userId
            }));

            console.log(`[ws] Client authenticated as user ${userId}`);
          } catch (error) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Invalid or expired token'
            }));
          }
          break;

        case 'stream_start':
          if (!isAuthenticated) {
            ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
            return;
          }

          ws.send(JSON.stringify({
            type: 'stream_started',
            status: 'success',
            message: 'Ready to receive stream data'
          }));
          break;

        case 'stream_stop':
          if (!isAuthenticated) {
            ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
            return;
          }

          ws.send(JSON.stringify({
            type: 'stream_stopped',
            status: 'success'
          }));
          break;

        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;

        default:
          console.log('[ws] Unknown message type:', data.type);
          ws.send(JSON.stringify({
            type: 'error',
            message: `Unknown message type: ${data.type}`
          }));
      }
    } catch (error) {
      console.error('[ws] Error processing WebSocket message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process message'
      }));
    }
  });

  ws.on('close', () => {
    console.log('[ws] Client disconnected');

    // Clean up user mapping
    if (userId && wsUserMap.has(ws)) {
      wsUserMap.delete(ws);
    }

    // Stop stream if still active
    if (userId && streamManager.hasActiveStream(userId)) {
      console.log(`[ws] Stopping stream for disconnected user ${userId}`);
      try {
        streamManager.stopStream(userId);
      } catch (error) {
        console.error('[ws] Error stopping stream on disconnect:', error);
      }
    }
  });

  ws.on('error', (error) => {
    console.error('[ws] WebSocket error:', error);
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
