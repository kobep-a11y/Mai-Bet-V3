# Universal Error Handling Framework
### Consistent, Informative, Recoverable Errors

---

## How to Use This Framework

1. **Categorize errors** using the taxonomy
2. **Implement patterns** for your tech stack
3. **Standardize messages** for users vs developers
4. **Configure logging** with appropriate levels
5. **Set up alerting** based on severity

---

# {{PROJECT_NAME}} — Error Handling Strategy

## Error Philosophy

**Principles:**
- Fail fast, fail loudly (in development)
- Fail gracefully, fail helpfully (in production)
- Errors are information, not embarrassments
- Users need actions, developers need details

---

## Error Taxonomy

### By Origin

| Category | Description | Examples |
|----------|-------------|----------|
| **User Error** | Invalid input from user | Validation failures, bad format |
| **Client Error** | API misuse | Missing params, auth failure |
| **System Error** | Internal failures | DB down, OOM, bugs |
| **External Error** | Third-party failures | API timeout, service down |
| **Configuration Error** | Setup issues | Missing env vars, bad config |

### By Recoverability

| Type | Meaning | Response |
|------|---------|----------|
| **Recoverable** | Can retry or fix | Prompt user, retry logic |
| **Non-Recoverable** | Cannot proceed | Fail, alert, escalate |
| **Transient** | Temporary failure | Automatic retry |
| **Permanent** | Structural issue | Requires code change |

---

## Error Code Registry

### Format
`{{DOMAIN}}_{{CATEGORY}}_{{SPECIFIC}}`

### Example Registry

| Code | Message | User-Facing | HTTP | Severity |
|------|---------|-------------|------|----------|
| `AUTH_TOKEN_EXPIRED` | Authentication token has expired | Your session has expired. Please sign in again. | 401 | Info |
| `AUTH_INVALID_CREDS` | Invalid credentials provided | Incorrect email or password | 401 | Warning |
| `USER_NOT_FOUND` | User not found in database | Account not found | 404 | Info |
| `VALIDATION_EMAIL` | Invalid email format | Please enter a valid email | 400 | Info |
| `DB_CONNECTION_FAILED` | Database connection failed | Something went wrong. Please try again. | 500 | Critical |
| `EXTERNAL_API_TIMEOUT` | Third-party API timed out | Service temporarily unavailable | 503 | Warning |

### Add New Error Codes

```markdown
| `{{CODE}}` | {{INTERNAL_MESSAGE}} | {{USER_MESSAGE}} | {{HTTP}} | {{SEVERITY}} |
```

---

## Error Response Structure

### API Error Response
```json
{
  "success": false,
  "error": {
    "code": "{{ERROR_CODE}}",
    "message": "{{USER_FRIENDLY_MESSAGE}}",
    "details": {
      "field": "{{FIELD_NAME}}",
      "reason": "{{SPECIFIC_REASON}}"
    },
    "requestId": "{{TRACE_ID}}",
    "timestamp": "{{ISO_TIMESTAMP}}",
    "documentation": "{{LINK_TO_DOCS}}"
  }
}
```

### Example Responses

**Validation Error (400):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Please fix the following errors",
    "details": [
      { "field": "email", "reason": "Invalid email format" },
      { "field": "age", "reason": "Must be 18 or older" }
    ],
    "requestId": "req_abc123"
  }
}
```

**System Error (500):**
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Something went wrong. Please try again later.",
    "requestId": "req_xyz789"
  }
}
```

---

## Error Classes/Types

### Base Error Class
```{{LANGUAGE}}
class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number,
    public isOperational: boolean = true,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
```

### Specific Error Types
```{{LANGUAGE}}
class ValidationError extends AppError {
  constructor(details: ValidationDetail[]) {
    super('VALIDATION_FAILED', 'Validation failed', 400, true, { details });
  }
}

class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super('NOT_FOUND', `${resource} not found`, 404, true, { resource, id });
  }
}

class AuthenticationError extends AppError {
  constructor(reason: string) {
    super('AUTH_FAILED', 'Authentication failed', 401, true, { reason });
  }
}

class ExternalServiceError extends AppError {
  constructor(service: string, originalError: Error) {
    super('EXTERNAL_SERVICE_FAILED', `${service} is unavailable`, 503, true, {
      service,
      originalMessage: originalError.message
    });
  }
}
```

---

## Error Handling Patterns

### Try-Catch Pattern
```{{LANGUAGE}}
async function handleRequest(req, res) {
  try {
    const result = await processRequest(req);
    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AppError) {
      // Operational error - expected
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details
        }
      });
    } else {
      // Programming error - unexpected
      logger.error('Unexpected error', { error });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred'
        }
      });
    }
  }
}
```

### Result Type Pattern (No Exceptions)
```{{LANGUAGE}}
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return { success: false, error: 'Division by zero' };
  }
  return { success: true, data: a / b };
}

// Usage
const result = divide(10, 0);
if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}
```

### Global Error Handler
```{{LANGUAGE}}
// Express example
app.use((error, req, res, next) => {
  const requestId = req.id || generateId();

  // Log error
  logger.error({
    requestId,
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method
  });

  // Determine response
  if (error instanceof AppError && error.isOperational) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        requestId
      }
    });
  }

  // Unknown error - don't leak details
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      requestId
    }
  });
});
```

---

## Retry Patterns

### Exponential Backoff
```{{LANGUAGE}}
async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    retryOn: (error: Error) => boolean;
  }
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!options.retryOn(error) || attempt === options.maxRetries) {
        throw error;
      }

      const delay = Math.min(
        options.baseDelay * Math.pow(2, attempt),
        options.maxDelay
      );

      await sleep(delay + Math.random() * 100); // Jitter
    }
  }

  throw lastError;
}
```

### Circuit Breaker
```{{LANGUAGE}}
class CircuitBreaker {
  private failures = 0;
  private lastFailure: Date | null = null;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold: number = 5,
    private timeout: number = 30000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailure!.getTime() > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failures++;
    this.lastFailure = new Date();
    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }
}
```

---

## Logging Standards

### Log Levels

| Level | When to Use | Example |
|-------|-------------|---------|
| **ERROR** | Application error, requires attention | DB connection failed |
| **WARN** | Potential issue, degraded service | Retry attempt 2/3 |
| **INFO** | Business events, milestones | User registered |
| **DEBUG** | Development details | Function entered with params |
| **TRACE** | Verbose debugging | Loop iteration n |

### Log Format
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "ERROR",
  "message": "Database connection failed",
  "service": "{{SERVICE_NAME}}",
  "requestId": "req_abc123",
  "userId": "user_xyz",
  "error": {
    "code": "DB_CONNECTION_FAILED",
    "message": "Connection refused",
    "stack": "..."
  },
  "context": {
    "host": "db.example.com",
    "port": 5432,
    "retryAttempt": 3
  }
}
```

### What to Log

**Always Log:**
- Error code and message
- Request ID (for tracing)
- User ID (if applicable)
- Timestamp
- Stack trace (for errors)

**Never Log:**
- Passwords or secrets
- Full credit card numbers
- PII without consent
- Session tokens

---

## Alerting Thresholds

| Condition | Severity | Alert |
|-----------|----------|-------|
| Error rate > 1% | Warning | Slack |
| Error rate > 5% | Critical | PagerDuty |
| 5xx errors > 10/min | Critical | PagerDuty |
| P99 latency > 2s | Warning | Slack |
| Circuit breaker opens | Critical | PagerDuty |
| Disk space > 80% | Warning | Slack |

---

## User-Facing Messages

### Guidelines
- Be specific but not technical
- Provide actionable next steps
- Don't blame the user
- Maintain brand voice

### Message Templates

| Scenario | Bad | Good |
|----------|-----|------|
| Invalid input | "Error 422" | "Please enter a valid email address" |
| Server error | "Internal server error" | "Something went wrong. Please try again in a few minutes." |
| Not found | "404 Not Found" | "We couldn't find that page. It may have been moved or deleted." |
| Timeout | "Request timeout" | "This is taking longer than expected. Please try again." |
| Rate limit | "Too many requests" | "You're doing that too often. Please wait a moment and try again." |

---

## Error Boundaries (Frontend)

```{{LANGUAGE}}
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to error reporting service
    errorService.log(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

---

## Checklist for New Features

- [ ] Error codes defined and documented
- [ ] User-facing messages written
- [ ] Logging implemented at appropriate levels
- [ ] Retry logic for transient failures
- [ ] Circuit breakers for external services
- [ ] Alerts configured for critical errors
- [ ] Error handling tested (not just happy path)

---

*"Errors should be impossible to ignore, informative, and actionable."*
