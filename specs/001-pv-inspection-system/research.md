# Research: 光伏巡检系统

**Branch**: `001-pv-inspection-system` | **Date**: 2026-04-20

## R1: 结构化巡检数据存储方案

**Decision**: 采用JSON字段存储巡检检查项结果，配合检查项模板表

巡检清单为固定6大分区64项，每项包含巡检结果（正常/异常）、异常说明、
检测数值。存储方案：
- `inspect_checklist_template` 表存储64项检查项定义（分区、序号、内容、
  是否需要数值输入）
- `inspect_record` 表的主 `checklist_result` 字段以JSON格式存储每项结果
- 前端根据模板渲染表单，提交时将结果序列化为JSON

**Rationale**: JSON字段避免64列宽表，查询时可通过MySQL 8.0的JSON函数
按分区过滤统计异常项。模板表支持未来扩展。

**Alternatives considered**:
- 64列宽表：列过多，新增检查项需DDL变更
- 独立结果表（每项一行）：64×记录数=数据量爆炸，查询性能差

## R2: 照片压缩与水印

**Decision**: 前端Canvas压缩 + 后端水印叠加

- 前端：使用Canvas API将照片压缩至宽度1920px、质量0.7，控制在500KB以内
- 后端：使用Java ImageIO/Graphics2D在照片上叠加文本水印
  （巡检人姓名、时间、经纬度），水印位于照片右下角，半透明白色文字
- 压缩后上传至MinIO/OSS，原始文件不保留

**Rationale**: 前端压缩减少上传带宽和耗时（户外弱网场景），后端水印
确保不可篡改（前端水印可被绕过）。

**Alternatives considered**:
- 纯前端压缩+水印：水印可被技术手段去除，不符合防篡改要求
- 纯后端压缩+水印：需先上传原图（3-5MB），弱网下上传耗时过长

## R3: 认证方案

**Decision**: Spring Security + JWT Token

- 登录成功后签发JWT Token（包含用户ID、角色、过期时间）
- 前端Axios拦截器自动携带Token（Authorization: Bearer header）
- 后端Spring Security过滤器校验Token有效性
- Token有效期：2小时，过期后前端跳转登录页
- 密码存储：MD5+盐值（BCrypt更安全但PRD指定MD5）

**Rationale**: JWT无状态，适合前后端分离架构，不依赖Session存储。
Spring Security原生支持JWT过滤器链。

**Alternatives considered**:
- Session+Cookie：需要Session共享（多实例部署时），增加复杂度
- OAuth2：系统为内部使用，无需第三方登录

## R4: 异步导出方案

**Decision**: Spring @Async + ThreadPoolTaskExecutor + 数据库任务状态表

- 管理员提交导出请求 → 创建导出任务记录（状态：处理中）
- Spring异步线程执行：iTextPDF逐份生成 → 流式写入ZIP → 上传至OSS
- 完成后更新任务状态为"已完成"，记录下载链接
- 前端轮询任务状态或WebSocket推送通知
- OSS文件7天过期自动清理

**Rationale**: 简单可靠，不需要引入Quartz等重量级框架（SDD提到Quartz
但当前导出场景不需要定时调度，线程池足够）。

**Alternatives considered**:
- Quartz定时任务：过于重量级，导出是即时触发而非定时
- 消息队列（RabbitMQ）：增加基础设施复杂度，当前规模不需要

## R5: PDF巡检报告生成

**Decision**: iTextPDF + HTML模板

- 使用iTextPDF的HTML to PDF功能，通过HTML模板填充数据生成PDF
- 模板参照report.pdf格式：电站基础信息 → 6大分区检查结果表格 → 照片
- 单户预览：实时生成PDF流返回前端，PDF.js在线渲染
- 批量导出：逐份生成PDF写入ZIP流

**Rationale**: HTML模板比纯Java API构建PDF更易维护，模板可由前端
开发人员调整排版。iTextPDF是Java生态最成熟的PDF库。

**Alternatives considered**:
- JasperReports：学习曲线高，模板设计需专用工具
- Apache POI：主要用于Office文档，PDF支持有限

## R6: 前端状态管理

**Decision**: Zustand + React Context

- Zustand管理全局状态（用户信息、Token、权限）
- React Context管理页面级状态（项目列表、农户列表等）
- 表单状态（巡检填报）使用React Hook Form管理

**Rationale**: Zustand轻量（~1KB），API简洁，TypeScript友好。
相比Redux减少了样板代码，适合中等规模应用。

**Alternatives considered**:
- Redux Toolkit：功能完善但对此规模应用过于重
- 纯Context：跨组件状态传递时性能问题（不必要的re-render）

## R7: 农户批量导入方案

**Decision**: EasyExcel读取 + 后端校验 + 批量插入

- 前端上传Excel文件（.xlsx），后端使用EasyExcel流式读取
- 逐行校验：农户编号唯一性、必填字段完整性、数据格式
- 校验失败返回错误明细（行号+错误原因）
- 校验通过后使用MyBatis-Plus的saveBatch批量插入（分批500条）

**Rationale**: EasyExcel是阿里开源的轻量Excel库，内存占用低，
适合大文件处理。流式读取避免OOM。

**Alternatives considered**:
- Apache POI：内存占用大，大文件容易OOM
- 前端解析Excel后提交JSON：大文件前端解析性能差

## R8: 数据库迁移管理

**Decision**: Flyway

- SQL脚本放在 `src/main/resources/db/migration/`
- 命名规范：`V1__create_sys_user.sql`, `V2__create_project.sql`...
- 每个迁移包含UP和对应回滚说明（Flyway社区版不支持自动DOWN，
  回滚通过新迁移脚本实现）

**Rationale**: Flyway是SpringBoot生态最成熟的迁移工具，
与SpringBoot自动集成，启动时自动执行未应用的迁移。

**Alternatives considered**:
- Liquibase：XML/YAML格式迁移脚本可读性差
- 手动SQL：无法追踪版本，团队协作易冲突

## R9: 移动端定位方案

**Decision**: 浏览器Geolocation API + 高精度模式

- 使用 `navigator.geolocation.getCurrentPosition` 获取GPS坐标
- 启用 `enableHighAccuracy: true` 获取最佳精度
- 设置超时10秒，失败时提示手动输入
- 精度低于5米时提示巡检员手动微调
- 移动端浏览器自动调用GPS+北斗双模定位

**Rationale**: 无需原生能力，纯Web API即可满足需求。
现代手机浏览器Geolocation API已支持多星座定位。

**Alternatives considered**:
- 原生APP定位：需要开发原生应用，成本高
- 第三方定位SDK：引入额外依赖，增加复杂度

## R10: Tailwind CSS v4 + Vite Setup

**Decision**: Use Tailwind CSS v4 with `@tailwindcss/vite` plugin.

**Rationale**: Tailwind v4 uses CSS-first config via `@theme` directive, eliminating `tailwind.config.ts`. The Vite plugin provides HMR and automatic content detection without PurgeCSS config. Bundle size reduction: removing antd-mobile (~200KB gzipped) and replacing with Tailwind (~10-30KB purged).

**Alternatives considered**:
- Tailwind v3 (PostCSS plugin) — more config boilerplate, older approach
- UnoCSS — faster but smaller ecosystem

## R11: Responsive Sidebar Navigation

**Decision**: Single `AppShell` component with responsive Tailwind classes.

**Rationale**: Desktop (≥1024px): fixed left sidebar `w-64`, always visible. Mobile (<1024px): hamburger icon triggers slide-in drawer with backdrop overlay. State managed via React Context + `useMediaQuery` hook.

**Alternatives considered**:
- Headless UI Dialog — adds dependency for simple slide-in
- Radix UI — full component library, contradicts zero-library approach

## R12: Date/Time Picker (No Library)

**Decision**: Native `<input type="datetime-local">` with Tailwind styling.

**Rationale**: Native pickers provide platform-optimized UX on mobile and desktop. Zero JS overhead. Tailwind handles visual chrome.

**Alternatives considered**:
- react-datepicker — heavy, poor mobile UX
- Custom scroll picker — complex, device-specific bugs

## R13: Toast & Dialog System (No Library)

**Decision**: Build via React portals + Tailwind CSS animations.

**Rationale**: Toast = fixed container with slide-down animation + auto-dismiss timer (~60 lines). Dialog = portal with backdrop (`bg-black/50`), centered card with fade-in animation (~80 lines). No dependency needed.

**Alternatives considered**:
- react-hot-toast / sonner — adds dependency, limited customization

## R14: Form Validation (No Library)

**Decision**: HTML5 native validation + Tailwind error states.

**Rationale**: HTML5 `required`, `minLength`, `pattern` handle basic validation. Custom logic (checklist completion) uses React state. Error display: red border + message below field via Tailwind classes.

**Alternatives considered**:
- react-hook-form — overkill for this project's form complexity
- Formik — deprecated pattern, heavy

## R15: Font Icon Library

**Decision**: Lucide React — lightweight SVG icon components

- Lucide React 提供 1000+ 个精心设计的 SVG 图标组件
- Tree-shakeable，仅打包使用的图标（每个图标 ~0.5KB）
- 基于 React 组件，支持 `size`、`color`、`strokeWidth` 等 props
- 覆盖项目所有图标需求：导航 (Home, FolderOpen, Calendar, User)、
  操作 (Plus, Search, Upload, Download, Trash2, Edit)、
  状态 (CheckCircle, XCircle, AlertTriangle, Clock)、
  文件 (FileText, Image, File)、
  界面 (Menu, X, ChevronLeft, ChevronRight, Eye, RefreshCw)

**Rationale**: Lucide React 是 Feather Icons 的社区继承版本，图标风格
简洁一致，与 Tailwind CSS 实用类风格契合。纯 React 组件，无需额外
CSS 文件，与 antd-mobile 的图标 API 不同但迁移成本低。

**Alternatives considered**:
- Heroicons: 由 Tailwind CSS 团队开发，图标数量较少 (~300个)
- React Icons: 包含多个图标库，包体积大 (~2MB)，包含大量不需要的图标
- Font Awesome (react-fontawesome): CSS 字体图标方案，需额外加载字体文件
- 自定义 SVG 图标: 开发成本高，维护负担重
