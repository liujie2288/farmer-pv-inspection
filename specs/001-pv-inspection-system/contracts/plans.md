# Inspection Plans API Contract

Base path: `/api/plans`
Auth: JWT required, admin role required for write operations

## GET /api/plans

分页查询巡检计划列表。

**Query params**: `page, size, planName, projectId, status`

**Response 200**:
```json
{
  "code": 200,
  "data": {
    "records": [
      {
        "id": "number",
        "planName": "string",
        "projectId": "number | null",
        "projectName": "string | null",
        "startTime": "datetime",
        "endTime": "datetime",
        "status": "0 | 1 | 2",
        "farmerCount": "number",
        "inspectedCount": "number",
        "completionRate": "number",
        "parentId": "number",
        "isGlobal": "boolean"
      }
    ],
    "total": "number"
  }
}
```

## POST /api/plans

创建单项目巡检计划。

**Request**:
```json
{
  "planName": "string (required, max 100)",
  "projectId": "number (required)",
  "startTime": "datetime (required)",
  "endTime": "datetime (required, must be after startTime)"
}
```

**Response 201**: `{ "code": 201, "data": { "id": "number" } }`
**Response 400**: `{ "code": 400, "message": "该项目当前已有进行中的巡检计划" }`

## POST /api/plans/global

创建全局巡检计划（批量应用至多个项目）。

**Request**:
```json
{
  "planName": "string (required)",
  "projectIds": [1, 2, 3],
  "startTime": "datetime (required)",
  "endTime": "datetime (required)"
}
```

**Response 201**:
```json
{
  "code": 201,
  "data": {
    "parentPlanId": "number",
    "subPlanIds": [10, 11, 12]
  }
}
```

## PUT /api/plans/{id}

编辑计划（仅未开始/进行中可修改起止时间）。

**Request**:
```json
{
  "startTime": "datetime (optional)",
  "endTime": "datetime (optional)"
}
```

**Response 200**: `{ "code": 200, "message": "success" }`
**Response 400**: `{ "code": 400, "message": "已结束的计划不可修改" }`

## PUT /api/plans/{id}/finish

手动结束计划。

**Response 200**: `{ "code": 200, "message": "success" }`

## GET /api/plans/{id}/stats

计划统计详情。

**Response 200**:
```json
{
  "code": 200,
  "data": {
    "planName": "string",
    "farmerCount": "number",
    "inspectedCount": "number",
    "completionRate": "number",
    "projectRanking": [
      { "projectId": "number", "projectName": "string", "completionRate": "number" }
    ]
  }
}
```

## GET /api/plans/active?projectId={id}

获取指定项目当前进行中的巡检计划（巡检员使用）。

**Response 200**:
```json
{
  "code": 200,
  "data": {
    "id": "number",
    "planName": "string",
    "startTime": "datetime",
    "endTime": "datetime"
  } | null
}
```
