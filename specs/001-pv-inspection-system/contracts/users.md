# Users API Contract

Base path: `/api/users`
Auth: JWT required, admin role required for all endpoints

## GET /api/users

分页查询用户列表。

**Query params**: `page, size, username, realName, role, status`

**Response 200**:
```json
{
  "code": 200,
  "data": {
    "records": [
      {
        "id": "number",
        "username": "string",
        "realName": "string",
        "phone": "string | null",
        "role": "admin | inspector",
        "status": "0 | 1",
        "firstLogin": "boolean",
        "createTime": "datetime"
      }
    ],
    "total": "number",
    "current": "number",
    "size": "number"
  }
}
```

## POST /api/users

创建用户。

**Request**:
```json
{
  "username": "string (required, max 50, unique)",
  "password": "string (required, min 6)",
  "realName": "string (required, max 50)",
  "phone": "string (optional, max 20)",
  "role": "admin | inspector (required)"
}
```

**Response 201**: `{ "code": 201, "data": { "id": "number" } }`
**Response 400**: `{ "code": 400, "message": "用户名已存在" }`

## PUT /api/users/{id}

编辑用户信息（不可修改密码）。

**Request**:
```json
{
  "realName": "string (required)",
  "phone": "string (optional)",
  "role": "admin | inspector (required)",
  "status": "0 | 1 (required)"
}
```

**Response 200**: `{ "code": 200, "message": "success" }`

## DELETE /api/users/{id}

删除用户。

**Response 200**: `{ "code": 200, "message": "success" }`

## PUT /api/users/{id}/status

启用/禁用用户。

**Request**: `{ "status": "0 | 1" }`

**Response 200**: `{ "code": 200, "message": "success" }`
