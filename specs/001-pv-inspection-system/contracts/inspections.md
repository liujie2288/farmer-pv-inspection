# Inspections API Contract

Base path: `/api/inspections`
Auth: JWT required

## GET /api/inspections/checklist-template

获取巡检检查清单模板（固定6大分区64项）。

**Response 200**:
```json
{
  "code": 200,
  "data": {
    "sections": [
      {
        "sectionId": 1,
        "sectionName": "光伏组件",
        "items": [
          {
            "itemId": 1,
            "content": "组件外观整洁，应无破碎、弯曲...",
            "category": null,
            "hasNumeric": false,
            "numericLabels": null
          },
          {
            "itemId": 10,
            "content": "边框必须牢固接地...",
            "category": null,
            "hasNumeric": true,
            "numericLabels": ["接地电阻(Ω)", "接触电阻(Ω)"]
          }
        ]
      }
    ]
  }
}
```

## POST /api/inspections

提交巡检记录。

**Request**:
```json
{
  "planId": "number (required)",
  "farmerId": "number (required)",
  "projectId": "number (required)",
  "checklistResult": {
    "sections": [
      {
        "sectionId": 1,
        "items": [
          {
            "itemId": 1,
            "result": "正常",
            "exceptionNote": "",
            "measuredValue": null
          },
          {
            "itemId": 10,
            "result": "正常",
            "exceptionNote": "",
            "measuredValue": { "groundResistance": 2.25, "contactResistance": 0.011 }
          }
        ]
      }
    ]
  },
  "photoUrls": {
    "1": ["url1", "url2"],
    "2": ["url3"]
  },
  "longitude": 116.407526,
  "latitude": 39.904030
}
```

**Response 201**: `{ "code": 201, "data": { "id": "number" } }`
**Response 400**: `{ "code": 400, "message": "当前巡检计划未在进行中" }`

## PUT /api/inspections/{id}

修改巡检记录（仅计划进行中+本人记录）。

**Request**: same as create

**Response 200**: `{ "code": 200, "message": "success" }`
**Response 403**: `{ "code": 403, "message": "巡检计划已结束，记录不可修改" }`

## GET /api/inspections/{id}

查看巡检记录详情。

**Response 200**:
```json
{
  "code": 200,
  "data": {
    "id": "number",
    "planName": "string",
    "farmerName": "string",
    "farmerCode": "string",
    "projectName": "string",
    "inspectorName": "string",
    "checklistResult": { "...full checklist..." },
    "photoUrls": { "1": ["url1"], "..." },
    "longitude": "number",
    "latitude": "number",
    "createTime": "datetime",
    "canEdit": "boolean"
  }
}
```

## GET /api/inspections?farmerId={id}

查询农户的巡检记录列表（巡检员仅返回本人记录）。

**Query params**: `farmerId (required), planId (optional), page, size`

**Response 200**:
```json
{
  "code": 200,
  "data": {
    "records": [
      {
        "id": "number",
        "planName": "string",
        "createTime": "datetime",
        "inspectorName": "string",
        "canEdit": "boolean"
      }
    ],
    "total": "number"
  }
}
```

## POST /api/inspections/photos/upload

上传巡检照片（分片上传支持）。

**Request**: `multipart/form-data`
- `file`: photo file
- `sectionId`: number
- `chunkIndex`: number (optional, for chunked upload)
- `totalChunks`: number (optional, for chunked upload)

**Response 200**:
```json
{
  "code": 200,
  "data": {
    "url": "string (OSS URL with watermark applied)"
  }
}
```
