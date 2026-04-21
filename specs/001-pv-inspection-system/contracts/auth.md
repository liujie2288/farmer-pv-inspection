# Auth API Contract

Base path: `/api/auth`

## POST /api/auth/login

登录鉴权，返回JWT Token。

**Request**:
```json
{
  "username": "string (required, max 50)",
  "password": "string (required, max 100)"
}
```

**Response 200**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "token": "string (JWT)",
    "userId": "number",
    "username": "string",
    "realName": "string",
    "role": "admin | inspector",
    "firstLogin": "boolean"
  }
}
```

**Response 401**: `{ "code": 401, "message": "用户名或密码错误" }`
**Response 403**: `{ "code": 403, "message": "账号已被禁用" }`

## POST /api/auth/change-password

修改密码。巡检员仅可修改本人密码，管理员可修改本人密码。

**Request**:
```json
{
  "oldPassword": "string (required)",
  "newPassword": "string (required, min 6)"
}
```

**Response 200**: `{ "code": 200, "message": "success" }`
**Response 400**: `{ "code": 400, "message": "原密码错误" }`

## POST /api/auth/reset-password

重置密码（仅管理员）。重置后用户需用初始密码登录。

**Request**:
```json
{
  "userId": "number (required)"
}
```

**Response 200**: `{ "code": 200, "message": "success" }`
**Response 403**: `{ "code": 403, "message": "无权限操作" }`
