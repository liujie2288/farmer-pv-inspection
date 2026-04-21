# Data Model: 光伏巡检系统

**Branch**: `001-pv-inspection-system` | **Date**: 2026-04-20

## Entity Relationship Overview

```text
sys_user ──< inspect_record >── inspect_plan
                                     |
farmer ──< inspect_record             |
  |                                   |
  └── project ──< inspect_plan        |
        |                             |
        └──< farmer                   |

inspect_checklist_template (standalone reference table)
```

## Entities

### sys_user (用户表)

| Field | Type | PK | Nullable | Default | Notes |
|-------|------|----|----------|---------|-------|
| id | BIGINT | YES | NO | AUTO_INCREMENT | 用户唯一标识 |
| username | VARCHAR(50) | NO | NO | - | 登录账号，唯一 |
| password | VARCHAR(100) | NO | NO | - | MD5+盐值加密 |
| real_name | VARCHAR(50) | NO | NO | - | 真实姓名 |
| phone | VARCHAR(20) | NO | YES | NULL | 联系电话 |
| role | VARCHAR(20) | NO | NO | 'inspector' | admin / inspector |
| status | TINYINT | NO | NO | 1 | 1=正常, 0=禁用 |
| first_login | TINYINT | NO | NO | 1 | 1=首次登录需改密 |
| create_time | DATETIME | NO | NO | CURRENT_TIMESTAMP | 创建时间 |
| update_time | DATETIME | NO | NO | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**Indexes**: `uk_username UNIQUE (username)`

**State Transitions**:
- first_login: 1 → 0 (首次修改密码后)
- status: 1 → 0 (管理员禁用), 0 → 1 (管理员启用)

### project (项目表)

| Field | Type | PK | Nullable | Default | Notes |
|-------|------|----|----------|---------|-------|
| id | BIGINT | YES | NO | AUTO_INCREMENT | 项目唯一标识 |
| project_name | VARCHAR(100) | NO | NO | - | 项目名称，唯一 |
| property_company | VARCHAR(100) | NO | NO | - | 产权公司 |
| station_type | VARCHAR(50) | NO | NO | - | 电站类型 |
| farmer_count | INT | NO | NO | 0 | 农户总数（实时同步） |
| create_time | DATETIME | NO | NO | CURRENT_TIMESTAMP | 创建时间 |
| update_time | DATETIME | NO | NO | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**Indexes**: `uk_project_name UNIQUE (project_name)`

**Business Rules**:
- 删除项目前MUST先删除所有关联农户
- farmer_count 由触发器或业务层在农户增删时同步更新

### farmer (农户表)

| Field | Type | PK | Nullable | Default | Notes |
|-------|------|----|----------|---------|-------|
| id | BIGINT | YES | NO | AUTO_INCREMENT | 农户唯一标识 |
| project_id | BIGINT | NO | NO | - | 所属项目ID (FK → project.id) |
| farmer_code | VARCHAR(50) | NO | NO | - | 农户编号，全局唯一 |
| farmer_name | VARCHAR(50) | NO | NO | - | 农户姓名 |
| power_account | VARCHAR(50) | NO | YES | NULL | 发电户号 |
| inverter_sn | VARCHAR(100) | NO | YES | NULL | 逆变器序列号 |
| inverter_brand | VARCHAR(100) | NO | YES | NULL | 逆变器品牌型号 |
| module_spec | VARCHAR(100) | NO | YES | NULL | 组件规格型号 |
| module_count | INT | NO | YES | NULL | 组件块数 |
| capacity_kw | DECIMAL(10,2) | NO | YES | NULL | 装机容量(kW) |
| status | TINYINT | NO | NO | 0 | 0=未巡检, 1=已巡检 |
| last_inspect_time | DATETIME | NO | YES | NULL | 最后巡检时间 |
| last_inspector_id | BIGINT | NO | YES | NULL | 最后巡检人ID (FK → sys_user.id) |
| create_time | DATETIME | NO | NO | CURRENT_TIMESTAMP | 创建时间 |
| update_time | DATETIME | NO | NO | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**Indexes**:
- `uk_farmer_code UNIQUE (farmer_code)`
- `idx_project_id (project_id)`
- `idx_farmer_name (farmer_name)`
- `idx_status (project_id, status)`

**Business Rules**:
- 农户必须归属项目 (project_id NOT NULL)
- 删除农户时级联删除巡检记录和OSS照片

### inspect_plan (巡检计划表)

| Field | Type | PK | Nullable | Default | Notes |
|-------|------|----|----------|---------|-------|
| id | BIGINT | YES | NO | AUTO_INCREMENT | 计划唯一标识 |
| plan_name | VARCHAR(100) | NO | NO | - | 计划名称 |
| project_id | BIGINT | NO | YES | NULL | 关联项目ID (NULL=全局计划父节点) |
| start_time | DATETIME | NO | NO | - | 开始时间 |
| end_time | DATETIME | NO | NO | - | 结束时间 |
| status | TINYINT | NO | NO | 0 | 0=未开始, 1=进行中, 2=已结束 |
| parent_id | BIGINT | NO | NO | 0 | 父计划ID (0=顶级计划) |
| farmer_count | INT | NO | NO | 0 | 计划下农户总数 |
| inspected_count | INT | NO | NO | 0 | 已巡检数（实时同步） |
| create_time | DATETIME | NO | NO | CURRENT_TIMESTAMP | 创建时间 |
| update_time | DATETIME | NO | NO | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**Indexes**:
- `idx_project_id (project_id)`
- `idx_parent_id (parent_id)`
- `idx_status (status)`
- `uk_project_active UNIQUE (project_id, status)` WHERE status=1
  (partial unique index ensuring only one active plan per project)

**State Transitions**:
- status: 0(未开始) → 1(进行中) : 系统定时任务根据start_time自动切换
- status: 1(进行中) → 2(已结束) : 系统定时任务根据end_time自动切换，或管理员手动结束
- 仅status=0或1时可修改起止时间

**Business Rules**:
- 同一project_id下，status=1的记录最多1条（唯一约束）
- 全局计划：project_id=NULL, parent_id=0
- 子计划：parent_id指向全局计划id，project_id为具体项目

### inspect_record (巡检记录表)

| Field | Type | PK | Nullable | Default | Notes |
|-------|------|----|----------|---------|-------|
| id | BIGINT | YES | NO | AUTO_INCREMENT | 记录唯一标识 |
| plan_id | BIGINT | NO | NO | - | 关联计划ID (FK → inspect_plan.id) |
| farmer_id | BIGINT | NO | NO | - | 关联农户ID (FK → farmer.id) |
| inspector_id | BIGINT | NO | NO | - | 巡检员ID (FK → sys_user.id) |
| project_id | BIGINT | NO | NO | - | 冗余字段，关联项目ID |
| checklist_result | JSON | NO | NO | - | 6大分区检查结果（结构见下方） |
| photo_urls | JSON | NO | YES | NULL | 照片地址列表（按分区分组） |
| longitude | DECIMAL(10,7) | NO | NO | - | 经度 |
| latitude | DECIMAL(10,7) | NO | NO | - | 纬度 |
| create_time | DATETIME | NO | NO | CURRENT_TIMESTAMP | 提交时间 |
| update_time | DATETIME | NO | NO | CURRENT_TIMESTAMP ON UPDATE | 修改时间 |

**Indexes**:
- `idx_plan_id (plan_id)`
- `idx_farmer_id (farmer_id)`
- `idx_inspector_id (inspector_id)`
- `uk_plan_farmer_inspector UNIQUE (plan_id, farmer_id, inspector_id)`

**checklist_result JSON结构**:

```json
{
  "sections": [
    {
      "sectionId": 1,
      "sectionName": "光伏组件",
      "items": [
        {
          "itemId": 1,
          "content": "组件外观整洁，应无破碎、弯曲...",
          "result": "正常",
          "exceptionNote": "",
          "measuredValue": null
        },
        {
          "itemId": 10,
          "content": "边框必须牢固接地...",
          "result": "正常",
          "exceptionNote": "",
          "measuredValue": { "groundResistance": 2.25, "contactResistance": 0.011 }
        }
      ]
    }
  ]
}
```

### inspect_checklist_template (检查项模板表)

| Field | Type | PK | Nullable | Default | Notes |
|-------|------|----|----------|---------|-------|
| id | BIGINT | YES | NO | AUTO_INCREMENT | 模板项ID |
| section_id | INT | NO | NO | - | 分区编号 (1-6) |
| section_name | VARCHAR(50) | NO | NO | - | 分区名称 |
| item_order | INT | NO | NO | - | 分区内序号 |
| content | TEXT | NO | NO | - | 检查内容描述 |
| category | VARCHAR(50) | NO | YES | NULL | 类别（支架分区用） |
| has_numeric | TINYINT | NO | NO | 0 | 是否需要数值输入 |
| numeric_labels | VARCHAR(200) | NO | YES | NULL | 数值字段标签(JSON数组) |
| has_photo | TINYINT | NO | NO | 0 | 该分区是否需要上传照片 |

**Indexes**: `idx_section_order (section_id, item_order)`

**初始数据**: 64条记录，对应report.pdf中的6大分区64项检查内容。
在Flyway迁移脚本中初始化。

### export_task (导出任务表)

| Field | Type | PK | Nullable | Default | Notes |
|-------|------|----|----------|---------|-------|
| id | BIGINT | YES | NO | AUTO_INCREMENT | 任务ID |
| plan_id | BIGINT | NO | NO | - | 关联巡检计划ID |
| operator_id | BIGINT | NO | NO | - | 操作人ID |
| status | TINYINT | NO | NO | 0 | 0=处理中, 1=已完成, 2=失败 |
| file_url | VARCHAR(500) | NO | YES | NULL | OSS下载链接 |
| file_size | BIGINT | NO | YES | NULL | 文件大小(bytes) |
| total_count | INT | NO | NO | 0 | 导出总份数 |
| error_message | VARCHAR(500) | NO | YES | NULL | 失败原因 |
| create_time | DATETIME | NO | NO | CURRENT_TIMESTAMP | 创建时间 |
| complete_time | DATETIME | NO | YES | NULL | 完成时间 |

**Indexes**: `idx_operator_id (operator_id)`, `idx_status (status)`
