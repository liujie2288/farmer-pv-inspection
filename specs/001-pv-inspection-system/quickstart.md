# Quickstart Guide: 光伏巡检系统

## Prerequisites

- **Java**: JDK 17+
- **Node.js**: 18+
- **MySQL**: 8.0+
- **MinIO**: (dev) or 阿里云OSS (prod)
- **Maven**: 3.8+

## Backend Setup

```bash
cd backend

# 1. Configure database and MinIO
cp src/main/resources/application-dev.yml.example \
   src/main/resources/application-dev.yml
# Edit application-dev.yml with your MySQL/MinIO credentials

# 2. Database migration (auto-runs on startup via Flyway)
# First run creates all tables + seeds checklist template data

# 3. Build and run
mvn clean install
mvn spring-boot:run -Dspring-boot.run.profiles=dev

# Server starts at http://localhost:8080
```

## Frontend Setup

```bash
cd frontend

# 1. Install dependencies (includes Tailwind CSS v4)
npm install

# 2. Configure API base URL
# Edit vite.config.ts proxy target to match backend

# 3. Run dev server
npm run dev

# App starts at http://localhost:3000
```

**Note**: Tailwind CSS v4 is configured via `@tailwindcss/vite` plugin in `vite.config.ts`.
Design tokens are defined in `src/index.css` using `@theme` directive. No `tailwind.config.ts` needed.

## Default Admin Account

First startup creates a default admin user:
- Username: `admin`
- Password: `admin123`
- Role: admin
- first_login: true (must change password on first login)

## Running Tests

```bash
# Backend
cd backend
mvn test                    # All tests
mvn test -pl :inspection    # Single module tests
mvn test -Dtest=InspectionServiceTest  # Single test class

# Frontend
cd frontend
npm test                    # All tests
npm test -- --grep "InspectionForm"  # Single test
```

## API Documentation

Swagger UI available at: `http://localhost:8080/swagger-ui.html` (when running)

## Project Conventions

- **Backend packages**: organized by domain module (auth, user, project, farmer, plan, inspection, stats, export, storage)
- **Frontend pages**: organized by role (admin/, inspector/) + shared components
- **Database migrations**: `V{N}__description.sql` in `resources/db/migration/`
- **API responses**: uniform `{ code, message, data }` wrapper
- **Error handling**: custom exceptions mapped to HTTP status codes
