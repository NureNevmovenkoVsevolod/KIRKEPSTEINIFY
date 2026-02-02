# KirkEpsteinify Backend API

A modern, scalable weather station IoT backend API built with Node.js and Express.js using a clean modular architecture.

## 🏗️ Architecture

The application follows a layered architecture pattern:

```
src/
├── config/          # Environment & configuration management
├── db/              # Database connection pool
├── services/        # Business logic layer
├── controllers/     # HTTP request handlers
├── routes/          # API route definitions
├── middleware/      # Express middleware (validation, error handling)
├── app.js          # Express app initialization
└── server.js       # Server entry point
```

## 🚀 Getting Started

### Prerequisites
- Node.js 14+
- PostgreSQL 12+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Create .env file with your configuration
cp .env.example .env

# Run database migrations
psql -U postgres -d kirkepsteinify_db -f db_schema.sql

# Start development server
npm run dev
```

### Environment Variables

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kirkepsteinify_db
DB_USER=postgres
DB_PASSWORD=your_password
PORT=5000
NODE_ENV=development
BCRYPT_SALT_ROUNDS=10
```

## 📖 API Documentation

### Authentication Routes

#### Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "password123"
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Station Routes

#### Create Station
```
POST /api/stations
Content-Type: application/json

{
  "userId": "user-uuid",
  "name": "Weather Station 1",
  "location": "Berlin, Germany"
}
```

#### Get User Stations
```
GET /api/stations?userId=user-uuid
```

#### Get Station Details
```
GET /api/stations/:stationId
```

#### Update Station
```
PUT /api/stations/:stationId
Content-Type: application/json

{
  "name": "Updated Name",
  "location": "New Location",
  "is_active": true
}
```

#### Delete Station
```
DELETE /api/stations/:stationId
```

### Measurement Routes

#### Record Measurement
```
POST /api/measurements
Content-Type: application/json

{
  "stationId": "station-uuid",
  "temperature": 23.5,
  "humidity": 65,
  "pressure": 1013.25,
  "windSpeed": 5.2,
  "rainfall": 0.0,
  "lightLevel": 800
}
```

#### Get Measurements
```
GET /api/measurements/station/:stationId?period=24h

# Supported periods: 24h, 7d, 30d, 1y
```

#### Get Latest Measurement
```
GET /api/measurements/station/:stationId/latest
```

#### Get Measurement Statistics
```
GET /api/measurements/station/:stationId/stats?period=24h
```

### Health Check

```
GET /health
```

## 🧪 Testing

```bash
# Run all tests with coverage
npm test

# Run tests in watch mode
npm run test:watch

# Run only integration tests
npm run test:integration

# Lint code
npm run lint
npm run lint:fix
```

### Test Coverage

- **Unit Tests**: Services, controllers, validation middleware
- **Integration Tests**: API routes with mocked database
- **Coverage Target**: >80% statements, >70% branches

Current coverage:
- Statements: 84.16%
- Branches: 71.31%
- Functions: 89.47%
- Lines: 84.10%

## 📁 Project Structure

### Services Layer
Business logic separated from HTTP concerns:
- `authService.js` - User authentication & registration
- `stationService.js` - Weather station management
- `measurementService.js` - Telemetry data handling

### Controllers Layer
Request/response handlers:
- `authController.js` - Auth endpoint handlers
- `stationController.js` - Station endpoint handlers
- `measurementController.js` - Measurement endpoint handlers

### Routes Layer
API endpoint definitions with validation:
- `authRoutes.js` - `/api/auth/*`
- `stationRoutes.js` - `/api/stations/*`
- `measurementRoutes.js` - `/api/measurements/*`
- `healthRoutes.js` - `/health`

### Middleware
- `validation.js` - Request validation rules
- `errorHandler.js` - Global error handling & async wrapper

## 🔧 Configuration

### Database Connection Pool
Configured in `src/config/config.js`:
- Min connections: 4
- Max connections: 20
- Idle timeout: 30s
- Connection timeout: 2s

### Bcrypt
- Salt rounds: 10 (configurable via `BCRYPT_SALT_ROUNDS`)

## 🛡️ Security Features

- ✅ Password hashing with bcrypt
- ✅ Input validation on all endpoints
- ✅ SQL injection prevention (parameterized queries)
- ✅ Comprehensive error handling
- ✅ Database connection pooling
- ✅ Environment-based configuration

## 📊 Database Schema

See `db_schema.sql` for complete database structure including:
- Users table
- Stations table
- Measurements table

## 🚀 Deployment

### Using npm
```bash
NODE_ENV=production npm start
```

### Using Docker
```bash
docker build -t kirkepsteinify .
docker run -p 5000:5000 --env-file .env kirkepsteinify
```

## 📝 Development Workflow

1. Create a feature branch: `git checkout -b feature/name`
2. Make changes and add tests
3. Run tests: `npm test`
4. Commit: `git commit -m "feat: description"`
5. Push and create a pull request

## 🐛 Troubleshooting

### Database connection fails
- Verify PostgreSQL is running
- Check `.env` credentials
- Ensure database exists: `createdb kirkepsteinify_db`

### Tests fail with module not found
- Run `npm install` to install dependencies
- Verify all file paths in test imports

### Port already in use
- Change `PORT` in `.env`
- Or kill the process: `lsof -ti:5000 | xargs kill -9`

## 📞 API Versioning

Current version: `2.0.0` (Modular Architecture)

All endpoints are prefixed with `/api/` for future versioning support.

## 📄 License

ISC

## 🤝 Contributing

Contributions are welcome! Please ensure:
- Tests pass: `npm test`
- Code is linted: `npm run lint`
- Follow the existing project structure
- Add tests for new features
