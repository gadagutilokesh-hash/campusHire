# CampusHire Backend REST API (Milestone 2)

Node.js & Express.js REST API service integrating with MongoDB Atlas via Mongoose, secured with Helmet, CORS, and prepared for Firebase Authentication.

---

## Architecture Overview

```
backend/
├── package.json
├── .env.example
├── test/
│   └── backend.test.js              # Automated Node.js native test suite
└── src/
    ├── server.js                    # Entry point, database initialization & graceful shutdown
    ├── app.js                       # Express app with helmet, cors, morgan, and route mounting
    ├── config/
    │   └── database.js              # MongoDB Atlas connection & safe state reporting
    ├── models/
    │   ├── User.js                  # Student & Placement Officer schema
    │   ├── Job.js                   # Recruitment drive postings & eligibility rules
    │   ├── Application.js           # Student application tracking with compound unique index
    │   ├── Drive.js                 # Drive schedule, rounds, and venue links
    │   └── Announcement.js          # Placement circulars and notices
    ├── controllers/
    │   ├── healthController.js      # GET /api/health
    │   ├── jobController.js         # GET /api/jobs, GET /api/jobs/:id
    │   ├── applicationController.js # GET /api/applications, POST /api/applications
    │   ├── driveController.js       # GET /api/drives, GET /api/drives/:id
    │   └── statsController.js       # GET /api/stats (database computed)
    ├── routes/
    │   ├── healthRoutes.js
    │   ├── jobRoutes.js
    │   ├── applicationRoutes.js
    │   ├── driveRoutes.js
    │   └── statsRoutes.js
    └── middleware/
        ├── auth.js                  # Bearer token verification & role authorization
        ├── errorHandler.js          # Centralized error handler
        └── notFound.js              # 404 handler
```

---

## Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Description | Default / Example |
|---|---|---|
| `PORT` | HTTP Server port | `5000` |
| `NODE_ENV` | Runtime environment | `development` |
| `CLIENT_ORIGIN` | Allowed client origin for CORS | `http://localhost:5173` |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://<user>:<password>@cluster.mongodb.net/campushire` |
| `FIREBASE_PROJECT_ID` | Firebase Project ID | *(optional for Milestone 2)* |
| `FIREBASE_CLIENT_EMAIL` | Firebase Service Account Email | *(optional for Milestone 2)* |
| `FIREBASE_PRIVATE_KEY` | Firebase Admin Private Key | *(optional for Milestone 2)* |
| `ALLOW_DEV_AUTH` | Enable test mock auth in development | `true` |

---

## API Endpoints

### 1. System Health
* **`GET /api/health`**: Returns system uptime, environment, and database connection state without leaking credentials.

### 2. Jobs API
* **`GET /api/jobs`**: Query active jobs. Supports pagination (`page`, `limit`), search (`search`), and filters (`department`, `category`, `jobType`, `minCtc`, `maxCtc`, `sortBy`).
* **`GET /api/jobs/:id`**: Retrieve specific job details by ID.

### 3. Applications API (Protected)
* **`GET /api/applications`**: Retrieves applications. Students see only their own applications; placement officers can query all applications.
* **`GET /api/applications/:id`**: Retrieves specific application details.
* **`POST /api/applications`**: Submits an application. Validates student eligibility and enforces single application per job (compound unique index prevents duplicates).

### 4. Recruitment Drives API
* **`GET /api/drives`**: Queries upcoming and active drives.
* **`GET /api/drives/:id`**: Retrieves specific drive details.

### 5. Placement Statistics API
* **`GET /api/stats`**: Returns real metrics computed directly from database collections (total students, placed count, package statistics, and department breakdown).

---

## Running the Backend

```bash
# In backend/ directory:
npm install
npm run dev     # Starts with Node.js native file watcher
npm test        # Runs test suite verifying health, security, and routes
```
