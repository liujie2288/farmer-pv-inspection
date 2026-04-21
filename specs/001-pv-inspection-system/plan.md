# Implementation Plan: 光伏巡检系统

**Branch**: `001-pv-inspection-system` | **Date**: 2026-04-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-pv-inspection-system/spec.md`

## Summary

构建光伏巡检系统，支持管理员管理项目/农户/巡检计划，巡检员通过移动端执行
6大分区64项结构化巡检填报、上传照片、采集经纬度，管理员查看统计和导出
PDF巡检报告。前后端分离架构，React前端+SpringBoot后端+MySQL+MinIO/OSS。

## Technical Context

**Language/Version**: TypeScript 5.x (frontend), Java 17 (backend)
**Primary Dependencies**:

- Frontend: React 18, Tailwind CSS v4 (`@tailwindcss/vite`), Lucide React (图标), Zustand (状态), Axios, PDF.js, react-router-dom v6
- Backend: SpringBoot 2.7.x, MyBatis-Plus, Spring Security (JWT), Lombok, EasyExcel, iTextPDF, Quartz, MinIO/OSS SDK
  **Storage**: MySQL 8.0 (结构化数据), MinIO (dev) / 阿里云OSS (prod) (照片+PDF)
  **Testing**: Jest + React Testing Library (frontend), JUnit 5 + Mockito (backend)
  **Target Platform**: 移动端浏览器优先 (≥375px), PC端桌面浏览器 (≥1024px), 响应式兼容
  **Project Type**: Web Application (前后端分离)
  **Performance Goals**: 页面首次加载 ≤3s, 跳转 ≤1s, 50人并发在线巡检, 批量导出 ≤30min
  **Constraints**: 移动端单手操作友好, 户外弱网环境可用, JWT 2小时过期
  **Scale/Scope**: 2角色 (admin/inspector), ~10页面, 上千农户滚动加载

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                 | Status  | Notes                                                         |
| ------------------------- | ------- | ------------------------------------------------------------- |
| I. Code Quality           | ✅ PASS | Tailwind CSS 实用类 + TypeScript 严格类型，组件单一职责       |
| II. Test-First            | ✅ PASS | 后端已有测试覆盖，前端重写后补测试 (Phase 10)                 |
| III. Consistent UX        | ✅ PASS | 统一 AppShell 布局，中文 UI，统一设计令牌 (navy/teal/gold)    |
| IV. Responsive & Adaptive | ✅ PASS | 移动端优先 (<1024px 汉堡菜单抽屉), 桌面端固定侧边栏 (≥1024px) |

**Post-design re-check**: All gates remain PASS after design decisions.

## Project Structure

### Documentation (this feature)

```text
specs/001-pv-inspection-system/
├── plan.md              # This file
├── spec.md              # User stories & acceptance criteria
├── research.md          # Technical decisions (R1-R15)
├── data-model.md        # Entity definitions
├── quickstart.md        # Setup & run guide
├── contracts/           # API contracts
└── tasks.md             # Implementation tasks (45 tasks, 10 phases)
```

### Source Code (repository root)

```text
backend/                              # Java backend (unchanged)
├── src/main/java/com/pv/inspection/
│   ├── config/                       # SecurityConfig, CORS, MinIO, Flyway
│   ├── common/                       # Response wrapper, exceptions, constants
│   ├── auth/                         # Login, JWT filter
│   ├── user/                         # User CRUD, roles
│   ├── project/                      # Project CRUD, statistics
│   ├── farmer/                       # Farmer CRUD, batch import (EasyExcel)
│   ├── plan/                         # Inspection plans, status scheduler (Quartz)
│   ├── inspection/                   # Inspection records, checklist template
│   ├── stats/                        # Statistics aggregation
│   ├── export/                       # PDF (iTextPDF), ZIP, async tasks (@Async)
│   └── storage/                      # MinIO/OSS SDK, watermark, compression
├── src/main/resources/
│   ├── db/migration/                 # Flyway SQL migrations
│   └── application*.yml              # Spring profiles
└── pom.xml

frontend/                             # React frontend (FULL REWRITE)
├── public/
├── src/
│   ├── api/                          # Axios client, endpoint definitions
│   ├── components/
│   │   ├── layout/                   # AppShell, TopBar, Sidebar, SidebarContext
│   │   ├── ui/                       # Toast, Dialog, DatePicker, EmptyState,
│   │   │                             #   StatusTag, LoadingSpinner, PhotoUploader
│   │   ├── InspectionChecklist.tsx    # 6-section 64-item checklist
│   │   └── LocationPicker.tsx        # GPS coordinates picker
│   ├── pages/
│   │   ├── login/LoginPage.tsx        # Login + first-login password change
│   │   ├── admin/
│   │   │   ├── Dashboard/            # Admin homepage: stats, rankings
│   │   │   ├── ProjectList/          # Project CRUD
│   │   │   ├── FarmerList/           # Farmer management, import, export
│   │   │   ├── PlanList/             # Plan CRUD, status, details
│   │   │   └── UserList/             # User CRUD, role, password reset
│   │   ├── inspector/
│   │   │   ├── ProjectList/          # Inspector project cards
│   │   │   ├── FarmerList/           # Farmer list with "巡检" button
│   │   │   └── InspectionForm/       # Inspection form page
│   │   ├── records/                  # Record list + detail
│   │   └── profile/                  # Profile, password change, logout
│   ├── hooks/                        # usePullToRefresh, useInfiniteScroll
│   ├── utils/                        # Photo compression, GPS, auth helpers
│   ├── store/                        # Zustand stores (auth)
│   ├── router/                       # Route config with role guards
│   ├── App.tsx                       # Root component with AppShell
│   ├── main.tsx                      # Entry point
│   └── index.css                     # Tailwind @import + @theme design tokens
├── index.html
├── vite.config.ts                    # Vite + @tailwindcss/vite plugin
├── tsconfig.json
└── package.json
└──
```

**Structure Decision**: Web application (Option 2) — existing backend/ + frontend/ monorepo structure preserved. Only frontend files are rewritten; backend remains unchanged.

## File Migration Map

### Files to DELETE (replaced by new structure)

| Old File                                       | Replacement                                       |
| ---------------------------------------------- | ------------------------------------------------- |
| `frontend/src/styles/theme.css`                | `frontend/src/index.css` (Tailwind @theme)        |
| `frontend/src/components/AdminLayout.tsx`      | `frontend/src/components/layout/AppShell.tsx`     |
| `frontend/src/components/InspectorLayout.tsx`  | `frontend/src/components/layout/AppShell.tsx`     |
| `frontend/src/components/StatusTag/`           | `frontend/src/components/ui/StatusTag.tsx`        |
| `frontend/src/components/EmptyState/`          | `frontend/src/components/ui/EmptyState.tsx`       |
| `frontend/src/components/PhotoUploader/`       | `frontend/src/components/ui/PhotoUploader.tsx`    |
| `frontend/src/components/LocationPicker/`      | `frontend/src/components/LocationPicker.tsx`      |
| `frontend/src/components/InspectionChecklist/` | `frontend/src/components/InspectionChecklist.tsx` |

### Files to REWRITE (same path, new content with Tailwind)

| File                                                                 | What Changes                                                           |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `frontend/package.json`                                              | Remove antd-mobile, add tailwindcss + @tailwindcss/vite + lucide-react |
| `frontend/vite.config.ts`                                            | Add @tailwindcss/vite plugin                                           |
| `frontend/src/main.tsx`                                              | Replace theme.css import with index.css                                |
| `frontend/src/App.tsx`                                               | Replace AdminLayout/InspectorLayout with AppShell                      |
| `frontend/src/index.css`                                             | Add @import "tailwindcss" + @theme block                               |
| `frontend/src/router/index.tsx`                                      | Use AppShell wrapper for all routes                                    |
| `frontend/src/pages/login/LoginPage.tsx`                             | Full Tailwind rewrite                                                  |
| `frontend/src/pages/admin/Dashboard/DashboardPage.tsx`               | Full Tailwind rewrite                                                  |
| `frontend/src/pages/admin/ProjectList/ProjectListPage.tsx`           | Full Tailwind rewrite                                                  |
| `frontend/src/pages/admin/FarmerList/FarmerListPage.tsx`             | Full Tailwind rewrite                                                  |
| `frontend/src/pages/admin/FarmerList/FarmerDetailPage.tsx`           | Full Tailwind rewrite                                                  |
| `frontend/src/pages/admin/PlanList/PlanListPage.tsx`                 | Full Tailwind rewrite                                                  |
| `frontend/src/pages/admin/PlanList/PlanDetailPage.tsx`               | Full Tailwind rewrite                                                  |
| `frontend/src/pages/admin/UserList/UserListPage.tsx`                 | Full Tailwind rewrite                                                  |
| `frontend/src/pages/inspector/ProjectList/ProjectListPage.tsx`       | Full Tailwind rewrite                                                  |
| `frontend/src/pages/inspector/FarmerList/FarmerListPage.tsx`         | Full Tailwind rewrite                                                  |
| `frontend/src/pages/inspector/InspectionForm/InspectionFormPage.tsx` | Full Tailwind rewrite                                                  |
| `frontend/src/pages/records/RecordListPage.tsx`                      | Full Tailwind rewrite                                                  |
| `frontend/src/pages/records/RecordDetailPage.tsx`                    | Full Tailwind rewrite                                                  |
| `frontend/src/pages/profile/ProfilePage.tsx`                         | Full Tailwind rewrite                                                  |

### Files to CREATE (new components)

| File                                                | Purpose                                           |
| --------------------------------------------------- | ------------------------------------------------- |
| `frontend/src/components/layout/SidebarContext.tsx` | Sidebar open/close state (React Context)          |
| `frontend/src/components/layout/TopBar.tsx`         | Sticky top navigation bar                         |
| `frontend/src/components/layout/Sidebar.tsx`        | Responsive sidebar (desktop fixed, mobile drawer) |
| `frontend/src/components/layout/AppShell.tsx`       | Layout wrapper (TopBar + Sidebar + content)       |
| `frontend/src/components/ui/Toast.tsx`              | Toast notification system (React Portal)          |
| `frontend/src/components/ui/Dialog.tsx`             | Modal dialog system (React Portal)                |
| `frontend/src/components/ui/DatePicker.tsx`         | Native datetime-local wrapper                     |
| `frontend/src/components/ui/EmptyState.tsx`         | Empty state placeholder                           |
| `frontend/src/components/ui/StatusTag.tsx`          | Inspection status badge                           |
| `frontend/src/components/ui/LoadingSpinner.tsx`     | CSS-only spinner                                  |
| `frontend/src/hooks/usePullToRefresh.ts`            | Touch event pull-to-refresh hook                  |
| `frontend/src/hooks/useInfiniteScroll.ts`           | IntersectionObserver infinite scroll hook         |

### Files UNCHANGED (no modifications needed)

| File                   | Reason                                   |
| ---------------------- | ---------------------------------------- |
| `frontend/src/api/*`   | API layer uses Axios, no UI dependency   |
| `frontend/src/store/*` | Zustand stores, no UI dependency         |
| `frontend/src/utils/*` | Utility functions, no UI dependency      |
| `backend/**`           | Backend unchanged, only frontend rewrite |

## Key Technical Decisions

### TD1: Tailwind CSS v4 (not v3)

Tailwind v4 uses CSS-first config via `@theme` directive, eliminating `tailwind.config.ts`. The `@tailwindcss/vite` plugin provides HMR and automatic content detection. Bundle size: removing antd-mobile (~200KB gzipped) → Tailwind purged (~10-30KB).

### TD2: Lucide React (Font Icons)

Lucide React provides lightweight SVG icon components (~0.5KB per icon, tree-shakeable).
Includes 1000+ icons covering all UI needs (navigation, actions, status, file operations).
Alternatives: Heroicons (fewer icons), React Icons (too heavy), Font Awesome (CSS-based).

### TD3: AppShell Layout Pattern

Single responsive layout component using Tailwind breakpoint classes:

- Desktop (≥1024px): Fixed left sidebar `w-64 bg-navy`, content area `lg:ml-64`
- Mobile (<1024px): Hamburger icon → slide-in drawer with `bg-black/50` backdrop overlay
- State: React Context (`SidebarContext`) + `useMediaQuery('lg')` for auto-detect

### TD4: No UI Component Library

Build minimal UI primitives (Toast, Dialog, DatePicker, StatusTag, LoadingSpinner, EmptyState) using React Portals + Tailwind CSS animations. Zero external UI dependencies beyond Lucide React for icons.

### TD5: Design Aesthetic — State Grid (国家电网)

Color palette: Navy #0B3D91 (primary), Teal #00A8CC (accent), Gold #D4A843 (highlight), White/Gray backgrounds. Professional, authoritative feel. Font: Noto Sans SC (Chinese-optimized). Applied via Tailwind `@theme` block in `index.css`.

### TD6: Object Storage — MinIO/OSS

Backend handles all file operations. Frontend uploads compressed photos via API, backend adds watermark and stores in MinIO (dev) or 阿里云OSS (prod). PDF reports generated server-side with iTextPDF, stored in same object storage.

## Complexity Tracking

No constitution violations. All principles satisfied by design decisions above.
