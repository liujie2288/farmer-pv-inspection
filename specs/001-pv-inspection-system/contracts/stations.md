# Stations API Contract

Base path: `/api/projects/{projectId}/stations`
Auth: JWT required

## GET /api/projects/{projectId}/stations

分页查询电站列表。

**Query params**: `page, size, ownerName, stationCode, status (all/inspected/uninspected)`

**Response 200**:
```json
{
  "code": 200,
  "data": {
    "records": [
      {
        "id": "number",
        "stationCode": "string",
        "ownerName": "string",
        "address": "string | null",
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

## POST /api/projects/{projectId}/stations (admin only)

单个新增电站。

**Request**:
```json
{
  "stationCode": "string (required, unique)",
  "ownerName": "string (required)",
  "address": "string (optional)",
  "powerAccount": "string (optional)",
  "inverterSn": "string (optional)",
  "inverterBrand": "string (optional)",
  "moduleSpec": "string (optional)",
  "moduleCount": "number (optional)",
  "capacityKw": "number (optional)",
  "longitude": "number (optional)",
  "latitude": "number (optional)"
}
```

**Response 201**: `{ "code": 201, "data": { "id": "number" } }`

## POST /api/projects/{projectId}/stations/import (admin only)

批量导入电站（Excel文件上传）。

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

## PUT /api/projects/{projectId}/stations/{id} (admin only)

编辑电站信息。

**Request**: same fields as create

**Response 200**: `{ "code": 200, "message": "success" }`

## DELETE /api/projects/{projectId}/stations/{id} (admin only)

删除电站（级联删除巡检记录和照片）。

**Response 200**: `{ "code": 200, "message": "success" }`

## DELETE /api/projects/{projectId}/stations/batch (admin only)

批量删除电站。

**Request**: `{ "ids": [1, 2, 3] }`

**Response 200**: `{ "code": 200, "data": { "deletedCount": "number" } }`

## GET /api/projects/{projectId}/stations/{id}

电站详情（含历史巡检记录摘要）。

**Response 200**:
```json
{
  "code": 200,
  "data": {
    "id": "number",
    "stationCode": "string",
    "ownerName": "string",
    "address": "string | null",
    "powerAccount": "string | null",
    "inverterSn": "string | null",
    "inverterBrand": "string | null",
    "moduleSpec": "string | null",
    "moduleCount": "number | null",
    "capacityKw": "number | null",
    "longitude": "number | null",
    "latitude": "number | null",
    "status": "0 | 1",
    "lastInspectTime": "datetime | null",
    "lastInspectRecordId": "number | null",
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
