import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import Joi from 'joi'

const app = express()
const PORT = process.env.PORT || 5000

// Environment variables (since .env might be blocked)
const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB_HOST: process.env.DB_HOST || 'mysql',
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || 'driving_test_password',
  DB_NAME: process.env.DB_NAME || 'driving_test',
  JWT_SECRET: process.env.JWT_SECRET || 'driving_test_jwt_secret_key_2024',
  CORS_ORIGIN: process.env.CORS_ORIGIN || ['http://localhost:3020', 'http://localhost:5173']
}

// Database connection
let db
const connectDB = async () => {
  try {
    db = await mysql.createConnection({
      host: config.DB_HOST,
      user: config.DB_USER,
      password: config.DB_PASSWORD,
      database: config.DB_NAME,
      port: 3306,
      charset: 'utf8mb4',
      timezone: '+00:00'
    })
    console.log('✅ MySQL Connected Successfully')
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    // Retry connection after 5 seconds
    setTimeout(connectDB, 5000)
  }
}

// Initialize database connection
connectDB()

// Middleware
app.use(helmet())
app.use(compression())
app.use(cors({
  origin: ['http://localhost:3020', 'http://localhost:5173'],
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Set charset for all responses
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  next()
})

// Rate limiting (more generous for development)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // increased limit for development
  message: {
    success: false,
    error: { message: 'Too many requests, please try again later' }
  }
})
// Only apply rate limiting in production
if (config.NODE_ENV === 'production') {
  app.use('/api/', limiter)
}

// Auth middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    
    console.log('🔍 Auth middleware - Header:', authHeader)
    console.log('🔍 Auth middleware - Token:', token ? 'exists' : 'missing')

    if (!token) {
      console.log('❌ No token provided')
      return res.status(401).json({
        success: false,
        error: { code: 'NO_TOKEN', message: 'Access token required' }
      })
    }

    console.log('🔍 JWT Secret:', config.JWT_SECRET ? 'exists' : 'missing')
    const decoded = jwt.verify(token, config.JWT_SECRET)
    console.log('✅ Token decoded:', decoded)
    
    // Get user from database
    const [users] = await db.execute(
      'SELECT id, username, email, full_name, phone, is_active FROM users WHERE id = ? AND is_active = TRUE',
      [decoded.userId]
    )

    if (users.length === 0) {
      return res.status(403).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found or inactive' }
      })
    }

    req.user = users[0]
    next()
  } catch (error) {
    console.error('Auth error:', error)
    return res.status(403).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid access token' }
    })
  }
}

// Validation schemas
const loginSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().min(6).required()
})

const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  full_name: Joi.string().min(2).max(100).required(),
  phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).optional()
})

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Driving Test API is running',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV
  })
})

// Create admin user (development only)
app.post('/api/create-admin', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({
        success: false,
        error: { code: 'DB_ERROR', message: 'Database not connected' }
      })
    }

    // Delete existing admin
    await db.execute('DELETE FROM users WHERE username = ?', ['admin'])

    // Create new admin with simple password
    const hashedPassword = await bcrypt.hash('123456', 12)
    
    const [result] = await db.execute(
      'INSERT INTO users (username, email, password_hash, full_name, phone) VALUES (?, ?, ?, ?, ?)',
      ['admin', 'admin@drivingtest.com', hashedPassword, 'Quản trị viên', '0123456789']
    )

    res.json({
      success: true,
      message: 'Admin user created successfully',
      data: { 
        userId: result.insertId,
        username: 'admin',
        password: '123456'
      }
    })

  } catch (error) {
    console.error('Create admin error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create admin' }
    })
  }
})

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    // Check if database is connected
    if (!db) {
      return res.status(500).json({
        success: false,
        error: { code: 'DB_ERROR', message: 'Database not connected' }
      })
    }

    // Validate input
    const { error, value } = registerSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.details[0].message }
      })
    }

    const { username, email, password, full_name, phone } = value

    // Check if user exists
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    )

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'USER_EXISTS', message: 'Username or email already exists' }
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const [result] = await db.execute(
      'INSERT INTO users (username, email, password_hash, full_name, phone) VALUES (?, ?, ?, ?, ?)',
      [username, email, hashedPassword, full_name, phone || null]
    )

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { userId: result.insertId }
    })

  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Registration failed' }
    })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    // Check if database is connected
    if (!db) {
      return res.status(500).json({
        success: false,
        error: { code: 'DB_ERROR', message: 'Database not connected' }
      })
    }

    // Validate input
    const { error, value } = loginSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.details[0].message }
      })
    }

    const { username, password } = value

    // Get user
    const [users] = await db.execute(
      'SELECT id, username, email, password_hash, full_name, phone, is_active FROM users WHERE username = ?',
      [username]
    )

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid username or password' }
      })
    }

    const user = users[0]

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        error: { code: 'ACCOUNT_DISABLED', message: 'Account is disabled' }
      })
    }

    // Check password
    console.log('Checking password for user:', user.username)
    console.log('Password hash from DB:', user.password_hash)
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    console.log('Password valid:', isValidPassword)
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid username or password' }
      })
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      config.JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Remove password from response
    delete user.password_hash

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Login failed' }
    })
  }
})

app.get('/api/auth/profile', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: req.user
  })
})

// Test Routes
app.get('/api/tests', authenticateToken, async (req, res) => {
  try {
    // Check if database is connected
    if (!db) {
      return res.status(500).json({
        success: false,
        error: { code: 'DB_ERROR', message: 'Database not connected' }
      })
    }

    const [tests] = await db.execute(
      'SELECT * FROM lessons WHERE is_active = TRUE ORDER BY lesson_number'
    )

    res.json({
      success: true,
      data: tests
    })
  } catch (error) {
    console.error('Get tests error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to load tests' }
    })
  }
})

// Session Routes
app.post('/api/sessions', authenticateToken, async (req, res) => {
  try {
    const { student_name, student_id } = req.body

    if (!student_name) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Student name is required' }
      })
    }

    const [result] = await db.execute(
      'INSERT INTO sessions (instructor_id, student_name, student_id) VALUES (?, ?, ?)',
      [req.user.id, student_name, student_id || null]
    )

    const [session] = await db.execute(
      'SELECT * FROM sessions WHERE id = ?',
      [result.insertId]
    )

    res.status(201).json({
      success: true,
      message: 'Test session created successfully',
      data: session[0]
    })

  } catch (error) {
    console.error('Create session error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create session' }
    })
  }
})

app.get('/api/sessions', authenticateToken, async (req, res) => {
  try {
    // Check if database is connected
    if (!db) {
      return res.status(500).json({
        success: false,
        error: { code: 'DB_ERROR', message: 'Database not connected' }
      })
    }

    const [sessions] = await db.execute(
      'SELECT * FROM sessions WHERE instructor_id = ? ORDER BY started_at DESC LIMIT 50',
      [req.user.id]
    )

    res.json({
      success: true,
      data: sessions
    })
  } catch (error) {
    console.error('Get sessions error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to load sessions' }
    })
  }
})

app.put('/api/sessions/:id', authenticateToken, async (req, res) => {
  try {
    const sessionId = req.params.id
    const { status, test_results, total_score, notes } = req.body
    
    console.log('🔍 PUT /api/sessions/:id - Request:', {
      sessionId,
      userId: req.user.id,
      status,
      test_results_count: test_results?.length || 0,
      total_score,
      notes: notes ? 'has notes' : 'no notes'
    })

    // Verify session belongs to user
    const [sessions] = await db.execute(
      'SELECT id FROM sessions WHERE id = ? AND instructor_id = ?',
      [sessionId, req.user.id]
    )

    if (sessions.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' }
      })
    }

    // Update session
    const updates = []
    const values = []

    if (status) {
      updates.push('status = ?')
      values.push(status)
    }
    if (total_score !== undefined) {
      updates.push('total_score = ?')
      values.push(total_score)
    }
    if (notes) {
      updates.push('notes = ?')
      values.push(notes)
    }
    if (status === 'completed') {
      updates.push('completed_at = NOW()')
    }

    updates.push('updated_at = NOW()')
    values.push(sessionId)

    await db.execute(
      `UPDATE sessions SET ${updates.join(', ')} WHERE id = ?`,
      values
    )

    // Save test results if provided
    if (test_results && Array.isArray(test_results)) {
      // Delete existing results for this session
      await db.execute('DELETE FROM results WHERE session_id = ?', [sessionId])

      // Insert new results
      for (const result of test_results) {
        await db.execute(
          'INSERT INTO results (session_id, lesson_number, lesson_name, errors_detected, points_deducted, is_disqualified) VALUES (?, ?, ?, ?, ?, ?)',
          [
            sessionId,
            result.testNumber,
            result.testName,
            JSON.stringify(result.errorsDetected),
            result.pointsDeducted,
            result.isDisqualified || false
          ]
        )
      }
    }

    res.json({
      success: true,
      message: 'Session updated successfully'
    })

  } catch (error) {
    console.error('❌ Update session error:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      errno: error.errno,
      sql: error.sql
    })
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update session', details: error.message }
    })
  }
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' }
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Endpoint not found' }
  })
})

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📱 Frontend URL: ${config.CORS_ORIGIN}`)
  console.log(`🔧 Environment: ${config.NODE_ENV}`)
})