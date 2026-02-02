# Universal Testing Strategy Framework
### Consistent Test Planning & Execution

---

## How to Use This Framework

1. **Define your test pyramid** for the project
2. **Set coverage targets** by layer
3. **Establish naming conventions** for consistency
4. **Document test data management** approach
5. **Integrate into CI/CD** pipeline

---

# {{PROJECT_NAME}} — Testing Strategy

## Testing Philosophy

**Guiding Principles:**
- Tests are documentation
- Fast feedback over comprehensive coverage
- Test behavior, not implementation
- Flaky tests are worse than no tests

---

## Test Pyramid

```
                    ╱╲
                   ╱  ╲
                  ╱ E2E╲          Few, Slow, Expensive
                 ╱──────╲
                ╱        ╲
               ╱Integration╲      Some, Medium Speed
              ╱────────────╲
             ╱              ╲
            ╱   Unit Tests   ╲    Many, Fast, Cheap
           ╱──────────────────╲
```

### Layer Definitions

| Layer | Scope | Speed | When to Use |
|-------|-------|-------|-------------|
| **Unit** | Single function/class | <10ms | Business logic, algorithms, utilities |
| **Integration** | Multiple components | <1s | API endpoints, database queries, services |
| **E2E** | Full user flow | <30s | Critical paths, smoke tests |

---

## Coverage Targets

| Layer | Target | Minimum | Current |
|-------|--------|---------|---------|
| Unit Tests | {{TARGET}}% | {{MIN}}% | {{CURRENT}}% |
| Integration Tests | {{TARGET}}% | {{MIN}}% | {{CURRENT}}% |
| E2E Tests | Critical paths | Critical paths | {{STATUS}} |
| **Overall** | {{TARGET}}% | {{MIN}}% | {{CURRENT}}% |

### Coverage Exclusions
Files/patterns excluded from coverage calculation:
- `**/test/**`
- `**/mocks/**`
- `{{OTHER_EXCLUSIONS}}`

---

## Naming Conventions

### Test File Naming
| Pattern | Example |
|---------|---------|
| `{{file}}.test.{{ext}}` | `UserService.test.ts` |
| `{{file}}.spec.{{ext}}` | `UserService.spec.ts` |
| `{{file}}_test.{{ext}}` | `user_service_test.go` |

### Test Case Naming

**Format:** `should_[expected behavior]_when_[condition]`

**Examples:**
```
✅ should_return_user_when_valid_id_provided
✅ should_throw_error_when_user_not_found
✅ should_send_email_when_registration_complete
```

**Alternative (BDD):** `it('returns user when valid ID is provided')`

### Test Structure (AAA Pattern)
```{{LANGUAGE}}
test('should_[behavior]_when_[condition]', () => {
  // Arrange
  {{SETUP_TEST_DATA_AND_MOCKS}}

  // Act
  {{EXECUTE_CODE_UNDER_TEST}}

  // Assert
  {{VERIFY_EXPECTED_OUTCOME}}
});
```

---

## Test Categories

### Unit Tests

**What to test:**
- Pure functions
- Business logic
- Data transformations
- Edge cases
- Error handling

**What NOT to test:**
- Framework code
- Third-party libraries
- Private methods directly

**Example:**
```{{LANGUAGE}}
describe('calculateDiscount', () => {
  test('should_apply_10_percent_when_order_over_100', () => {
    // Arrange
    const order = { total: 150 };

    // Act
    const discount = calculateDiscount(order);

    // Assert
    expect(discount).toBe(15);
  });

  test('should_return_zero_when_order_under_100', () => {
    const order = { total: 50 };
    expect(calculateDiscount(order)).toBe(0);
  });
});
```

---

### Integration Tests

**What to test:**
- API endpoints
- Database operations
- Service interactions
- External API calls (mocked)

**Test Database Strategy:**
- [ ] In-memory database
- [ ] Containerized database
- [ ] Shared test database
- [ ] Transaction rollback

**Example:**
```{{LANGUAGE}}
describe('POST /api/users', () => {
  beforeEach(async () => {
    await database.clear();
  });

  test('should_create_user_when_valid_data', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ name: 'Test', email: 'test@example.com' });

    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();
  });

  test('should_return_400_when_email_invalid', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ name: 'Test', email: 'invalid' });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('email');
  });
});
```

---

### End-to-End Tests

**What to test:**
- Critical user journeys
- Happy paths
- Smoke tests

**Critical Paths for This Project:**
1. {{CRITICAL_PATH_1}} (e.g., User registration → Login → Purchase)
2. {{CRITICAL_PATH_2}}
3. {{CRITICAL_PATH_3}}

**E2E Test Checklist:**
- [ ] Test in production-like environment
- [ ] Use realistic test data
- [ ] Handle async operations properly
- [ ] Clean up test data after

---

## Test Data Management

### Strategies

| Strategy | Use Case | Pros | Cons |
|----------|----------|------|------|
| **Fixtures** | Static test data | Predictable | Can become stale |
| **Factories** | Generate data on demand | Flexible | More setup |
| **Snapshots** | Output verification | Easy | Brittle |
| **Seeding** | Database population | Realistic | Slower |

### Factory Pattern Example
```{{LANGUAGE}}
const userFactory = {
  build: (overrides = {}) => ({
    id: faker.datatype.uuid(),
    name: faker.name.fullName(),
    email: faker.internet.email(),
    createdAt: new Date(),
    ...overrides
  })
};

// Usage
const user = userFactory.build({ name: 'Custom Name' });
```

### Test Data Guidelines
- ✅ Use realistic data
- ✅ Make data self-describing
- ✅ Isolate test data per test
- ❌ Don't hardcode IDs that might conflict
- ❌ Don't share mutable state between tests

---

## Mocking Guidelines

### When to Mock
- ✅ External services (APIs, email, payment)
- ✅ Time-dependent operations
- ✅ Random number generation
- ✅ File system operations (sometimes)

### When NOT to Mock
- ❌ The code under test
- ❌ Simple utility functions
- ❌ Everything (leads to testing mocks, not code)

### Mock Hierarchy
```
Prefer (most realistic → least realistic):
1. Real dependencies (if fast and deterministic)
2. Fakes (in-memory implementations)
3. Stubs (canned responses)
4. Mocks (verify interactions)
```

---

## Test Organization

### Directory Structure
```
{{PROJECT}}/
├── src/
│   ├── services/
│   │   └── UserService.ts
│   └── utils/
│       └── validation.ts
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   │   └── UserService.test.ts
│   │   └── utils/
│   │       └── validation.test.ts
│   ├── integration/
│   │   └── api/
│   │       └── users.test.ts
│   ├── e2e/
│   │   └── user-journey.test.ts
│   ├── fixtures/
│   │   └── users.json
│   ├── factories/
│   │   └── userFactory.ts
│   └── helpers/
│       └── testUtils.ts
```

---

## CI/CD Integration

### Pipeline Stages
```yaml
test:
  stages:
    - lint        # Static analysis
    - unit        # Fast feedback (<2 min)
    - integration # Medium feedback (<10 min)
    - e2e         # Slow feedback (<30 min)
```

### Test Execution Order
1. **Pre-commit:** Linting, affected unit tests
2. **Pre-push:** All unit tests
3. **CI Pipeline:** Full test suite
4. **Nightly:** Extended E2E, performance tests

### Parallelization
- [ ] Unit tests run in parallel
- [ ] Integration tests use isolated databases
- [ ] E2E tests can run concurrently (if isolated)

---

## Flaky Test Management

### Definition
A flaky test is one that passes and fails intermittently without code changes.

### Common Causes
| Cause | Solution |
|-------|----------|
| Timing issues | Use explicit waits, not sleep |
| Shared state | Isolate test data |
| External dependencies | Mock consistently |
| Race conditions | Ensure deterministic ordering |
| Environment differences | Containerize test environment |

### Flaky Test Protocol
1. **Quarantine:** Move to separate suite
2. **Investigate:** Root cause within 1 week
3. **Fix or Delete:** No permanent quarantine
4. **Track:** Log flaky test metrics

### Flaky Test Log
| Test Name | Date Found | Cause | Status |
|-----------|------------|-------|--------|
| {{TEST_NAME}} | {{DATE}} | {{CAUSE}} | Quarantined/Fixed/Deleted |

---

## Performance Testing

### What to Test
- [ ] API response times
- [ ] Database query performance
- [ ] Memory usage
- [ ] Concurrent user load

### Benchmarks
| Endpoint/Operation | Target | P50 | P95 | P99 |
|--------------------|--------|-----|-----|-----|
| {{ENDPOINT}} | {{MS}} | {{MS}} | {{MS}} | {{MS}} |

---

## Test Review Checklist

Before merging:
- [ ] New code has corresponding tests
- [ ] Tests cover happy path and edge cases
- [ ] Tests are readable and maintainable
- [ ] No flaky patterns introduced
- [ ] Coverage targets met
- [ ] Tests pass locally and in CI

---

## Testing Anti-Patterns

### ❌ Avoid
- Testing implementation details
- Too many mocks
- Tests that require specific order
- Shared mutable state
- Slow unit tests
- Testing third-party code
- 100% coverage as a goal

### ✅ Prefer
- Testing behavior/outcomes
- Real dependencies when practical
- Independent tests
- Isolated test data
- Fast feedback loops
- Testing your code
- Meaningful coverage

---

## Test Documentation

### For Complex Tests
```{{LANGUAGE}}
/**
 * Test: User cannot purchase item when out of stock
 *
 * Context: This tests the inventory check during checkout.
 * The system should prevent purchases when inventory is 0.
 *
 * Setup: Create item with quantity = 0
 * Action: Attempt to add to cart
 * Expected: CartError with code ITEM_OUT_OF_STOCK
 */
test('should_prevent_purchase_when_out_of_stock', () => {
  // ...
});
```

---

## Metrics & Reporting

### Track Over Time
- Coverage percentage by layer
- Test execution time
- Flaky test count
- Tests added per PR

### Reporting
- Coverage reports in PR comments
- Dashboard for test health
- Alerts for coverage drops

---

*"Write tests until fear is transformed into boredom." — Kent Beck*
