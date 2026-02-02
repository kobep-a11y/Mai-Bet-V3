# Universal API Contract Framework
### Consistent API Design & Documentation

---

## How to Use This Framework

1. **Define your API standards** once per project
2. **Document each endpoint** using the template
3. **Version appropriately** using the strategy
4. **Communicate changes** to consumers

---

# {{PROJECT_NAME}} — API Contracts

## API Standards

### Base URL
- **Production:** `https://api.{{DOMAIN}}.com/{{VERSION}}`
- **Staging:** `https://api.staging.{{DOMAIN}}.com/{{VERSION}}`
- **Development:** `http://localhost:{{PORT}}/{{VERSION}}`

### Versioning Strategy
- [ ] URL path versioning: `/v1/resource`
- [ ] Header versioning: `Accept: application/vnd.api+json;version=1`
- [ ] Query param: `?version=1`

**Current Version:** {{VERSION}}
**Deprecation Policy:** {{POLICY}}

---

## Authentication

### Method
- [ ] API Key (header)
- [ ] Bearer Token (JWT)
- [ ] OAuth 2.0
- [ ] Basic Auth
- [ ] Session Cookie

### Headers Required
```
Authorization: Bearer {{TOKEN}}
X-API-Key: {{KEY}}
```

### Token Format (If JWT)
```json
{
  "sub": "{{USER_ID}}",
  "iat": {{ISSUED_AT}},
  "exp": {{EXPIRES_AT}},
  "scope": ["{{SCOPE_1}}", "{{SCOPE_2}}"]
}
```

---

## Request Standards

### Headers
| Header | Required | Default | Description |
|--------|----------|---------|-------------|
| `Content-Type` | Yes | `application/json` | Request body format |
| `Accept` | No | `application/json` | Response format |
| `Authorization` | Varies | — | Auth credentials |
| `X-Request-ID` | No | Auto-generated | Request tracing |
| `X-Client-Version` | No | — | Client app version |

### Request Body Format
```json
{
  "data": {
    // Resource attributes
  },
  "meta": {
    // Optional metadata
  }
}
```

---

## Response Standards

### Success Response
```json
{
  "success": true,
  "data": {
    // Response payload
  },
  "meta": {
    "requestId": "{{REQUEST_ID}}",
    "timestamp": "{{ISO_TIMESTAMP}}"
  }
}
```

### Collection Response
```json
{
  "success": true,
  "data": [
    // Array of items
  ],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 100,
    "totalPages": 5
  },
  "meta": {
    "requestId": "{{REQUEST_ID}}"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "{{ERROR_CODE}}",
    "message": "{{USER_FRIENDLY_MESSAGE}}",
    "details": [
      {
        "field": "{{FIELD}}",
        "message": "{{SPECIFIC_ERROR}}"
      }
    ]
  },
  "meta": {
    "requestId": "{{REQUEST_ID}}",
    "documentation": "{{LINK_TO_DOCS}}"
  }
}
```

---

## HTTP Status Codes

### Success Codes
| Code | Meaning | When to Use |
|------|---------|-------------|
| `200` | OK | Successful GET, PUT, PATCH |
| `201` | Created | Successful POST creating resource |
| `204` | No Content | Successful DELETE |

### Client Error Codes
| Code | Meaning | When to Use |
|------|---------|-------------|
| `400` | Bad Request | Invalid request body/params |
| `401` | Unauthorized | Missing/invalid authentication |
| `403` | Forbidden | Valid auth, insufficient permissions |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Resource state conflict |
| `422` | Unprocessable Entity | Validation errors |
| `429` | Too Many Requests | Rate limit exceeded |

### Server Error Codes
| Code | Meaning | When to Use |
|------|---------|-------------|
| `500` | Internal Server Error | Unexpected server error |
| `502` | Bad Gateway | Upstream service failed |
| `503` | Service Unavailable | Service temporarily down |
| `504` | Gateway Timeout | Upstream service timeout |

---

## Pagination

### Query Parameters
| Parameter | Default | Max | Description |
|-----------|---------|-----|-------------|
| `page` | 1 | — | Page number (1-indexed) |
| `per_page` | 20 | 100 | Items per page |
| `sort` | varies | — | Sort field(s) |
| `order` | `asc` | — | `asc` or `desc` |

### Example
```
GET /v1/users?page=2&per_page=50&sort=created_at&order=desc
```

### Cursor-Based (Alternative)
```
GET /v1/users?cursor={{CURSOR}}&limit=50
```

---

## Filtering & Search

### Filter Syntax
```
GET /v1/users?filter[status]=active&filter[role]=admin
```

### Search
```
GET /v1/users?search=john
GET /v1/users?q=john
```

### Date Ranges
```
GET /v1/orders?created_after=2024-01-01&created_before=2024-12-31
```

---

## Rate Limiting

### Limits
| Tier | Requests/Minute | Requests/Day |
|------|-----------------|--------------|
| Free | 60 | 1,000 |
| Basic | 300 | 10,000 |
| Pro | 1,000 | 100,000 |
| Enterprise | Custom | Custom |

### Response Headers
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640000000
```

### Rate Limit Response
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please retry after 60 seconds.",
    "retryAfter": 60
  }
}
```

---

## Endpoint Documentation Template

### {{METHOD}} {{PATH}}

**Summary:** {{ONE_LINE_DESCRIPTION}}

**Authentication:** Required / Optional / None
**Authorization:** {{REQUIRED_PERMISSIONS}}
**Rate Limit:** {{TIER}}

#### Request

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `{{param}}` | {{type}} | Yes/No | {{description}} |

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `{{param}}` | {{type}} | Yes/No | {{default}} | {{description}} |

**Request Body:**
```json
{
  "{{field}}": "{{type}} — {{description}}",
  "{{field}}": "{{type}} — {{description}}"
}
```

**Example Request:**
```bash
curl -X {{METHOD}} \
  '{{BASE_URL}}{{PATH}}' \
  -H 'Authorization: Bearer {{TOKEN}}' \
  -H 'Content-Type: application/json' \
  -d '{
    "{{field}}": "{{value}}"
  }'
```

#### Response

**Success ({{STATUS_CODE}}):**
```json
{
  "success": true,
  "data": {
    "{{field}}": "{{type}} — {{description}}"
  }
}
```

**Error Responses:**
| Code | Error Code | Description |
|------|------------|-------------|
| 400 | `VALIDATION_ERROR` | {{WHEN}} |
| 401 | `UNAUTHORIZED` | {{WHEN}} |
| 404 | `NOT_FOUND` | {{WHEN}} |

---

## API Endpoint Catalog

### Users

#### GET /v1/users
**List all users**
- Auth: Required (admin)
- Pagination: Yes
- Filters: `status`, `role`

#### GET /v1/users/:id
**Get user by ID**
- Auth: Required
- Returns: User object

#### POST /v1/users
**Create new user**
- Auth: Required (admin)
- Body: User creation payload

#### PUT /v1/users/:id
**Update user**
- Auth: Required
- Body: User update payload

#### DELETE /v1/users/:id
**Delete user**
- Auth: Required (admin)
- Returns: 204 No Content

---

### {{RESOURCE_NAME}}

#### GET /v1/{{resources}}
**{{DESCRIPTION}}**
- Auth: {{REQUIREMENT}}
- Pagination: {{YES/NO}}
- Filters: {{AVAILABLE_FILTERS}}

#### GET /v1/{{resources}}/:id
**{{DESCRIPTION}}**
- Auth: {{REQUIREMENT}}
- Returns: {{RETURN_TYPE}}

---

## Data Models

### User
```json
{
  "id": "string (uuid)",
  "email": "string (email)",
  "name": "string",
  "role": "string (enum: user, admin)",
  "status": "string (enum: active, inactive, suspended)",
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)"
}
```

### {{MODEL_NAME}}
```json
{
  "{{field}}": "{{type}} ({{constraints}})"
}
```

---

## Breaking vs Non-Breaking Changes

### Non-Breaking (Safe)
- ✅ Adding new endpoints
- ✅ Adding optional request fields
- ✅ Adding new response fields
- ✅ Adding new enum values (usually)
- ✅ Relaxing validation

### Breaking (Requires Version Bump)
- ❌ Removing endpoints
- ❌ Removing request/response fields
- ❌ Changing field types
- ❌ Making optional fields required
- ❌ Changing URL structure
- ❌ Changing authentication
- ❌ Tightening validation

---

## Deprecation Process

### Timeline
1. **Announce:** {{WEEKS}} weeks before deprecation
2. **Deprecate:** Add deprecation header, continue supporting
3. **Sunset:** {{WEEKS}} weeks after deprecation
4. **Remove:** Return 410 Gone

### Deprecation Header
```
Deprecation: true
Sunset: Sat, 01 Jun 2025 00:00:00 GMT
Link: <https://api.example.com/v2/endpoint>; rel="successor-version"
```

### Communicating Changes
- [ ] Email to registered developers
- [ ] Update changelog
- [ ] Update API documentation
- [ ] Add migration guide
- [ ] {{OTHER_CHANNEL}}

---

## Webhooks (If Applicable)

### Webhook Payload
```json
{
  "id": "{{WEBHOOK_ID}}",
  "event": "{{EVENT_TYPE}}",
  "timestamp": "{{ISO_TIMESTAMP}}",
  "data": {
    // Event-specific data
  }
}
```

### Webhook Headers
```
X-Webhook-ID: {{ID}}
X-Webhook-Signature: {{HMAC_SIGNATURE}}
X-Webhook-Timestamp: {{TIMESTAMP}}
```

### Event Types
| Event | Trigger | Payload |
|-------|---------|---------|
| `user.created` | New user registered | User object |
| `user.updated` | User profile changed | User object |
| `{{EVENT}}` | {{TRIGGER}} | {{PAYLOAD}} |

### Signature Verification
```
signature = HMAC-SHA256(webhook_secret, timestamp + "." + payload)
```

---

## SDK Support

### Official SDKs
- [ ] JavaScript/TypeScript: `npm install @{{ORG}}/{{PACKAGE}}`
- [ ] Python: `pip install {{PACKAGE}}`
- [ ] Go: `go get github.com/{{ORG}}/{{PACKAGE}}`

### Code Examples
```javascript
// JavaScript
const client = new ApiClient({ apiKey: 'your-key' });
const users = await client.users.list({ page: 1 });
```

---

## Testing Your API

### Postman Collection
[Download Postman Collection]({{LINK}})

### OpenAPI Spec
[Download OpenAPI/Swagger Spec]({{LINK}})

### Sandbox Environment
- Base URL: `https://sandbox.api.{{DOMAIN}}.com`
- Test API Key: `test_{{KEY}}`

---

*"An API contract is a promise to your consumers. Break it carefully and communicate clearly."*
