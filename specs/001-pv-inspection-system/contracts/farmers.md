# Farmers API Contract

Base path: `/api/projects/{projectId}/farmers`
Auth: JWT required

## GET /api/projects/{projectId}/farmers

分页查询农户列表（滚动加载）。

**Query params**: `page, size, farmerName, farmerCode, status (all/inspected/uninspected)`

**Response 200**:
```json
{
  "code": 200,
  "data": {
    "records": [
      {
        "id": "number",
        "farmerCode": "string",
        "farmerName": "string",
        "powerAccount": "string | null",
        "inverterSn": "string | null",
        "status": "0 | 1",
        "lastInspectTime": "datetime | null",
        "lastInspectorName": "string | null"
      }
    ],
    "total": "number"
  }
}
```

## POST /api/projects/{projectId}/farmers (admin only)

单个新增农户。

**Request**:
```json
{
  "farmerCode": "string (required, unique)",
  "farmerName": "string (required)",
  "powerAccount": "string (optional)",
  "inverterSn": "string (optional)",
  "inverterBrand": "string (optional)",
  "moduleSpec": "string (optional)",
  "moduleCount": "number (optional)",
  "capacityKw": "number (optional)"
}
```

**Response 201**: `{ "code": 201, "data": { "id": "number" } }`

## POST /api/projects/{projectId}/farmers/import (admin only)

批量导入农户（Excel文件上传）。

**Request**: `multipart/form-data` with file field `file`

**Response 200**:
```json
{
  "code": 200,
  "data": {
    "successCount": "number",
    "failCount": "number",
    "errors": [
      { "row": "number", "reason": "string" }
    ]
  }
}
```

## PUT /api/projects/{projectId}/farmers/{id} (admin only)

编辑农户信息。

**Request**: same fields as create

**Response 200**: `{ "code": 200, "message": "success" }`

## DELETE /api/projects/{projectId}/farmers/{id} (admin only)

删除农户（级联删除巡检记录和照片）。

**Response 200**: `{ "code": 200, "message": "success" }`

## DELETE /api/projects/{projectId}/farmers/batch (admin only)

批量删除农户。

**Request**: `{ "ids": [1, 2, 3] }`

**Response 200**: `{ "code": 200, "data": { "deletedCount": "number" } }`

## GET /api/projects/{projectId}/farmers/{id}

农户详情（含历史巡检记录摘要）。

**Response 200**:
```json
{
  "code": 200,
  "data": {
    "id": "number",
    "farmerCode": "string",
    "farmerName": "string",
    "powerAccount": "string | null",
    "inverterSn": "string | null",
    "inverterBrand": "string | null",
    "moduleSpec": "string | null",
    "moduleCount": "number | null",
    "capacityKw": "number | null",
    "status": "0 | 1",
    "lastInspectTime": "datetime | null",
    "projectName": "string",
    "records": [
      {
        "id": "number",
        "planName": "string",
        "inspectorName": "string",
        "createTime": "datetime"
      }
    ]
  }
}
```
