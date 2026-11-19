# ProofPulse

**A developer challenge and submission platform built with the MERN stack.**

ProofPulse allows developers to discover coding challenges, submit their solutions, track their progress, and build public developer profiles. Administrators can manage challenges and review submissions.

## Features

- User authentication and protected routes
- Challenge creation, updating, and archiving
- Challenge difficulty filtering
- Challenge requests from users
- Solution submissions and reviews
- Developer profiles and public portfolios
- Role-based authorization
- Authentication rate limiting
- Automated backend API tests
- GitHub Actions CI
- Docker-based full-stack deployment
- MongoDB persistent storage

## Tech Stack

| Layer            | Technologies                                          |
| ---------------- | ----------------------------------------------------- |
| Frontend         | React, Vite, Axios                                    |
| Backend          | Node.js, Express.js                                   |
| Database         | MongoDB, Mongoose                                     |
| Authentication   | JWT                                                   |
| Testing          | Node.js Test Runner, Supertest, MongoDB Memory Server |
| CI               | GitHub Actions                                        |
| Containerization | Docker, Docker Compose, Nginx                         |

## Architecture

```text
React Frontend (Nginx)
        |
        | HTTP API requests
        v
Express Backend (Node.js)
        |
        | MongoDB connection
        v
MongoDB Database
        |
        v
Docker Named Volume
```

## Run with Docker

### Prerequisites

- Docker Desktop
- Git

### 1. Clone the repository

```bash
git clone https://github.com/MihirUikey/ProofPulse.git
cd ProofPulse
```

### 2. Configure environment variables

Create a `server/.env` file:

```env
PORT=5001
MONGODB_URI=mongodb://mongodb:27017/proofpulse
JWT_SECRET=your_secure_random_secret

LOGIN_RATE_LIMIT_WINDOW_MS=900000
LOGIN_RATE_LIMIT_MAX=5

REGISTER_RATE_LIMIT_WINDOW_MS=3600000
REGISTER_RATE_LIMIT_MAX=5
```

Generate a strong JWT secret for your environment. Never commit `.env` files or expose credentials.

For Docker Compose, MongoDB is accessed through the `mongodb` service name. For local development outside Docker, use the appropriate local MongoDB connection string.

### 3. Start the application

```bash
docker compose up --build -d
```

### 4. Access the application

| Service        | URL                                  |
| -------------- | ------------------------------------ |
| Frontend       | http://localhost:8080                |
| Backend        | http://localhost:5001                |
| API Challenges | http://localhost:5001/api/challenges |

### 5. View container status

```bash
docker compose ps
```

### 6. View logs

```bash
docker compose logs -f
```

### 7. Stop the application

```bash
docker compose down
```

The MongoDB named volume is preserved when using this command.

**Warning:** `docker compose down -v` removes the named volume and its stored database data.

## Database Persistence

MongoDB runs as a Docker Compose service.

The database uses a named volume:

```yaml
volumes:
  - mongodb_data:/data/db
```

This ensures database records persist even when containers are stopped and recreated.

### Back Up the Database

Create a backup directory and export the database from the MongoDB container:

```bash
mkdir -p backups
docker compose exec -T mongodb mongodump --db proofpulse --archive > backups/proofpulse-$(date +%Y%m%d-%H%M%S).archive
```

The `backups/` directory is excluded from Git.

### Restore a Database Backup

Replace `<backup-file>` with the name of the archive you want to restore:

```bash
docker compose exec -T mongodb mongorestore --drop --db proofpulse --archive < backups/<backup-file>.archive
```

**Warning:** `--drop` removes each target collection included in the backup before restoring it. Back up the current database first, and use this command only when you intentionally want to replace those collections with the backup contents.

## Backend Development

```bash
cd server
npm install
npm start
```

## Frontend Development

```bash
cd client
npm install
npm run dev
```

For local development outside Docker, configure the frontend API URL and backend MongoDB connection appropriately.

## Testing

Run backend tests:

```bash
cd server
npm test
```

Build the frontend:

```bash
cd client
npm run build
```

GitHub Actions automatically runs backend tests and frontend build checks for pushes and pull requests targeting `main`.

## Project Structure

```text
ProofPulse/
├── client/              # React frontend
├── server/              # Express backend
├── .github/workflows/   # GitHub Actions CI
├── docker-compose.yml   # Multi-container configuration
├── README.md
└── .gitignore
```

## Future Improvements

- Expand automated test coverage
- Improve deployment and monitoring
- Add more developer analytics
- Enhance challenge discovery and review workflows
