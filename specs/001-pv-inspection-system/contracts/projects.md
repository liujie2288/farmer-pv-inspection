# Projects API Contract

Base path: `/api/projects`
Auth: JWT required

## GET /api/projects

分页查询项目列表（所有角色可访问）。

**Query params**: `page, size, projectName`

**Response 200**:
```json
{
  "code": 200,
  "data": {
    "records": [
      {
        "id": "number",
        "projectName": "string",
        "propertyCompany": "string",
        "stationType": "string",
        "farmerCount": "number",
        "inspectedCount": "number",
        "completionRate": "number (0-100)"
      }
    ],
    "total": "number"
  }
}
```

## POST /api/projects (admin only)

创建项目。

**Request**:
```json
{
  "projectName": "string (required, max 100, unique)",
  "propertyCompany": "string (required, max 100)",
  "stationType": "string (required, max 50)"
}
```

**Response 201**: `{ "code": 201, "data": { "id": "number" } }`

## PUT /api/projects/{id} (admin only)

编辑项目。

**Request**:
```json
{
  "projectName": "string (required)",
  "propertyCompany": "string (required)",
  "stationType": "string (required)"
}
```

**Response 200**: `{ "code": 200, "message": "success" }`

## DELETE /api/projects/{id} (admin only)

删除项目（需先删除所有关联农户）。

**Response 200**: `{ "code": 200, "message": "success" }`
**Response 400**: `{ "code": 400, "message": "该项目下存在农户，请先删除" }`

## GET /api/projects/{id}/stats

获取项目统计信息。

**Response 200**:
```json
{
  "code": 200,
  "data": {
    "farmerCount": "number",
    "inspectedCount": "number",
    "uninspectedCount": "number",
    "completionRate": "number",
    "activePlan": { "id": "number", "planName": "string" } | null
  }
}
```
