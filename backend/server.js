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
const PORT = process.env.PORT || 5001

// Environment variables (since .env might be blocked)
const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB_HOST: process.env.DB_HOST || 'mysql',
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || 'driving_test_password',
  DB_NAME: process.env.DB_NAME || 'driving_test',
  JWT_SECRET: process.env.JWT_SECRET || 'driving_test_jwt_secret_key_2024',
  CORS_ORIGIN: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [
    'https://frontend-production-947a.up.railway.app',
    'http://localhost:3020',  // Local development frontend
    'http://localhost:3000',  // Alternative local port
    'http://127.0.0.1:3020',  // Alternative localhost
    'http://127.0.0.1:3000'   // Alternative localhost
  ]
}

// Database connection pool
let db
const createConnectionPool = () => {
  return mysql.createPool({
    host: config.DB_HOST,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    database: config.DB_NAME,
    port: 3306,
    charset: 'utf8mb4',
    timezone: '+00:00',
    // Connection pool settings
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
    // Keep connection alive
    keepAliveInitialDelay: 0,
    enableKeepAlive: true,
    // Handle connection errors
    handleDisconnects: true,
    // Additional stability settings
    queueLimit: 0, // Unlimited queue
    multipleStatements: false, // Security
    dateStrings: false, // Use Date objects
    supportBigNumbers: true,
    bigNumberStrings: false
  })
}

// Initialize database connection pool
db = createConnectionPool()

// Test connection
const testConnection = async () => {
  try {
    const connection = await db.getConnection()
    await connection.ping()
    connection.release()
    console.log('✅ MySQL Pool Connected Successfully')
    return true
  } catch (error) {
    console.error('❌ Database pool connection failed:', error.message)
    return false
  }
}

// Initialize and test connection
testConnection().then(success => {
  if (!success) {
    // Retry every 5 seconds if connection fails
    const retryInterval = setInterval(async () => {
      const connected = await testConnection()
      if (connected) {
        clearInterval(retryInterval)
      }
    }, 5000)
  }
})

// Helper function to execute database queries with auto-reconnect
const executeQuery = async (query, params = []) => {
  let retries = 3
  let lastError = null
  
  while (retries > 0) {
    try {
      // Execute query directly - connection pool handles connection management
      const result = await db.execute(query, params)
      return result
    } catch (error) {
      lastError = error
      console.error(`❌ Database query failed (${4-retries} retries left):`, error.message)
      
      // Check if it's a connection error
      if (error.code === 'PROTOCOL_CONNECTION_LOST' || 
          error.code === 'ECONNRESET' || 
          error.message.includes('closed state') ||
          error.message.includes('Connection lost')) {
        
        console.log('🔄 Attempting to reconnect to database...')
        
        // Recreate connection pool
        try {
          await db.end()
        } catch (endError) {
          console.log('Connection pool already closed')
        }
        
        db = createConnectionPool()
        
        // Wait a bit before retry
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
      retries--
    }
  }
  
  throw new Error(`Database query failed after 3 retries: ${lastError.message}`)
}

// Middleware
app.set('trust proxy', true) // Trust proxy for correct IP detection
app.use(helmet())
app.use(compression())
// CORS configuration - more permissive for local development
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)
    
    // Check if origin is in allowed list
    if (config.CORS_ORIGIN.includes(origin)) {
      return callback(null, true)
    }
    
    // For development, be more permissive
    if (config.NODE_ENV === 'development' && origin.includes('localhost')) {
      return callback(null, true)
    }
    
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  optionsSuccessStatus: 200
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Set charset and CORS headers for all responses
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  
  // Manual CORS headers for local development
  if (config.NODE_ENV === 'development') {
    const origin = req.headers.origin
    if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      res.header('Access-Control-Allow-Origin', origin)
      res.header('Access-Control-Allow-Credentials', 'true')
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With')
    }
    
    console.log('🌐 CORS Debug:', {
      method: req.method,
      origin: req.headers.origin,
      allowedOrigins: config.CORS_ORIGIN,
      isAllowed: config.CORS_ORIGIN.includes(req.headers.origin)
    })
  }
  
  next()
})

// Rate limiting (more generous for development)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // increased limit for development
  message: {
    success: false,
    error: { message: 'Too many requests, please try again later' }
  },
  // Fix trust proxy issue
  trustProxy: true,
  keyGenerator: (req) => {
    // Use forwarded IP if available, otherwise use connection IP
    return req.ip || req.connection.remoteAddress || 'unknown'
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
    
    let decoded
    try {
      decoded = jwt.verify(token, config.JWT_SECRET)
      console.log('✅ Token decoded:', decoded)
    } catch (jwtError) {
      console.log('❌ JWT Error:', jwtError.name, jwtError.message)
      
      if (jwtError.name === 'TokenExpiredError') {
        console.log('⏰ Token expired at:', jwtError.expiredAt)
        return res.status(401).json({
          success: false,
          error: { 
            code: 'TOKEN_EXPIRED', 
            message: 'Token đã hết hạn. Vui lòng đăng nhập lại.',
            expiredAt: jwtError.expiredAt
          }
        })
      } else if (jwtError.name === 'JsonWebTokenError') {
        console.log('🔒 Invalid token format')
        return res.status(401).json({
          success: false,
          error: { 
            code: 'INVALID_TOKEN', 
            message: 'Token không hợp lệ. Vui lòng đăng nhập lại.' 
          }
        })
      } else {
        console.log('❌ Other JWT error:', jwtError.message)
        return res.status(401).json({
          success: false,
          error: { 
            code: 'TOKEN_ERROR', 
            message: 'Lỗi xác thực token. Vui lòng đăng nhập lại.' 
          }
        })
      }
    }
    
    // Get user from database
    const [users] = await executeQuery(
      'SELECT id, username, email, full_name, phone, role, active_token, is_active FROM users WHERE id = ? AND is_active = TRUE',
      [decoded.userId]
    )

    if (users.length === 0) {
      return res.status(403).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found or inactive' }
      })
    }

    const user = users[0]

    // For teachers (role=2), check single device login
    if (user.role === 2 && user.active_token && user.active_token !== token) {
      console.log(`🚫 Single device violation: Teacher ${user.username} token mismatch`)
      return res.status(403).json({
        success: false,
        error: { 
          code: 'DEVICE_LIMIT_EXCEEDED', 
          message: 'Phát hiện tài khoản đăng nhập nhiều thiết bị. Vui lòng liên hệ quản trị viên.',
          details: 'Tài khoản giáo viên chỉ được phép đăng nhập trên 1 thiết bị duy nhất.'
        }
      })
    }

    req.user = user
    next()
  } catch (error) {
    console.error('Auth error:', error)
    return res.status(500).json({
      success: false,
      error: { code: 'AUTH_ERROR', message: 'Lỗi xác thực. Vui lòng thử lại.' }
    })
  }
}

// Role-based authorization middleware
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    const userRole = req.user.role
    
    if (requiredRole === 1 && userRole !== 1) {
      // Only admin can access
      return res.status(403).json({
        success: false,
        error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'Admin access required' }
      })
    }
    
    if (requiredRole === 2 && userRole !== 1 && userRole !== 2) {
      // Admin or teacher can access
      return res.status(403).json({
        success: false,
        error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'Teacher or admin access required' }
      })
    }
    
    next()
  }
}

// Helper functions for role checking
const isAdmin = (req, res, next) => requireRole(1)(req, res, next)
const isTeacher = (req, res, next) => requireRole(2)(req, res, next)

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
  phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).optional(),
  role: Joi.number().integer().valid(1, 2).default(2)
})

// Routes

// Handle preflight requests explicitly
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With')
  res.header('Access-Control-Allow-Credentials', 'true')
  res.sendStatus(200)
})

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
    // Delete existing admin
    await executeQuery('DELETE FROM users WHERE username = ?', ['admin'])

    // Create new admin with simple password
    const hashedPassword = await bcrypt.hash('123456', 12)
    
    const [result] = await executeQuery(
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
    // Database connection is handled by executeQuery helper

    // Validate input
    const { error, value } = registerSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.details[0].message }
      })
    }

    const { username, email, password, full_name, phone, role } = value

    // Check if user exists
    const [existingUsers] = await executeQuery(
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
    const [result] = await executeQuery(
      'INSERT INTO users (username, email, password_hash, full_name, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
      [username, email, hashedPassword, full_name, phone || null, role || 2]
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
    // Database connection is handled by executeQuery helper

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
    const [users] = await executeQuery(
      'SELECT id, username, email, password_hash, full_name, phone, role, active_token, suspicious_activity_count, last_suspicious_attempt, is_flagged, is_active FROM users WHERE username = ?',
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
        error: { code: 'ACCOUNT_DISABLED', message: 'Tài khoản bị vô hiệu hoá. Vui lòng liên hệ quản trị viên.' }
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

    // Get device info - combine IP and User-Agent for better device detection
    const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown'
    const userAgent = req.headers['user-agent'] || ''
    
    // Extract device info from User-Agent (OS + Device type)
    const deviceInfo = userAgent.match(/(Windows|Mac|Linux|iPhone|iPad|Android)/i)?.[0] || 'Unknown'
    const browserInfo = userAgent.match(/(Chrome|Firefox|Safari|Edge)/i)?.[0] || 'Unknown'
    
    // Create device signature: IP + Device + Browser (more flexible for same device)
    const deviceSignature = `${clientIP}-${deviceInfo}-${browserInfo}`
    const deviceFingerprint = Buffer.from(deviceSignature).toString('base64').slice(0, 30)

    // Generate JWT with longer expiration for better UX
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        role: user.role,
        deviceFingerprint: deviceFingerprint
      },
      config.JWT_SECRET,
      { expiresIn: '30d' } // Extended to 30 days for better user experience
    )

    // For teachers (role=2), check single device login BEFORE allowing login
    if (user.role === 2) {
      // Check if user already has an active token (already logged in somewhere)
      if (user.active_token && user.active_token.trim() !== '') {
        try {
          // Verify if the existing token is still valid
          const decodedExisting = jwt.verify(user.active_token, config.JWT_SECRET)
          
          // Check if it's the same device (fuzzy matching for mobile scenarios)
          const existingDeviceInfo = Buffer.from(decodedExisting.deviceFingerprint, 'base64').toString()
          const currentDeviceInfo = Buffer.from(deviceFingerprint, 'base64').toString()
          
          // Extract device and browser info from both signatures
          const existingParts = existingDeviceInfo.split('-')
          const currentParts = currentDeviceInfo.split('-')
          
          // Same device if: Same OS + Same Browser (ignore IP for mobile flexibility)
          const sameOS = existingParts[1] === currentParts[1] // Same device type (Mac, Windows, etc.)
          const sameBrowser = existingParts[2] === currentParts[2] // Same browser
          
          if (decodedExisting.deviceFingerprint === deviceFingerprint || (sameOS && sameBrowser)) {
            console.log(`🔄 Same device login: Allowing teacher ${user.username} (${currentParts[1]}-${currentParts[2]}) from IP: ${clientIP}`)
            // Same device - allow login and update token
          } else {
            // SUSPICIOUS ACTIVITY DETECTED - Log and increment counter
            console.log(`🚫 SUSPICIOUS ACTIVITY: Teacher ${user.username} trying ${currentParts[1]}-${currentParts[2]} from ${clientIP}, but already logged in on ${existingParts[1]}-${existingParts[2]}`)
            
            // Increment suspicious activity counter and update timestamp
            const newSuspiciousCount = (user.suspicious_activity_count || 0) + 1
            const shouldFlag = newSuspiciousCount >= 3 // Flag after 3 attempts
            
            await executeQuery(
              'UPDATE users SET suspicious_activity_count = ?, last_suspicious_attempt = NOW(), is_flagged = ? WHERE id = ?',
              [newSuspiciousCount, shouldFlag, user.id]
            )
            
            console.log(`🚨 User ${user.username} suspicious activity count: ${newSuspiciousCount}${shouldFlag ? ' - ACCOUNT FLAGGED!' : ''}`)
            
            return res.status(403).json({
              success: false,
              error: { 
                code: 'ALREADY_LOGGED_IN', 
                message: 'Phát hiện tài khoản đăng nhập nhiều thiết bị. Vui lòng liên hệ quản trị viên.',
                details: 'Tài khoản giáo viên chỉ được phép đăng nhập trên 1 thiết bị duy nhất.'
              }
            })
          }
        } catch (tokenError) {
          // Token is invalid/expired, clear it and allow login
          console.log(`🔄 Clearing expired/invalid token for teacher ${user.username}`)
          await executeQuery(
            'UPDATE users SET active_token = NULL WHERE id = ?',
            [user.id]
          )
          // Continue with login process
        }
      }

      // Save new token to database
      await executeQuery(
        'UPDATE users SET active_token = ? WHERE id = ?',
        [token, user.id]
      )
      console.log(`🔒 Single device login: Token saved for teacher ${user.username}`)
    }

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

// Refresh token endpoint
app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_REFRESH_TOKEN', message: 'Refresh token required' }
      })
    }

    // Verify refresh token (same as access token for simplicity)
    let decoded
    try {
      decoded = jwt.verify(refreshToken, config.JWT_SECRET)
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: { 
            code: 'REFRESH_TOKEN_EXPIRED', 
            message: 'Refresh token đã hết hạn. Vui lòng đăng nhập lại.' 
          }
        })
      }
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_REFRESH_TOKEN', message: 'Invalid refresh token' }
      })
    }

    // Get user from database
    const [users] = await executeQuery(
      'SELECT id, username, email, full_name, phone, role, is_active FROM users WHERE id = ? AND is_active = TRUE',
      [decoded.userId]
    )

    if (users.length === 0) {
      return res.status(403).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found or inactive' }
      })
    }

    const user = users[0]

    // Generate new token
    const newToken = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        role: user.role,
        deviceFingerprint: decoded.deviceFingerprint // Keep same device fingerprint
      },
      config.JWT_SECRET,
      { expiresIn: '30d' }
    )

    // Update active token for teachers
    if (user.role === 2) {
      await executeQuery(
        'UPDATE users SET active_token = ? WHERE id = ?',
        [newToken, user.id]
      )
    }

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
        user
      }
    })

  } catch (error) {
    console.error('Refresh token error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'REFRESH_ERROR', message: 'Failed to refresh token' }
    })
  }
})

// Logout endpoint
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    // For teachers (role=2), clear active token
    if (req.user.role === 2) {
      await executeQuery(
        'UPDATE users SET active_token = NULL WHERE id = ?',
        [req.user.id]
      )
      console.log(`🚪 Logout: Active token cleared for teacher ${req.user.username}`)
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'LOGOUT_ERROR', message: 'Logout failed' }
    })
  }
})

// Admin force logout teacher (admin only)
app.post('/api/admin/force-logout/:userId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params
    
    // Clear active token for the specified user
    const [result] = await executeQuery(
      'UPDATE users SET active_token = NULL WHERE id = ? AND role = 2',
      [userId]
    )
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'Teacher not found' }
      })
    }

    console.log(`👨‍💼 Admin ${req.user.username} force logged out teacher ID: ${userId}`)
    
    res.json({
      success: true,
      message: 'Teacher logged out successfully'
    })
  } catch (error) {
    console.error('Force logout error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'FORCE_LOGOUT_ERROR', message: 'Force logout failed' }
    })
  }
})

// Get users with suspicious activity (admin only)
app.get('/api/admin/suspicious-users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [users] = await executeQuery(`
      SELECT 
        id, username, full_name, email, phone, 
        suspicious_activity_count, last_suspicious_attempt, is_flagged,
        created_at, updated_at
      FROM users 
      WHERE role = 2 AND (suspicious_activity_count > 0 OR is_flagged = TRUE)
      ORDER BY suspicious_activity_count DESC, last_suspicious_attempt DESC
    `)
    
    res.json({
      success: true,
      data: users
    })
  } catch (error) {
    console.error('Get suspicious users error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Failed to fetch suspicious users' }
    })
  }
})

// Reset suspicious activity for user (admin only)
app.post('/api/admin/reset-suspicious/:userId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params
    
    const [result] = await executeQuery(
      'UPDATE users SET suspicious_activity_count = 0, last_suspicious_attempt = NULL, is_flagged = FALSE WHERE id = ? AND role = 2',
      [userId]
    )
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'Teacher not found' }
      })
    }

    console.log(`👨‍💼 Admin ${req.user.username} reset suspicious activity for teacher ID: ${userId}`)
    
    res.json({
      success: true,
      message: 'Suspicious activity reset successfully'
    })
  } catch (error) {
    console.error('Reset suspicious activity error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'RESET_ERROR', message: 'Failed to reset suspicious activity' }
    })
  }
})

// Get all users (admin only)
app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [users] = await executeQuery(`
      SELECT 
        id, username, email, full_name, phone, role,
        suspicious_activity_count, last_suspicious_attempt, is_flagged, is_active,
        created_at, updated_at
      FROM users 
      ORDER BY 
        role ASC,
        is_flagged DESC,
        suspicious_activity_count DESC,
        created_at DESC
    `)
    
    res.json({
      success: true,
      data: users
    })
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Failed to fetch users' }
    })
  }
})

// Toggle user active status (admin only)
app.post('/api/admin/toggle-user/:userId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params
    
    // Get current status
    const [users] = await executeQuery(
      'SELECT id, username, is_active, role FROM users WHERE id = ?',
      [userId]
    )
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      })
    }
    
    const user = users[0]
    const newStatus = !user.is_active
    
    // Don't allow deactivating admin accounts
    if (user.role === 1 && !newStatus) {
      return res.status(400).json({
        success: false,
        error: { code: 'CANNOT_DEACTIVATE_ADMIN', message: 'Cannot deactivate admin accounts' }
      })
    }
    
    // Update status and clear active token if deactivating
    await executeQuery(
      'UPDATE users SET is_active = ?, active_token = ? WHERE id = ?',
      [newStatus, newStatus ? null : null, userId]
    )
    
    console.log(`👨‍💼 Admin ${req.user.username} ${newStatus ? 'activated' : 'deactivated'} user ${user.username}`)
    
    res.json({
      success: true,
      message: `User ${newStatus ? 'activated' : 'deactivated'} successfully`
    })
  } catch (error) {
    console.error('Toggle user status error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'TOGGLE_ERROR', message: 'Failed to toggle user status' }
    })
  }
})

// Test Routes
app.get('/api/tests', authenticateToken, async (req, res) => {
  try {
    // Database connection is handled by executeQuery helper

    const [tests] = await executeQuery(
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

    const [result] = await executeQuery(
      'INSERT INTO sessions (instructor_id, student_name, student_id) VALUES (?, ?, ?)',
      [req.user.id, student_name, student_id || null]
    )

    const [session] = await executeQuery(
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
    // Database connection is handled by executeQuery helper

    const [sessions] = await executeQuery(
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
    const [sessions] = await executeQuery(
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

    await executeQuery(
      `UPDATE sessions SET ${updates.join(', ')} WHERE id = ?`,
      values
    )

    // Save test results if provided
    if (test_results && Array.isArray(test_results)) {
      // Delete existing results for this session
      await executeQuery('DELETE FROM results WHERE session_id = ?', [sessionId])

      // Insert new results
      for (const result of test_results) {
        await executeQuery(
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

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`)
  
  try {
    // Close database connection pool
    if (db) {
      await db.end()
      console.log('✅ Database connection pool closed')
    }
    
    console.log('✅ Graceful shutdown completed')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error)
    process.exit(1)
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error)
  gracefulShutdown('UNCAUGHT_EXCEPTION')
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
  gracefulShutdown('UNHANDLED_REJECTION')
})

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📱 Frontend URLs: ${Array.isArray(config.CORS_ORIGIN) ? config.CORS_ORIGIN.join(', ') : config.CORS_ORIGIN}`)
  console.log(`🔧 Environment: ${config.NODE_ENV}`)
  console.log(`💾 Database: ${config.DB_HOST}:3306/${config.DB_NAME}`)
})