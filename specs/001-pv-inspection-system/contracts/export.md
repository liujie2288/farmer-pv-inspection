# Export API Contract

Base path: `/api/export`
Auth: JWT required, admin role required

## GET /api/export/preview/{recordId}

在线预览单个农户巡检报告PDF。

**Response 200**: `Content-Type: application/pdf` (binary stream)

## GET /api/export/pdf/{recordId}

下载单个农户巡检报告PDF。

**Response 200**: `Content-Type: application/pdf, Content-Disposition: attachment`

## POST /api/export/plan/{planId}

按巡检计划批量导出PDF报告和照片（ZIP）。

**Request**:
```json
{
  "includePhotos": true
}
```

**Response 200** (≤1000份): Binary ZIP stream
`Content-Type: application/zip, Content-Disposition: attachment`

**Response 202** (>1000份):
```json
{
  "code": 202,
  "data": {
    "taskId": "number",
    "message": "导出任务已创建，完成后将通知您"
  }
}
```

## GET /api/export/tasks

查询导出任务列表。

**Response 200**:
```json
{
  "code": 200,
  "data": [
    {
      "id": "number",
      "planName": "string",
      "status": "0 | 1 | 2",
      "totalCount": "number",
      "fileUrl": "string | null",
      "fileSize": "number | null",
      "createTime": "datetime",
      "completeTime": "datetime | null"
    }
  ]
}
```

## GET /api/export/tasks/{taskId}/download

下载已完成的导出文件。

**Response 200**: Binary ZIP stream
**Response 400**: `{ "code": 400, "message": "导出任务尚未完成" }`
