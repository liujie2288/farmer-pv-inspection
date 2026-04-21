# Tasks: Tailwind CSS 全量重写前端

**Input**: Design documents from `/specs/001-pv-inspection-system/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Phase 1: Setup (基础设施迁移)

**Purpose**: 移除 antd-mobile，安装 Tailwind CSS v4 + Lucide React，配置设计系统

- [ ] T001 Remove antd-mobile from package.json: `cd frontend && npm uninstall antd-mobile`
- [ ] T002 [P] Install Tailwind CSS v4 + Vite plugin + Lucide React icons: `cd frontend && npm install tailwindcss @tailwindcss/vite lucide-react`
- [ ] T003 [P] Configure Vite plugin in `frontend/vite.config.ts` — add `@tailwindcss/vite` to plugins array
- [ ] T004 Create Tailwind CSS entry in `frontend/src/index.css` — add `@import "tailwindcss"` + `@theme` block with design tokens: navy `#0B3D91`, teal `#00A8CC`, gold `#D4A843`, Chinese fonts `Noto Sans SC`. Define custom color utilities (`bg-navy`, `text-teal`, `border-gold`) and animation keyframes (`slide-down`, `fade-in`, `spin`)
- [ ] T005 [P] Update `frontend/src/main.tsx` — replace `import './styles/theme.css'` with `import './index.css'`
- [ ] T006 [P] Delete `frontend/src/styles/theme.css` — replaced by Tailwind @theme config
- [ ] T007 [P] Delete `frontend/src/components/AdminLayout.tsx` — replaced by AppShell
- [ ] T008 [P] Delete `frontend/src/components/InspectorLayout.tsx` — replaced by AppShell
- [ ] T009 [P] Delete old component directories: `frontend/src/components/StatusTag/`, `frontend/src/components/EmptyState/`, `frontend/src/components/PhotoUploader/`, `frontend/src/components/LocationPicker/`, `frontend/src/components/InspectionChecklist/` — all replaced by new flat-file structure under `components/` and `components/ui/`

**Checkpoint**: Tailwind CSS configured, antd-mobile removed, Lucide React installed, project compiles (pages will break — expected)

---

## Phase 2: Foundational (共享 UI 组件 — 阻塞所有 User Story)

**Purpose**: 构建所有页面共享的布局系统和 UI 原语

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Layout System

- [ ] T010 Create sidebar context in `frontend/src/components/layout/SidebarContext.tsx` — React Context with `isOpen`, `toggle()`, `close()` state; include `useMediaQuery('(min-width: 1024px)')` hook to auto-detect desktop and close sidebar on mobile route changes
- [ ] T011 Create TopBar component in `frontend/src/components/layout/TopBar.tsx` — sticky top bar `h-14 bg-navy text-white flex items-center px-4 sticky top-0 z-30`; left: hamburger `Menu` icon button (Lucide) visible only on mobile `<lg:hidden`; center: system title "光伏巡检系统" using `font-bold text-lg`; right: user avatar with `ChevronDown` dropdown showing role badge and logout option visible on desktop `hidden lg:flex`
- [ ] T012 Create Sidebar component in `frontend/src/components/layout/Sidebar.tsx` — accepts `menuItems` prop (array of `{ icon: LucideIcon, label: string, path: string }`); desktop: `hidden lg:block fixed left-0 top-14 w-64 bg-navy h-[calc(100vh-3.5rem)] z-20 overflow-y-auto` with nav items using `flex items-center gap-3 px-6 py-3 text-white/70 hover:text-white hover:bg-white/10 transition` and active state `bg-white/15 text-white border-r-3 border-teal`; mobile: drawer overlay `lg:hidden fixed inset-0 z-40` with backdrop `bg-black/50` and slide-in panel `fixed left-0 top-0 h-full w-72 bg-navy transform transition-transform duration-300` + close button using `X` icon (Lucide)
- [ ] T013 Create AppShell component in `frontend/src/components/layout/AppShell.tsx` — wrapper combining TopBar + Sidebar + `<main>` content area (`lg:ml-64 mt-14 p-4 min-h-[calc(100vh-3.5rem)] bg-gray-50`); accepts `menuItems` prop passed to Sidebar; wraps children in `SidebarContext.Provider`; close sidebar on route change (mobile)
- [ ] T014 Update `frontend/src/router/index.tsx` — replace AdminLayout/InspectorLayout imports with AppShell; define admin menu items array (数据概览/Dashboard, 项目管理/Projects, 计划管理/Plans, 巡检记录/Records, 用户管理/Users, 个人中心/Profile) with Lucide icons (LayoutDashboard, FolderOpen, Calendar, ClipboardList, Users, UserCircle); define inspector menu items array (巡检首页/Home, 巡检记录/Records, 个人中心/Profile) with Lucide icons (Home, ClipboardList, UserCircle); wrap admin routes in AppShell with admin menu, inspector routes in AppShell with inspector menu

### UI Primitives

- [ ] T015 [P] Create Toast system in `frontend/src/components/ui/Toast.tsx` — React portal rendered to `document.body`, fixed container `fixed top-4 left-1/2 -translate-x-1/2 z-50`; toast card `bg-white rounded-xl shadow-lg px-5 py-3 flex items-center gap-3 animate-[slide-down_0.3s_ease-out]`; icon variants: success=`CheckCircle` green, fail=`XCircle` red, info=`Info` blue (Lucide icons); auto-dismiss 3s timer; export `showToast({ icon, content })` function using `useState` array; max 3 toasts visible
- [ ] T016 [P] Create Dialog component in `frontend/src/components/ui/Dialog.tsx` — React portal with backdrop `fixed inset-0 bg-black/50 z-40 flex items-center justify-center animate-[fade-in_0.2s_ease-out]`; dialog card `bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl`; title `text-lg font-bold text-navy`; content area; actions row with cancel/confirm buttons using Tailwind (`bg-gray-100 text-gray-700 px-4 py-2 rounded-lg` / `bg-teal text-white px-4 py-2 rounded-lg`); export `showDialog({ title, content, actions })` and `confirm({ content })` returning Promise<boolean>
- [ ] T017 [P] Create DatePicker component in `frontend/src/components/ui/DatePicker.tsx` — wrapper around native `<input type="datetime-local">` with Tailwind styling: `w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal focus:border-teal outline-none transition`; accept `label`, `value`, `onChange`, `min`, `max` props
- [ ] T018 [P] Create EmptyState component in `frontend/src/components/ui/EmptyState.tsx` — centered placeholder `flex flex-col items-center justify-center py-16 text-gray-400`; accepts `icon` (Lucide component), `message` string; renders icon `w-16 h-16 mb-4 text-gray-300` + message `text-base`
- [ ] T019 [P] Create StatusTag component in `frontend/src/components/ui/StatusTag.tsx` — inline badge; inspected=`bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full text-xs font-medium`; not inspected=`bg-gray-100 text-gray-500 px-2.5 py-0.5 rounded-full text-xs font-medium`; accept `inspected: boolean` prop
- [ ] T020 [P] Create LoadingSpinner component in `frontend/src/components/ui/LoadingSpinner.tsx` — CSS-only spinner: outer `flex items-center justify-center py-8`; spinner element `w-8 h-8 border-4 border-gray-200 border-t-teal rounded-full animate-spin`; accept `size` prop default `md` (sm=6, md=8, lg=12)

**Checkpoint**: Layout system working (responsive sidebar + topbar), all UI primitives available, app renders with navigation but empty pages

---

## Phase 3: User Story 5 — 用户登录 (Priority: P5) 🎯 Entry Point

**Goal**: 用户通过用户名密码登录，首次登录强制改密，根据角色跳转对应首页

**Independent Test**: 打开 /login，输入 admin/admin123，登录后跳转到管理端首页；首次登录用户被强制要求修改密码

- [ ] T021 [US5] Rewrite LoginPage in `frontend/src/pages/login/LoginPage.tsx` — full-screen gradient background `min-h-screen bg-gradient-to-br from-navy via-[#0a2a5e] to-[#061a3a] flex items-center justify-center p-4`; centered white card `bg-white rounded-2xl shadow-2xl max-w-md w-full p-8`; header with lightning bolt SVG icon `⚡` + title "光伏巡检系统" in navy; form fields using native `<input>` with Tailwind `w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal focus:border-teal outline-none text-base`; username field with `User` icon prefix (Lucide); password field with `Lock` icon prefix + `Eye`/`EyeOff` toggle; login button `w-full bg-gradient-to-r from-teal to-[#0090b0] text-white py-3.5 rounded-lg font-bold text-base hover:shadow-lg transition`; first-login password change modal using new Dialog component; all error/success feedback via new `showToast`
- [ ] T022 [US5] Update API integration in LoginPage — ensure `frontend/src/api/auth.ts` login call works with new form; handle `first_login` flag to show password change dialog; store token via Zustand persist store at key `pv-auth-storage`

**Checkpoint**: Login flow works end-to-end, first-login password change works, redirects to admin or inspector dashboard based on role

---

## Phase 4: User Story 1 — 巡检员完成农户巡检 (Priority: P1) 🎯 MVP Core

**Goal**: 巡检员登录后完成从选项目→选农户→填巡检→提交的全流程

**Independent Test**: 以 inspector1 登录，选择项目→农户列表→点击"巡检"→填写6大分区检查清单→上传照片→提交

- [ ] T023 [US1] Rewrite inspector ProjectListPage in `frontend/src/pages/inspector/ProjectList/ProjectListPage.tsx` — page title "巡检首页" with `text-xl font-bold text-navy`; project cards using `bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow cursor-pointer`; each card shows: project name `text-base font-bold text-navy`, company + type `text-sm text-gray-500`, farmer stats row with `Users` icon (Lucide) + count; completion rate progress bar `h-1.5 bg-gray-200 rounded-full overflow-hidden` with teal fill; click navigates to `/projects/:id/farmers`; empty state using EmptyState component with `FolderOpen` icon (Lucide); data from `frontend/src/api/project.ts`
- [ ] T024 [US1] Rewrite inspector FarmerListPage in `frontend/src/pages/inspector/FarmerList/FarmerListPage.tsx` — back navigation header with `ArrowLeft` icon (Lucide) + project name title + info button `Info` icon (Lucide) on right; stats summary bar `flex gap-4 bg-white rounded-xl p-3 mb-3 text-sm` showing total/inspected/uninspected counts; search input with `Search` icon (Lucide) prefix `w-full px-4 py-2.5 border rounded-lg`; status filter tabs `flex gap-2` with `全部`/`未巡检`/`已巡检` pill buttons; farmer list items `bg-white rounded-lg px-4 py-3 flex justify-between items-center border-b border-gray-50`; each item shows farmer code + name + StatusTag; "巡检" button `bg-teal text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-teal/90` (disabled=`bg-gray-200 text-gray-400 cursor-not-allowed` when no active plan); pull-to-refresh via touch events; project info drawer using Dialog; data from `frontend/src/api/farmer.ts` and `frontend/src/api/plan.ts`
- [ ] T025 [US1] Rewrite InspectionChecklist in `frontend/src/components/InspectionChecklist.tsx` — fetch checklist template from `frontend/src/api/inspection.ts`; render 6 sections, each with: section header `text-lg font-bold text-navy border-l-4 border-teal pl-3 my-4` + expand/collapse `ChevronDown`/`ChevronUp` icon (Lucide); items as `flex justify-between items-start py-2.5 px-2 border-b border-gray-50`; item content `text-sm text-gray-700`; normal/abnormal toggle buttons `px-4 py-1.5 rounded-lg text-sm font-medium` (normal=outline green, abnormal=outline red, selected=solid fill); numeric input fields inline `w-20 px-2 py-1 border rounded text-sm text-center` when `has_numeric=true`; exception note textarea `w-full mt-1 px-3 py-2 border rounded-lg text-sm` shown when abnormal selected; section photo upload area using PhotoUploader
- [ ] T026 [US1] Rewrite LocationPicker in `frontend/src/components/LocationPicker.tsx` — GPS display section `flex items-center gap-2 text-sm text-gray-600 bg-white rounded-lg p-3`; `MapPin` icon (Lucide); auto-fetch via `navigator.geolocation.getCurrentPosition` with `enableHighAccuracy: true, timeout: 10000`; coordinates display `font-mono text-teal`; manual refresh button with `RefreshCw` icon (Lucide); accuracy indicator `text-xs text-gray-400`; manual edit inputs for longitude/latitude `w-full px-3 py-2 border rounded-lg font-mono text-sm`; loading state with LoadingSpinner
- [ ] T027 [US1] Rewrite PhotoUploader in `frontend/src/components/ui/PhotoUploader.tsx` — keep existing Canvas compression logic from `frontend/src/utils/photo.ts`; dropzone area `border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-teal transition-colors cursor-pointer` with `Camera` icon (Lucide) + "点击上传照片"; preview grid `grid grid-cols-3 gap-2 mt-3`; thumbnail `relative aspect-square rounded-lg overflow-hidden bg-gray-100`; preview image `w-full h-full object-cover`; delete button overlay `absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center` with `X` icon (Lucide); max count limit display; compression status indicator during upload
- [ ] T028 [US1] Rewrite InspectionFormPage in `frontend/src/pages/inspector/InspectionForm/InspectionFormPage.tsx` — back button header with `ArrowLeft` icon (Lucide); farmer name + code as title `text-lg font-bold`; auto-filled info card `bg-white rounded-xl p-4 mb-4` showing project name, farmer name, plan name (all readonly, `text-gray-500`); station info section showing inverter SN, capacity, module specs from farmer data; GPS section using LocationPicker; InspectionChecklist component integration with `checklistData` state; submit button `sticky bottom-0 bg-gradient-to-r from-teal to-[#0090b0] text-white py-3.5 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition` with loading state; validation: all 64 items must have result, all abnormal items must have notes; submission via `frontend/src/api/inspection.ts`; success toast + navigate back to farmer list

**Checkpoint**: Inspector can complete full inspection flow: project list → farmer list → fill 6-section checklist → upload photos → submit → return to farmer list with updated status

---

## Phase 5: User Story 2 — 管理员管理项目与农户 (Priority: P2)

**Goal**: 管理员创建项目、批量导入农户、查看农户列表和统计、搜索筛选

**Independent Test**: 以 admin 登录，创建项目→导入农户Excel→查看列表→搜索→查看农户详情

- [ ] T029 [US2] Rewrite admin ProjectListPage in `frontend/src/pages/admin/ProjectList/ProjectListPage.tsx` — header with title "项目管理" + create button `bg-teal text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2` with `Plus` icon (Lucide); search input with `Search` icon; project cards showing name/company/type/farmer count/completion stats; click navigates to `/admin/projects/:id/farmers`; create dialog using new Dialog + native form inputs (project name, property company, station type); edit dialog similar; delete confirmation using `confirm()` from Dialog
- [ ] T030 [US2] Rewrite admin FarmerListPage in `frontend/src/pages/admin/FarmerList/FarmerListPage.tsx` — back nav with `ArrowLeft` + project name; stats summary bar (total/inspected/uninspected/completion rate); search input; status filter tabs `flex gap-2` (全部/未巡检/已巡检); farmer list with StatusTag per row; each row shows farmer code, name, power account, inverter SN, last inspection time; batch import button `bg-navy text-white px-4 py-2 rounded-lg flex items-center gap-2` with `Upload` icon (Lucide) opening file upload dialog; batch delete with `Trash2` icon (Lucide) + confirmation; load-more button at bottom for pagination; data export button `bg-gold text-white` with `Download` icon (Lucide)
- [ ] T031 [US2] Rewrite FarmerDetailPage in `frontend/src/pages/admin/FarmerList/FarmerDetailPage.tsx` — back nav; farmer info card `bg-white rounded-xl p-6` with farmer code, name, power account, inverter SN, module specs, capacity, project name; equipment details grid `grid grid-cols-2 gap-4`; inspection history list showing date, inspector name, plan name, status; click record navigates to record detail; empty history using EmptyState

**Checkpoint**: Admin can create projects, import farmers via Excel, search/filter farmers, view farmer details with inspection history

---

## Phase 6: User Story 3 — 管理员创建与管理巡检计划 (Priority: P3)

**Goal**: 管理员创建单项目/全局计划，查看计划状态和完成率，手动结束计划

**Independent Test**: 管理员创建计划→查看计划列表→点击计划查看详情→查看各项目排行→手动结束计划

- [ ] T032 [US3] Rewrite PlanListPage in `frontend/src/pages/admin/PlanList/PlanListPage.tsx` — header with title "计划管理" + create button with `Plus` icon (Lucide); search input; status filter tabs (全部/未开始/进行中/已结束) with status badge colors (未开始=`bg-blue-100 text-blue-700`, 进行中=`bg-teal/10 text-teal`, 已结束=`bg-gray-100 text-gray-500`); plan cards showing name, status badge, date range, project count, completion rate progress bar `h-2 bg-gray-200 rounded-full overflow-hidden` with teal fill width; create dialog with form fields: plan name input, start/end DatePicker, global plan checkbox, project multi-select when global; edit similar; finish button with `Square` icon (Lucide) + confirmation dialog
- [ ] T033 [US3] Rewrite PlanDetailPage in `frontend/src/pages/admin/PlanList/PlanDetailPage.tsx` — back nav with `ArrowLeft`; plan info card with name, status badge, date range, project scope; stats cards `grid grid-cols-3 gap-4` showing farmer total, inspected count, uninspected count with colored left border (`border-l-4 border-teal` / `border-l-4 border-green-500` / `border-l-4 border-gold`); completion rate circle or bar; project ranking list: each row shows rank badge (1=`bg-gold text-white`, 2=`bg-gray-400 text-white`, 3=`bg-amber-700 text-white`), project name, completion rate progress bar; export button for this plan; finish button `bg-red-600 text-white px-6 py-2.5 rounded-lg` (hidden when status=已结束)

**Checkpoint**: Admin can create single/global plans, view plan details with rankings, manually finish plans, export plan data

---

## Phase 7: User Story 4 — 管理员查看统计与导出 (Priority: P4)

**Goal**: 管理员首页展示全局统计、进行中计划、项目排行

**Independent Test**: Admin 登录后首页展示数据概览卡片、进行中计划列表、项目完成率排名

- [ ] T034 [US4] Rewrite DashboardPage in `frontend/src/pages/admin/Dashboard/DashboardPage.tsx` — dark navy header section `bg-navy text-white px-6 py-8 rounded-b-3xl` with title "数据概览" and current date; 2×2 stat cards `grid grid-cols-2 gap-4 -mt-6` (projects count, total farmers, inspected count, completion rate) each with colored left border `bg-white rounded-xl shadow-md p-4 border-l-4` (teal, green, gold, navy); stat value `text-2xl font-bold text-navy`, stat label `text-sm text-gray-500`; active plans section: list of plan cards with name, project count, completion bar, link to plan detail; project ranking: ordered list with position badges (1=gold `w-8 h-8 bg-gold text-white rounded-full flex items-center justify-center font-bold`, 2=silver `bg-gray-400`, 3=bronze `bg-amber-700`), project name, farmer count, completion rate bar; pull-to-refresh support; all data from `frontend/src/api/stats.ts`

**Checkpoint**: Admin dashboard shows live statistics, active plans list, and project rankings with visual hierarchy

---

## Phase 8: User Story 6 — 巡检记录与个人中心 (Priority: P6)

**Goal**: 巡检员和管理员查看历史巡检记录，个人中心修改密码

**Independent Test**: 查看巡检记录列表→点击记录查看详情（含检查清单、照片、GPS）→个人中心查看信息/修改密码

- [ ] T035 [US6] Rewrite RecordListPage in `frontend/src/pages/records/RecordListPage.tsx` — page title "巡检记录"; search input with farmer name/plan name filter; record cards `bg-white rounded-xl shadow-sm p-4 border-l-4 border-teal` showing: farmer name + code `font-bold`, plan name, inspector name, inspection date `text-sm text-gray-500`, status indicator (normal=`CheckCircle` green, abnormal items count red `AlertTriangle`); infinite scroll via IntersectionObserver using `useInfiniteScroll` hook; empty state with `ClipboardList` icon (Lucide); admin sees all records, inspector sees only own records (filtered by API)
- [ ] T036 [US6] Rewrite RecordDetailPage in `frontend/src/pages/records/RecordDetailPage.tsx` — back nav with `ArrowLeft`; header card with farmer/project/plan info `bg-white rounded-xl p-5`; GPS section `flex items-center gap-2 text-sm` with `MapPin` icon + coordinates `font-mono text-teal`; checklist results by section using `<details>/<summary>` HTML elements with Tailwind: summary `cursor-pointer font-bold text-navy py-2 border-b flex items-center gap-2` + `ChevronRight`/`ChevronDown` icon (Lucide); items list with result badges (正常=`text-green-600 bg-green-50`, 异常=`text-red-600 bg-red-50`), exception notes in `bg-red-50 rounded p-2 text-sm text-red-700`, measured values `font-mono`; photo gallery `grid grid-cols-2 md:grid-cols-3 gap-3` with clickable thumbnails opening fullscreen preview; readonly indicator banner when plan status=已结束 `bg-gray-100 text-gray-500 px-4 py-2 rounded-lg text-center`
- [ ] T037 [US6] Rewrite ProfilePage in `frontend/src/pages/profile/ProfilePage.tsx` — user info card `bg-white rounded-xl p-6`: name, username, phone, role badge (admin=`bg-navy text-white`, inspector=`bg-teal text-white`); change password form with current password + new password + confirm password inputs using native `<input type="password">` with Tailwind styling, submit button `bg-teal text-white px-6 py-2.5 rounded-lg`; about section `bg-white rounded-xl p-6 mt-4` with system info; logout button at bottom `w-full bg-red-50 text-red-600 py-3.5 rounded-xl font-medium flex items-center justify-center gap-2` with `LogOut` icon (Lucide); works for both admin and inspector roles (menu items differ, page shared)

**Checkpoint**: Users can view inspection history with details, manage profile, change password, logout

---

## Phase 9: User Story 5 补充 — 用户管理 (Priority: P5)

**Goal**: 管理员管理用户账号（增删改查、角色分配、密码重置、启用/禁用）

**Independent Test**: Admin 进入用户管理→创建用户→分配角色→编辑→重置密码→禁用账号

- [ ] T038 [US5] Rewrite UserListPage in `frontend/src/pages/admin/UserList/UserListPage.tsx` — page title "用户管理" + create button with `Plus` icon (Lucide); search filter row with input + role dropdown + status dropdown; user list as cards on mobile / table rows on desktop `md:hidden`/`hidden md:block`; each user shows: real name, username, role badge (admin=`bg-navy/10 text-navy`, inspector=`bg-teal/10 text-teal`), status toggle switch `relative w-11 h-6 bg-gray-200 rounded-full cursor-pointer transition-colors` with sliding dot `absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform` (active=`bg-green-500 translate-x-5`), action buttons (edit `Edit` icon, reset password `KeyRound` icon, delete `Trash2` icon — all Lucide); create user dialog with native form inputs; edit user dialog; reset password confirmation using `confirm()` from Dialog; delete confirmation

**Checkpoint**: Admin can manage all user accounts with full CRUD, role assignment, password reset, status toggle

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: 响应式验证、性能优化、hooks、最终清理

- [ ] T039 [P] Add CSS keyframes to `frontend/src/index.css` — under `@theme` block: `slide-down` for Toast (from translateY(-20px) opacity(0) to translateY(0) opacity(1)), `fade-in` for Dialog (from opacity(0) to opacity(1)); spin keyframe already built-in via `animate-spin`
- [ ] T040 [P] Create usePullToRefresh hook in `frontend/src/hooks/usePullToRefresh.ts` — touch event handler: `touchstart` records startY, `touchmove` calculates pull distance (max 80px), `touchend` triggers refresh if threshold met; returns `{ pullDistance, isRefreshing, containerProps }` with CSS `transform translateY(${pullDistance}px) transition-transform`
- [ ] T041 [P] Create useInfiniteScroll hook in `frontend/src/hooks/useInfiniteScroll.ts` — IntersectionObserver-based: observes last element in list, triggers `loadMore` callback when visible; returns `{ lastElementRef, isLoading, hasMore }`; cleanup observer on unmount
- [ ] T042 Update `frontend/src/App.tsx` — ensure all route imports point to rewritten pages; remove any remaining antd-mobile imports; verify route guards for admin/inspector roles
- [ ] T043 [P] Verify all pages render correctly at 375px mobile breakpoint — test inspector flow end-to-end: login → project list → farmer list → inspection form → submit
- [ ] T044 [P] Verify all admin pages render correctly at 1280px desktop breakpoint — sidebar persistent at `w-64`, content area uses full width, table layouts visible
- [ ] T045 Clean up any remaining antd-mobile references — search entire `frontend/src/` for `antd-mobile` imports and remove; verify no residual CSS class dependencies

**Checkpoint**: All pages responsive, all antd-mobile removed, hooks extracted, app fully functional

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories
- **US5 Login (Phase 3)**: Depends on Phase 2 (needs Toast, Dialog, layout) — entry point for all flows
- **US1 Inspector (Phase 4)**: Depends on Phase 2 + Phase 3 (needs login to work)
- **US2 Admin Projects (Phase 5)**: Depends on Phase 2 + Phase 3
- **US3 Admin Plans (Phase 6)**: Depends on Phase 2 + Phase 3
- **US4 Dashboard (Phase 7)**: Depends on Phase 2 + Phase 3
- **US6 Records & Profile (Phase 8)**: Depends on Phase 2 + Phase 3
- **US5 Users (Phase 9)**: Depends on Phase 2 + Phase 3
- **Polish (Phase 10)**: Depends on all phases above

### Parallel Opportunities

- Phases 4–9 can run in **any order** after Phase 3 completes
- Within each phase, tasks marked [P] can run in parallel
- Recommended execution order for MVP: Phase 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10

### Within Each User Story

- Layout primitives before pages
- Shared components before page-specific components
- Core pages before secondary pages

---

## Parallel Example: Phase 2 Foundational

```text
# Layout system (sequential — each builds on previous):
T010 SidebarContext → T011 TopBar → T012 Sidebar → T013 AppShell → T014 Router

# UI primitives (all parallel — independent files):
T015 Toast | T016 Dialog | T017 DatePicker | T018 EmptyState | T019 StatusTag | T020 LoadingSpinner
```

## Parallel Example: Phase 4 US1 Inspector

```text
# After T023 (ProjectListPage) completes:
T024 FarmerListPage | T025 InspectionChecklist | T026 LocationPicker | T027 PhotoUploader

# Then sequentially:
T028 InspectionFormPage (depends on T025, T026, T027)
```

---

## Implementation Strategy

### MVP First (Phases 1–4)

1. Complete Phase 1: Setup (remove antd-mobile, install Tailwind + Lucide)
2. Complete Phase 2: Foundational (layout + UI primitives)
3. Complete Phase 3: Login
4. Complete Phase 4: Inspector full flow
5. **STOP and VALIDATE**: Test inspector login → project list → inspection → submit

### Full Delivery

5. Add Phase 5: Admin project management
6. Add Phase 6: Admin plan management
7. Add Phase 7: Admin dashboard
8. Add Phase 8: Records + profile
9. Add Phase 9: User management
10. Phase 10: Polish and responsive verification

---

## Notes

- All new components use Tailwind CSS utility classes + Lucide React icons — no antd-mobile imports
- Keep all files in `frontend/src/api/`, `frontend/src/store/`, `frontend/src/utils/` unchanged
- Design aesthetic: State Grid (国家电网) style — deep navy, teal accents, professional/authoritative
- Mobile breakpoint: `<1024px` (Tailwind `lg:` prefix), Desktop: `≥1024px`
- Use `frontend-design` plugin for creative direction on each page rewrite
- Lucide React icon imports: `import { IconName } from 'lucide-react'` — tree-shakeable
