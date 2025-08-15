# System Patterns - Driving Test App

## Architecture Overview

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile Web    │    │   Backend API   │    │     MySQL       │
│   (React)       │◄──►│   (Express)     │◄──►│   Database      │
│                 │    │                 │    │                 │
│ • UI Components │    │ • REST APIs     │    │ • Users         │
│ • Voice API     │    │ • JWT Auth      │    │ • Test Sessions │
│ • State Mgmt    │    │ • Business Logic│    │ • Test Results  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Container Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                        Docker Host                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Frontend   │  │   Backend   │  │    MySQL    │             │
│  │  Container  │  │  Container  │  │  Container  │             │
│  │             │  │             │  │             │             │
│  │ Nginx:80    │  │ Node:5000   │  │ MySQL:3306  │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│         │                 │                 │                  │
│         └─────────────────┼─────────────────┘                  │
│                          │                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Shared Network                             │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Component Design Patterns

### Frontend Component Hierarchy
```
App
├── Router
│   ├── AuthLayout
│   │   ├── LoginPage
│   │   └── RegisterPage
│   └── MainLayout
│       ├── Header
│       ├── TestListPage
│       ├── TestDetailPage
│       └── ScoreHistoryPage
│
├── Shared Components
│   ├── TestCard
│   ├── ErrorList
│   ├── ScoreDisplay
│   ├── VoiceButton
│   └── LoadingSpinner
│
└── Hooks
    ├── useAuth
    ├── useVoice
    ├── useTestSession
    └── useLocalStorage
```

### Backend Service Pattern
```
Controllers/        # Request handling
├── authController.js
├── testController.js
└── sessionController.js

Services/           # Business logic
├── authService.js
├── testService.js
└── sessionService.js

Models/             # Data layer
├── User.js
├── TestSession.js
└── TestResult.js

Middleware/         # Cross-cutting concerns
├── auth.js
├── validation.js
└── errorHandler.js
```

## Data Flow Patterns

### Authentication Flow
```
1. User Login
   Frontend → POST /api/auth/login → Backend
   Backend → Validate credentials → Database
   Backend → Generate JWT → Frontend
   Frontend → Store token → LocalStorage

2. Authenticated Requests
   Frontend → Add JWT header → Backend
   Backend → Verify token → Continue/Reject
```

### Test Session Flow
```
1. Start Test Session
   Frontend → POST /api/sessions → Backend
   Backend → Create session → Database
   Backend → Return session_id → Frontend

2. Record Test Results
   Frontend → PUT /api/sessions/:id → Backend
   Backend → Update session → Database
   Backend → Calculate score → Frontend

3. Complete Session
   Frontend → Mark complete → Backend
   Backend → Finalize session → Database
```

## State Management Patterns

### Frontend State Structure
```javascript
// Global App State
const AppContext = {
  user: {
    id: number,
    username: string,
    fullName: string,
    isAuthenticated: boolean
  },
  currentSession: {
    id: number,
    studentName: string,
    totalScore: number,
    testResults: Array<TestResult>
  },
  ui: {
    isLoading: boolean,
    currentTest: number,
    voiceEnabled: boolean
  }
}

// Test Result Structure
const TestResult = {
  testNumber: number,
  testName: string,
  errorsDetected: Array<{
    errorText: string,
    pointsDeducted: number,
    timestamp: Date
  }>,
  totalPointsDeducted: number
}
```

### Backend Response Patterns
```javascript
// Success Response
{
  success: true,
  data: {
    // Response data
  },
  message: "Operation completed successfully"
}

// Error Response
{
  success: false,
  error: {
    code: "ERROR_CODE",
    message: "Human readable message",
    details: {} // Additional error details
  }
}
```

## UI/UX Design Patterns

### Mobile-First Component Design
```scss
// Responsive Breakpoints
$mobile: 320px;
$tablet: 768px;
$desktop: 1024px;

// Component Pattern
.test-card {
  @apply w-full p-4 mb-4 bg-white rounded-lg shadow-md;
  
  // Mobile first
  @apply text-sm;
  
  // Tablet up
  @screen md {
    @apply text-base p-6;
  }
  
  // Desktop up
  @screen lg {
    @apply max-w-md mx-auto;
  }
}
```

### Voice Integration Pattern
```javascript
// Voice Service Pattern
class VoiceService {
  constructor() {
    this.synthesis = window.speechSynthesis;
    this.isSupported = 'speechSynthesis' in window;
  }
  
  speak(text, options = {}) {
    if (!this.isSupported) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    utterance.rate = options.rate || 0.8;
    utterance.pitch = options.pitch || 1;
    
    this.synthesis.speak(utterance);
  }
  
  stop() {
    this.synthesis.cancel();
  }
}
```

## Error Handling Patterns

### Frontend Error Boundaries
```javascript
// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

### Backend Error Middleware
```javascript
// Global Error Handler
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: err.details
      }
    });
  }
  
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong'
    }
  });
};
```

## Performance Optimization Patterns

### Frontend Optimization
- **Component Memoization**: React.memo cho components không thay đổi thường xuyên
- **Lazy Loading**: React.lazy cho route-based code splitting
- **Virtual Scrolling**: Cho danh sách test results dài
- **Image Optimization**: WebP format với fallback

### Backend Optimization
- **Connection Pooling**: MySQL connection pool
- **Response Caching**: Cache static data như test definitions
- **Pagination**: Cho API endpoints trả về lists
- **Database Indexing**: Index cho các truy vấn thường dùng

## Security Patterns

### Input Validation
```javascript
// Joi validation schemas
const loginSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().min(6).required()
});

const testResultSchema = Joi.object({
  testNumber: Joi.number().integer().min(1).max(11).required(),
  errorsDetected: Joi.array().items(
    Joi.object({
      errorText: Joi.string().required(),
      pointsDeducted: Joi.number().integer().min(0).required()
    })
  )
});
```

### Authentication Middleware
```javascript
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: { code: 'NO_TOKEN', message: 'Access token required' }
    });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid access token' }
      });
    }
    req.user = user;
    next();
  });
};
```