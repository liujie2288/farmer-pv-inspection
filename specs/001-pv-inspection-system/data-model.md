# Data Model: 光伏巡检系统

**Branch**: `001-pv-inspection-system` | **Date**: 2026-04-25

## Entity Relationship Overview

```text
sys_user ──< inspect_plan (creator)          sys_user ──< inspect_record (inspector)
                │                                          │
                └──< inspect_plan_project                  │
                        │                                  │
project ──< inspect_plan_project ──> inspect_plan           │
  │                                                         │
  ├──< station ──< inspect_record <─────────────────────────┘
  │        │
  │        └── last_inspect_record_id → inspect_record
  │
  ├──< inspect_device
  │
  └──< inspect_record

inspect_section ──< inspect_section_item (6 sections, 77 items)

inspect_checklist_template (deprecated, replaced by inspect_section + inspect_section_item)

export_task ──> inspect_plan
           ──> sys_user (operator)
```

## Entities

### sys_user (用户表)

| Field | Type | PK | Nullable | Default | Notes |
|-------|------|----|----------|---------|-------|
| id | BIGINT | YES | NO | AUTO_INCREMENT | 用户唯一标识 |
| username | VARCHAR(30) | NO | NO | - | 登录账号，唯一 |
| password | VARCHAR(60) | NO | NO | - | 加密存储 |
| real_name | VARCHAR(20) | NO | YES | NULL | 真实姓名 |
| phone | VARCHAR(20) | NO | YES | NULL | 联系电话 |
| role | VARCHAR(30) | NO | NO | 'inspector' | admin / inspector |
| status | TINYINT | NO | NO | 1 | 1=正常, 0=禁用 |
| need_reset_pwd | TINYINT | NO | NO | 1 | 是否强制修改密码: 1=是, 0=否 |
| create_time | DATETIME | NO | NO | CURRENT_TIMESTAMP | 创建时间 |
| update_time | DATETIME | NO | NO | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**Indexes**: `uk_username UNIQUE (username)`

**State Transitions**:
- need_reset_pwd: 1 → 0 (首次修改密码后)
- status: 1 → 0 (管理员禁用), 0 → 1 (管理员启用)

### project (项目表)

| Field | Type | PK | Nullable | Default | Notes |
|-------|------|----|----------|---------|-------|
| id | BIGINT | YES | NO | AUTO_INCREMENT | 项目唯一标识 |
| project_name | VARCHAR(100) | NO | NO | - | 项目名称，唯一 |
| property_company | VARCHAR(100) | NO | NO | - | 产权公司 |
| station_type | VARCHAR(50) | NO | NO | - | 电站类型 |
| province | VARCHAR(10) | NO | YES | NULL | 省份 |
| city | VARCHAR(20) | NO | YES | NULL | 城市 |
| drone_certificate_url | VARCHAR(255) | NO | YES | NULL | 民用无人机驾驶合格证图片地址 |
| special_operation_cert_url | VARCHAR(255) | NO | YES | NULL | 特种作业操作证图片地址 |
| create_time | DATETIME | NO | NO | CURRENT_TIMESTAMP | 创建时间 |
| update_time | DATETIME | NO | NO | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**Indexes**: `uk_project_name UNIQUE (project_name)`

**Business Rules**:
- 删除项目前MUST先删除所有关联电站和检测设备

### station (电站表)

| Field | Type | PK | Nullable | Default | Notes |
|-------|------|----|----------|---------|-------|
| id | BIGINT | YES | NO | AUTO_INCREMENT | 电站唯一标识 |
| project_id | BIGINT | NO | NO | - | 所属项目ID (FK → project.id) |
| station_code | VARCHAR(50) | NO | NO | - | 电站编号，全局唯一 |
| owner_name | VARCHAR(30) | NO | NO | - | 户主姓名 |
| address | VARCHAR(255) | NO | YES | NULL | 装机地址 |
| power_account | VARCHAR(50) | NO | YES | NULL | 发电户号 |
| inverter_sn | VARCHAR(50) | NO | YES | NULL | 逆变器序列号 |
| inverter_brand | VARCHAR(50) | NO | YES | NULL | 逆变器品牌型号 |
| module_spec | VARCHAR(100) | NO | YES | NULL | 组件规格型号 |
| module_count | INT | NO | YES | NULL | 组件块数 |
| capacity_kw | DECIMAL(10,2) | NO | YES | NULL | 装机容量(kW) |
| longitude | DECIMAL(12,8) | NO | YES | NULL | 经度坐标 |
| latitude | DECIMAL(12,8) | NO | YES | NULL | 纬度坐标 |
| status | TINYINT | NO | NO | 0 | 巡检状态: 0=未巡检, 1=已巡检 |
| last_inspect_record_id | BIGINT | NO | YES | NULL | 最后巡检记录ID (FK → inspect_record.id) |
| last_inspect_time | DATETIME | NO | YES | NULL | 最后巡检时间 |
| create_time | DATETIME | NO | NO | CURRENT_TIMESTAMP | 创建时间 |
| update_time | DATETIME | NO | NO | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**Indexes**:
- `uk_station_code UNIQUE (station_code)`
- `idx_project_id (project_id)`
- `idx_owner_name (owner_name)`
- `idx_status (status)`

**Business Rules**:
- 电站必须归属项目 (project_id NOT NULL)
- 删除电站时级联删除巡检记录和OSS照片
- last_inspect_record_id 在每次巡检提交后更新，指向最新巡检记录

### inspect_device (检测设备表)

| Field | Type | PK | Nullable | Default | Notes |
|-------|------|----|----------|---------|-------|
| id | BIGINT | YES | NO | AUTO_INCREMENT | 设备唯一标识 |
| project_id | BIGINT | NO | NO | - | 所属项目ID (FK → project.id) |
| device_name | VARCHAR(50) | NO | NO | - | 设备名称 |
| device_model | VARCHAR(50) | NO | YES | NULL | 设备型号 |
| create_time | DATETIME | NO | NO | CURRENT_TIMESTAMP | 创建时间 |
| update_time | DATETIME | NO | NO | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**Indexes**: `idx_project_id (project_id)`

**Business Rules**:
- 检测设备必须归属项目 (project_id NOT NULL)
- 删除项目前需先删除关联检测设备

### inspect_plan (巡检计划表)

| Field | Type | PK | Nullable | Default | Notes |
|-------|------|----|----------|---------|-------|
| id | BIGINT | YES | NO | AUTO_INCREMENT | 计划唯一标识 |
| plan_name | VARCHAR(30) | NO | NO | - | 计划名称 |
| start_time | DATE | NO | NO | - | 开始日期 |
| end_time | DATE | NO | NO | - | 结束日期 |
| status | TINYINT | NO | NO | 0 | 0=未开始, 1=进行中, 2=已结束 |
| creator_id | BIGINT | NO | NO | - | 创建人用户ID (FK → sys_user.id) |
| total_count | INT | NO | NO | 0 | 电站总数（关联项目下电站汇总） |
| inspected_count | INT | NO | NO | 0 | 已巡检总数（实时同步） |
| create_time | DATETIME | NO | NO | CURRENT_TIMESTAMP | 创建时间 |
| update_time | DATETIME | NO | NO | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**Indexes**:
- `idx_status (status)`
- `idx_creator_id (creator_id)`

**State Transitions**:
- status: 0(未开始) → 1(进行中) : 系统定时任务根据start_time自动切换
- status: 1(进行中) → 2(已结束) : 系统定时任务根据end_time自动切换，或管理员手动结束
- 仅status=0或1时可修改起止时间

**Business Rules**:
- 计划与项目为多对多关系，通过 inspect_plan_project 关联
- total_count 在关联项目变更时重新计算汇总
- inspected_count 由业务层在巡检提交时递增

### inspect_plan_project (计划-项目关联表)

| Field | Type | PK | Nullable | Default | Notes |
|-------|------|----|----------|---------|-------|
| id | BIGINT | YES | NO | AUTO_INCREMENT | 关联唯一标识 |
| plan_id | BIGINT | NO | NO | - | 关联计划ID (FK → inspect_plan.id) |
| project_id | BIGINT | NO | NO | - | 关联项目ID (FK → project.id) |
| total_count | INT | NO | NO | 0 | 该项目下电站总数 |
| inspected_count | INT | NO | NO | 0 | 该项目已巡检数 |
| create_time | DATETIME | NO | NO | CURRENT_TIMESTAMP | 创建时间 |
| update_time | DATETIME | NO | NO | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**Indexes**:
- `uk_plan_project UNIQUE (plan_id, project_id)` — 每个计划与项目仅关联一次
- `idx_plan_id (plan_id)`
- `idx_project_id (project_id)`

**Business Rules**:
- 唯一约束确保同一计划不会重复关联同一项目
- total_count 为该项目下的电站总数，在关联建立时快照
- inspected_count 由业务层在巡检提交时递增

### inspect_record (巡检记录表)

| Field | Type | PK | Nullable | Default | Notes |
|-------|------|----|----------|---------|-------|
| id | BIGINT | YES | NO | AUTO_INCREMENT | 记录唯一标识 |
| plan_id | BIGINT | NO | NO | - | 关联巡检计划ID (FK → inspect_plan.id) |
| plan_project_id | BIGINT | NO | NO | - | 关联计划项目ID (FK → inspect_plan_project.id) |
| project_id | BIGINT | NO | NO | - | 关联项目ID (FK → project.id) |
| station_id | BIGINT | NO | NO | - | 关联电站ID (FK → station.id) |
| inspector_id | BIGINT | NO | NO | - | 巡检员ID (FK → sys_user.id) |
| weather | VARCHAR(50) | NO | YES | NULL | 天气情况 |
| checklist_result | JSON | NO | YES | NULL | 6大分区检查结果（结构见下方） |
| photos | JSON | NO | YES | NULL | 照片地址列表（按分区分组） |
| longitude | DECIMAL(12,6) | NO | YES | NULL | 经度 |
| latitude | DECIMAL(12,6) | NO | YES | NULL | 纬度 |
| pdf_url | VARCHAR(255) | NO | YES | NULL | 报告PDF文件地址 |
| create_time | DATETIME | NO | NO | CURRENT_TIMESTAMP | 提交时间 |
| update_time | DATETIME | NO | NO | CURRENT_TIMESTAMP ON UPDATE | 修改时间 |

**Indexes**:
- `idx_plan_id (plan_id)`
- `idx_project_id (project_id)`
- `idx_station_id (station_id)`
- `idx_inspector_id (inspector_id)`
- `idx_plan_station (plan_project_id, station_id)` — 复合索引，加速按计划项目查询电站巡检

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
          "content": "组件外观整洁，应无破碎、弯曲、异物遮挡...",
          "itemType": 1,
          "result": "正常",
          "exceptionNote": ""
        },
        {
          "itemId": 10,
          "content": "边框必须接地，支架应连接良好...",
          "itemType": 2,
          "result": "正常",
          "measuredValue": { "groundResistance": 2.25, "contactResistance": 0.011 }
        },
        {
          "itemId": 101,
          "content": "组件航拍图",
          "itemType": 3,
          "photoUrls": ["https://oss.example.com/photo1.jpg"]
        }
      ]
    }
  ]
}
```

**photos JSON结构**:

```json
{
  "section_1": ["url1", "url2"],
  "section_2": ["url3"]
}
```

### inspect_section (巡检大项表)

| Field | Type | PK | Nullable | Default | Notes |
|-------|------|----|----------|---------|-------|
| id | BIGINT | YES | NO | AUTO_INCREMENT | 大项唯一标识 |
| section_no | TINYINT UNSIGNED | NO | NO | - | 大项序号(1-6)，同时用于排序，唯一 |
| section_name | VARCHAR(30) | NO | NO | - | 大项名称 |
| create_time | DATETIME | NO | NO | CURRENT_TIMESTAMP | 创建时间 |
| update_time | DATETIME | NO | NO | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**Indexes**: `uk_section_no UNIQUE (section_no)`

**初始数据** (6条固定记录):

| id | section_no | section_name |
|----|------------|--------------|
| 1 | 1 | 光伏组件 |
| 2 | 2 | 支架 |
| 3 | 3 | 逆变器 |
| 4 | 4 | 配电箱 |
| 5 | 5 | 接地与防雷系统 |
| 6 | 6 | 采集装置及电缆 |

### inspect_section_item (巡检小项表)

| Field | Type | PK | Nullable | Default | Notes |
|-------|------|----|----------|---------|-------|
| id | BIGINT | YES | NO | AUTO_INCREMENT | 小项唯一标识 |
| section_id | BIGINT | NO | NO | - | 所属大项ID (FK → inspect_section.id) |
| category | VARCHAR(20) | NO | YES | NULL | 类别（基础/支架/电缆/采集装置等） |
| item_no | TINYINT UNSIGNED | NO | NO | - | 小项序号（大项内） |
| content | VARCHAR(500) | NO | NO | - | 巡检内容描述 |
| item_type | TINYINT | NO | NO | 1 | 事项类型: 1=正常/异常, 2=实测值, 3=照片 |
| create_time | DATETIME | NO | NO | CURRENT_TIMESTAMP | 创建时间 |
| update_time | DATETIME | NO | NO | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**Indexes**: `uk_section_item UNIQUE (section_id, item_no)`

**item_type 说明**:
- 1 (正常/异常): 选择型，巡检员标记"正常"或"异常"，异常时需填写备注
- 2 (实测值): 数值输入型，需填写接地电阻、接触电阻等测量数值
- 3 (照片): 照片上传型，巡检员需上传对应照片

**初始数据** (77条记录，6大项):

| section_id | section_name | 常规项(1-13) | 照片项(101+) | 合计 |
|------------|--------------|-------------|-------------|------|
| 1 | 光伏组件 | 11 | 4 | 15 |
| 2 | 支架 | 12 | 2 | 14 |
| 3 | 逆变器 | 13 | 3 | 16 |
| 4 | 配电箱 | 13 | 1 | 14 |
| 5 | 接地与防雷系统 | 6 | 2 | 8 |
| 6 | 采集装置及电缆 | 9 | 1 | 10 |
| **合计** | | **64** | **13** | **77** |

### export_task (导出任务表)

| Field | Type | PK | Nullable | Default | Notes |
|-------|------|----|----------|---------|-------|
| id | BIGINT | YES | NO | AUTO_INCREMENT | 任务ID |
| plan_id | BIGINT | NO | NO | - | 关联巡检计划ID (FK → inspect_plan.id) |
| operator_id | BIGINT | NO | NO | - | 操作人ID (FK → sys_user.id) |
| status | TINYINT | NO | NO | 0 | 0=处理中, 1=已完成, 2=失败 |
| file_url | VARCHAR(500) | NO | YES | NULL | OSS下载链接 |
| file_size | BIGINT | NO | YES | NULL | 文件大小(bytes) |
| total_count | INT | NO | NO | 0 | 导出总份数 |
| export_type | TINYINT | NO | NO | 0 | 导出类型: 0=PDF报告ZIP, 1=照片ZIP |
| processed_count | INT | NO | NO | 0 | 已处理数 |
| error_message | VARCHAR(500) | NO | YES | NULL | 失败原因 |
| create_time | DATETIME | NO | NO | CURRENT_TIMESTAMP | 创建时间 |
| complete_time | DATETIME | NO | YES | NULL | 完成时间 |

**Indexes**:
- `idx_plan_id (plan_id)`
- `idx_operator_id (operator_id)`
- `idx_status (status)`

**Business Rules**:
- 导出为异步任务，Spring @Async + ThreadPool 处理
- processed_count / total_count 用于展示进度百分比
- export_type=0 时生成 PDF ZIP，export_type=1 时生成照片 ZIP

### inspect_checklist_template (检查项模板表) — **已废弃**

> **Deprecated**: 此表已被 `inspect_section` + `inspect_section_item` 两表结构替代。
> 旧设计为单表扁平存储（含 section_no/section_name 冗余字段），新设计将大项和小项拆分为独立的父子表，
> 新增 item_type 字段区分正常/异常(1)、实测值(2)、照片(3)三种检查项类型。
> 保留此表仅用于历史数据参考，新功能MUST使用 inspect_section / inspect_section_item。

## Entity Relationships

```text
sys_user (1) ──< (N) inspect_plan        (creator_id: 用户创建的巡检计划)
sys_user (1) ──< (N) inspect_record      (inspector_id: 用户提交的巡检记录)
sys_user (1) ──< (N) export_task         (operator_id: 用户发起的导出任务)

project (1) ──< (N) station              (project_id: 项目下的电站)
project (1) ──< (N) inspect_device       (project_id: 项目下的检测设备)
project (1) ──< (N) inspect_record       (project_id: 冗余字段，加速查询)
project (N) >──< (N) inspect_plan        (通过 inspect_plan_project 多对多关联)

station (1) ──< (N) inspect_record       (station_id: 电站的巡检记录)

inspect_plan (1) ──< (N) inspect_plan_project  (plan_id: 计划关联的项目)
inspect_plan (1) ──< (N) inspect_record        (plan_id: 计划下的巡检记录)
inspect_plan (1) ──< (N) export_task           (plan_id: 计划的导出任务)

inspect_plan_project (1) ──< (N) inspect_record (plan_project_id: 计划项目下的巡检记录)

inspect_section (1) ──< (N) inspect_section_item (section_id: 大项下的小项)
```
