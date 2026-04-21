# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Farmer PV Inspection System (光伏巡检系统) — a solar/photovoltaic inspection platform
for distributed generation projects. Mobile-first web application for field inspectors
and administrators to manage project/farmer data, execute structured 6-section 64-item
inspections, and export PDF reports.

## Tech Stack

- **Backend**: Java 17, SpringBoot 2.7.x, MyBatis-Plus, Spring Security (JWT), Lombok
- **Frontend**: React 18, Tailwind CSS v4, Lucide React (icons), Axios, PDF.js, Zustand
- **Database**: MySQL 8.0 (Flyway migrations)
- **Object Storage**: MinIO (dev) / 阿里云OSS (prod) — photos and PDFs
- **Build**: Maven (backend), Vite (frontend)

## Development Commands

```bash
# Backend
cd backend && mvn clean install          # Build
mvn spring-boot:run -Dspring-boot.run.profiles=dev  # Run
mvn test                                 # All tests
mvn test -Dtest=ClassName               # Single test class

# Frontend
cd frontend && npm install               # Install deps
npm run dev                              # Dev server (localhost:3000)
npm test                                 # All tests
npm run lint                             # Lint
```

## Project Structure

```text
backend/src/main/java/com/pv/inspection/
├── config/        # Security, CORS, MinIO, Flyway
├── common/        # Response wrapper, exceptions, constants
├── auth/          # Login, JWT
├── user/          # User CRUD, roles
├── project/       # Project CRUD, statistics
├── farmer/        # Farmer CRUD, batch import (EasyExcel)
├── plan/          # Inspection plans, scheduler
├── inspection/    # Inspection records, checklist template
├── stats/         # Statistics aggregation
├── export/        # PDF (iTextPDF), ZIP, async tasks
└── storage/       # MinIO/OSS, watermark, compression

frontend/src/
├── api/           # Axios client, endpoints
├── components/    # layout/ (AppShell, Sidebar, TopBar), ui/ (Toast, Dialog, etc)
├── pages/admin/   # Dashboard, ProjectList, FarmerList, PlanList, UserList
├── pages/inspector/ # ProjectList, FarmerList, InspectionForm
├── pages/records/ # RecordList, RecordDetail
├── pages/profile/ # Personal center
├── hooks/         # Custom hooks
├── utils/         # Photo compression, GPS, auth
└── router/        # Route config with role guards
```

## Key Architecture Decisions

- **Structured inspection**: 6 sections / 64 items stored as JSON in `checklist_result` column; template in `inspect_checklist_template` table
- **Photo pipeline**: Frontend Canvas compression → upload to MinIO/OSS → backend watermark overlay
- **Auth**: JWT (2hr expiry), Spring Security role-based access (admin/inspector)
- **Async export**: Spring @Async + ThreadPool for ZIP exports >1000 records
- **API convention**: Uniform `{ code, message, data }` response wrapper
- **UI framework**: Tailwind CSS v4 (no component library), Lucide React (icons), responsive sidebar layout
- **Navigation**: Top bar + sidebar (desktop: persistent, mobile: hamburger drawer)
- **Design system**: See `frontend/docs/style-guide.md` for colors, typography, component patterns, and spacing conventions. All new UI MUST follow this guide.

## Database

MySQL 8.0 with Flyway migrations in `backend/src/main/resources/db/migration/`.
Tables: `sys_user`, `project`, `farmer`, `inspect_plan`, `inspect_record`,
`inspect_checklist_template`, `export_task`.

## Spec-Kit Development Workflow

This project uses **Spec-Kit v0.5.1** for specification-driven development:

1. `/speckit-constitution` → `/speckit-specify` → `/speckit-clarify`
2. `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`

Feature specs live in `specs/<branch-name>/`. Branch numbering is sequential (001, 002...).
Scripts are PowerShell: `.specify/scripts/powershell/`.

## Constitution Principles

1. **Code Quality** — Single responsibility, consistent naming, lint/format gates
2. **Test-First (NON-NEGOTIABLE)** — Red-Green-Refactor, regression tests for bug fixes
3. **Consistent UX** — Uniform patterns, Chinese UI, loading/success/error feedback
4. **Responsive & Adaptive** — Mobile-first for inspectors, desktop-optimized for admins; both breakpoints tested

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
