# Medical Consumption Tracker

A web application for managing daily drug consumptions (pills or by mg) and tracking medical procedures like enema and urinary catheterization. The application supports multi-user management with secure authentication and PostgreSQL database storage.

## Features

- **User Authentication**: Secure registration and login with JWT tokens
- **Drug Consumption Tracking**: 
  - Add and manage drugs (pills or milligrams)
  - Record daily drug consumptions
  - View consumption history
- **Medical Procedure Tracking**:
  - Track enema procedures
  - Track urinary catheterization procedures
  - Record daily procedures with notes
- **Dashboard**: View today's summary of consumptions and procedures
- **Multi-user Support**: Each user has their own isolated data

## Technology Stack

### Backend
- Node.js + Express.js
- PostgreSQL
- JWT for authentication
- bcrypt for password hashing

### Frontend
- React 18
- Material-UI (MUI)
- React Router
- Axios for API calls
- Vite for build tooling

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Setup Instructions

### 1. Database Setup

First, create a PostgreSQL database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE ori_app;

# Exit psql
\q
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env file with your database credentials
# Update the following variables:
# - DB_HOST (default: localhost)
# - DB_PORT (default: 5432)
# - DB_NAME (default: ori_app)
# - DB_USER (default: postgres)
# - DB_PASSWORD (your PostgreSQL password)
# - JWT_SECRET (change to a secure random string)

# Run database migrations
npm run migrate

# Start the backend server (development mode)
npm run dev

# Or start in production mode
npm start
```

The backend server will run on `http://localhost:3001`

### 3. Frontend Setup

```bash
# Navigate to frontend directory (in a new terminal)
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will run on `http://localhost:3000`

## Project Structure

```
ori-app/
├── backend/
│   ├── src/
│   │   ├── config/          # Database configuration and migrations
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Authentication middleware
│   │   ├── routes/          # API routes
│   │   └── server.js        # Express server setup
│   ├── package.json
│   └── .env                 # Environment variables (create from .env.example)
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API service layer
│   │   ├── App.jsx          # Main app component
│   │   └── main.jsx         # Entry point
│   ├── package.json
│   └── vite.config.js       # Vite configuration
│
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)

### Drugs
- `GET /api/drugs` - Get all drugs for user (protected)
- `POST /api/drugs` - Create a new drug (protected)
- `PUT /api/drugs/:id` - Update a drug (protected)
- `DELETE /api/drugs/:id` - Delete a drug (protected)
- `GET /api/drugs/consumptions` - Get consumption records (protected)
- `POST /api/drugs/consumptions` - Record a consumption (protected)
- `DELETE /api/drugs/consumptions/:id` - Delete a consumption (protected)
- `GET /api/drugs/summary/today` - Get today's summary (protected)

### Procedures
- `GET /api/procedures` - Get all procedures for user (protected)
- `POST /api/procedures` - Create a new procedure (protected)
- `PUT /api/procedures/:id` - Update a procedure (protected)
- `DELETE /api/procedures/:id` - Delete a procedure (protected)
- `GET /api/procedures/records` - Get procedure records (protected)
- `POST /api/procedures/records` - Record a procedure (protected)
- `DELETE /api/procedures/records/:id` - Delete a procedure record (protected)

## Usage

1. **Register/Login**: Create an account or login with existing credentials
2. **Add Drugs**: Navigate to "Drugs" section and add medications you need to track
3. **Record Consumptions**: Record daily drug consumptions with quantity and unit type
4. **Add Procedures**: Add medical procedures (enema, urinary catheterization) you need to track
5. **Record Procedures**: Log daily procedures with optional notes
6. **View Dashboard**: Check today's summary of all consumptions and procedures

## Development

### Backend Development
- The backend uses nodemon for auto-restart during development
- Run `npm run dev` to start with hot reload
- Check console logs for debugging

### Frontend Development
- The frontend uses Vite for fast HMR (Hot Module Replacement)
- Run `npm run dev` to start the development server
- The proxy is configured to forward `/api` requests to the backend

## Production Build

### Backend
```bash
cd backend
npm start
```

### Frontend
```bash
cd frontend
npm run build
# The built files will be in the 'dist' directory
npm run preview  # Preview the production build
```

## Security Notes

- Always change the `JWT_SECRET` in production
- Use strong passwords for the database
- Consider using environment-specific configuration files
- Implement rate limiting for production
- Use HTTPS in production

## License

ISC

## Support

For issues or questions, please check the code comments or create an issue in the repository.

