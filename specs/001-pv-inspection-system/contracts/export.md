# Export API Contract

Base path: `/api/export`
Auth: JWT required; admin role for all endpoints except `/pdf/**` (authenticated)

## GET /api/export/pdf/{recordId}

单个农户巡检报告PDF预览/下载（支持管理员和巡检员）。

**Response 200**: `Content-Type: application/pdf, Content-Disposition: inline`

## POST /api/export/plan/{planId}

按巡检计划创建导出任务（全部异步）。支持两种导出模式。

**Query Params**:
- `exportType` (int, default 0): `0` = PDF报告ZIP（含嵌入照片），`1` = 照片ZIP（按农户分组）

**Response 200**:
```json
{
  "code": 200,
  "data": {
    "id": "number",
    "planId": "number",
    "status": "0",
    "exportType": "0 | 1",
    "totalCount": "number",
    "processedCount": "0",
    "createTime": "datetime"
  }
}
```

## GET /api/export/plan/{planId}/tasks

查询某个巡检计划的所有导出任务（按创建时间倒序）。

**Response 200**:
```json
{
  "code": 200,
  "data": [
    {
      "id": "number",
      "planId": "number",
      "status": "0 | 1 | 2",
      "exportType": "0 | 1",
      "totalCount": "number",
      "processedCount": "number",
      "fileUrl": "string | null",
      "fileSize": "number | null",
      "errorMessage": "string | null",
      "createTime": "datetime",
      "completeTime": "datetime | null"
    }
  ]
}
```

## GET /api/export/task/{taskId}

查询单个导出任务状态（含进度）。

**Response 200**:
```json
{
  "code": 200,
  "data": {
    "id": "number",
    "status": "0 | 1 | 2",
    "exportType": "0 | 1",
    "totalCount": "number",
    "processedCount": "number",
    "fileUrl": "string | null",
    "fileSize": "number | null",
    "errorMessage": "string | null"
  }
}
```

## GET /api/export/task/{taskId}/download

获取已完成导出文件的下载链接（重新生成 presigned URL，24小时有效）。

**Response 200**:
```json
{
  "code": 200,
  "data": { "url": "string" }
}
```
**Response 400**: `{ "code": 400, "message": "导出任务不存在或未完成" }`

## Export Types

| exportType | ZIP内容 | 目录结构 |
|------------|---------|----------|
| 0 | PDF报告（含嵌入照片） | `{farmerCode}_{farmerName}.pdf` |
| 1 | 原始照片 | `{farmerCode}_{farmerName}/section_{id}_{name}/photo_1.jpg` |

## Task Status

| status | 含义 |
|--------|------|
| 0 | 导出中 |
| 1 | 已完成（可下载） |
| 2 | 失败（可重试） |
