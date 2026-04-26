# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Farmer PV Inspection System (光伏巡检系统) — a solar/photovoltaic inspection platform
for distributed generation projects. Mobile-first web application for field inspectors
and administrators to manage projects/stations, execute structured section-based
inspections, and export PDF reports.

## Tech Stack

- **Backend**: Java 17, SpringBoot 2.7.x, MyBatis-Plus, Spring Security (JWT), Lombok, MapStruct
- **Frontend**: React 18, Tailwind CSS v4, Lucide React (icons), Axios, PDF.js, Zustand
- **Database**: MySQL 8.0
- **Object Storage**: MinIO (dev) / 阿里云OSS (prod) — photos and PDFs
- **Build**: Maven (backend), Vite (frontend)

## Development Commands

```bash
# Backend (Maven path may not be in PATH, use /c/tools/apache-maven-3.9.6/bin/mvn)
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

## Local Config

Each developer creates `backend/src/main/resources/application-local.yml` (gitignored)
to override local settings (e.g. DB password). `application-dev.yml` imports it with
`optional:` prefix so it's silently skipped when absent.

```yaml
# application-local.yml example
spring:
  datasource:
    password: your_local_mysql_password
```

## Project Structure

```text
backend/src/main/java/com/yldlxj/pv/inspect/
├── config/        # Security, CORS, MinIO, async, MyBatis
├── common/        # ApiResponse wrapper, exceptions, BaseEntity, PageDto
├── auth/          # Login, JWT, password management
├── user/          # User CRUD (SysUser), roles (admin/inspector)
├── project/       # Project CRUD
├── station/       # Station CRUD (replaces old farmer module)
├── plan/          # Inspection plans, InspectPlanProject (plan-project many-to-many)
├── record/        # Inspection records, checklist results
├── section/       # Inspection sections & items (configurable checklist template)
├── device/        # InspectDevice (per-project inspection devices)
├── convert/       # MapStruct mappers (UserConvert, ProjectConvert, etc.)
├── stats/         # Statistics aggregation
├── export/        # PDF (iTextPDF), ZIP, async export tasks
└── storage/       # MinIO/OSS, watermark, compression

frontend/src/
├── api/           # Axios client, endpoints
├── components/    # layout/ (AppShell, Sidebar, TopBar), ui/ (Toast, Dialog, etc)
├── pages/admin/   # Dashboard, ProjectList, ProjectForm, StationList, PlanList, UserList
├── pages/inspector/ # ProjectList, StationList, InspectionForm
├── pages/records/ # RecordList, RecordDetail
├── pages/profile/ # ProfilePage, InspectorProfilePage
├── hooks/         # Custom hooks
├── utils/         # Photo compression, GPS, auth
└── router/        # Route config with role guards
```

## Key Architecture Decisions

- **Station-based model**: Stations (电站) replace the old farmer entity. Each project has multiple stations with inverter/module details.
- **Configurable inspection template**: `inspect_section` + `inspect_section_item` tables define sections and items. Projects select which sections to use via `section_ids`.
- **Plan-Project many-to-many**: `inspect_plan_project` links plans to projects with per-project progress tracking (`total_count` / `inspected_count`).
- **Status enums**: `PlanStatus` and `InspectStatus` enums eliminate magic numbers.
- **Checklist results**: Stored as JSON in `checklist_result` column, referencing section item IDs.
- **Photo pipeline**: Frontend Canvas compression → upload to MinIO/OSS → backend watermark overlay
- **Auth**: JWT (2hr expiry) in HttpOnly cookie, Spring Security role-based access (admin/inspector)
- **Async export**: Spring @Async + ThreadPool for ZIP exports >1000 records
- **API convention**: Uniform `{ code, message, data }` response wrapper
- **Object mapping**: MapStruct for entity ↔ DTO conversions (UserConvert, ProjectConvert, StationConvert, etc.)
- **UI framework**: Tailwind CSS v4 (no component library), Lucide React (icons), responsive sidebar layout
- **Navigation**: Top bar + sidebar (desktop: persistent, mobile: hamburger drawer)
- **Design system**: See `frontend/docs/style-guide.md` for colors, typography, component patterns, and spacing conventions. All new UI MUST follow this guide.

## Database

MySQL 8.0. Tables: `sys_user`, `project`, `station`, `inspect_plan`,
`inspect_plan_project`, `inspect_record`, `inspect_section`,
`inspect_section_item`, `inspect_device`, `export_task`.

Legacy tables (no longer used by code): `farmer`, `inspect_checklist_template`.

Default admin credentials: `admin` / `admin123` (BCrypt encoded, `need_reset_pwd=true`).

## DTO File Naming Convention

DTO files MUST be named to match the class name exactly (Java is case-sensitive):
- Class `PlanDto` → file `PlanDto.java` (NOT `PlanDTO.java`)
- Class `ProjectDto` → file `ProjectDto.java` (NOT `ProjectDTO.java`)

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
