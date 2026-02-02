# Universal Migration Playbook
### Safe Database & System Migrations

---

## How to Use This Playbook

1. **Classify your migration** by type and risk
2. **Follow the pre-flight checklist**
3. **Execute with the appropriate strategy**
4. **Verify and monitor**
5. **Know your rollback plan**

---

## Migration Classification

### By Type

| Type | Description | Risk | Example |
|------|-------------|------|---------|
| **Schema Additive** | Adding columns/tables | Low | New feature table |
| **Schema Destructive** | Removing/renaming | High | Dropping column |
| **Data Migration** | Moving/transforming data | Medium | Backfill values |
| **Data Type Change** | Changing column types | High | INT → BIGINT |
| **Index Changes** | Adding/removing indexes | Medium | Performance index |
| **System Migration** | Changing infrastructure | High | DB version upgrade |

### Risk Assessment

| Factor | Low Risk | High Risk |
|--------|----------|-----------|
| Table size | < 100K rows | > 10M rows |
| Downtime tolerance | Acceptable | None |
| Reversibility | Easily reversible | Irreversible |
| Data dependencies | None | Many |
| Testing coverage | Fully tested | Partially tested |

---

# Migration Plan

## Migration Metadata

**Migration ID:** MIG-{{NUMBER}}
**Title:** {{DESCRIPTIVE_TITLE}}
**Author:** {{NAME}}
**Date:** {{DATE}}
**Status:** Draft / Approved / Executed / Rolled Back

**Type:** {{SCHEMA_DATA_SYSTEM}}
**Risk Level:** Low / Medium / High / Critical
**Estimated Duration:** {{TIME}}
**Downtime Required:** Yes ({{DURATION}}) / No

---

## Overview

### What
{{DESCRIBE_WHAT_THIS_MIGRATION_DOES}}

### Why
{{EXPLAIN_THE_BUSINESS_OR_TECHNICAL_REASON}}

### Impact
- Tables affected: {{LIST}}
- Rows affected: ~{{ESTIMATE}}
- Services affected: {{LIST}}
- Expected downtime: {{DURATION_OR_NONE}}

---

## Pre-Migration Checklist

### Research & Planning
- [ ] Migration type identified
- [ ] Risk level assessed
- [ ] Rollback plan documented
- [ ] Execution window scheduled
- [ ] Stakeholders notified

### Technical Preparation
- [ ] Migration script written
- [ ] Rollback script written
- [ ] Script tested on staging
- [ ] Script tested on production-like data volume
- [ ] Backup verified
- [ ] Monitoring dashboards ready

### Dependencies
- [ ] No conflicting deployments scheduled
- [ ] Required services available
- [ ] Database has sufficient disk space
- [ ] Connection limits sufficient

### Approvals
- [ ] DBA review (if applicable)
- [ ] Tech lead approval
- [ ] Product owner notified
- [ ] On-call engineer aware

---

## Migration Script

### Forward Migration
```sql
-- Migration: {{MIG_ID}}
-- Description: {{DESCRIPTION}}
-- Author: {{NAME}}
-- Date: {{DATE}}

-- Pre-migration checks
SELECT COUNT(*) FROM {{TABLE}}; -- Expected: {{COUNT}}

-- Begin transaction
BEGIN;

-- Migration steps
{{SQL_STATEMENTS}}

-- Verification
{{VERIFICATION_QUERIES}}

-- Commit (only after verification)
COMMIT;

-- Post-migration checks
{{POST_CHECKS}}
```

### Application Code Changes
```{{LANGUAGE}}
// If code changes accompany this migration:
{{CODE_CHANGES}}
```

---

## Rollback Script

### Rollback Migration
```sql
-- Rollback: {{MIG_ID}}
-- Description: Reverses {{MIGRATION_DESCRIPTION}}
-- Author: {{NAME}}

BEGIN;

{{ROLLBACK_SQL_STATEMENTS}}

COMMIT;

-- Verification
{{ROLLBACK_VERIFICATION}}
```

### Rollback Considerations
- [ ] Can be executed without data loss: Yes / No
- [ ] Requires data recovery: Yes / No
- [ ] Application compatibility: {{NOTES}}
- [ ] Estimated rollback time: {{DURATION}}

---

## Execution Strategies

### Strategy 1: Direct Apply
**Use when:** Low risk, small data, downtime acceptable

```
1. Put application in maintenance mode
2. Run migration
3. Verify
4. Remove maintenance mode
```

### Strategy 2: Online Migration (Zero Downtime)
**Use when:** No downtime tolerance, additive changes

```
1. Add new column (nullable/with default)
2. Deploy code that writes to both old and new
3. Backfill existing data
4. Deploy code that reads from new
5. (Later) Remove old column
```

### Strategy 3: Expand-Contract
**Use when:** Renaming or restructuring

```
Phase 1 - Expand:
1. Add new structure alongside old
2. Deploy code writing to both
3. Migrate data to new structure

Phase 2 - Contract:
1. Deploy code reading from new only
2. Remove old structure
```

### Strategy 4: Blue-Green Database
**Use when:** Major schema changes, system migrations

```
1. Create new database with new schema
2. Sync data continuously
3. Test with new database
4. Switch traffic to new database
5. Keep old database as rollback
```

---

## Execution Runbook

### Pre-Execution (T-1 hour)
- [ ] Notify stakeholders of upcoming maintenance
- [ ] Verify backup completed successfully
- [ ] Check current database metrics (baseline)
- [ ] Ensure rollback script is ready
- [ ] Open monitoring dashboards

### Execution

#### Step 1: {{STEP_NAME}}
**Command:**
```sql
{{COMMAND}}
```
**Expected result:** {{EXPECTED}}
**If fails:** {{ACTION}}

#### Step 2: {{STEP_NAME}}
**Command:**
```sql
{{COMMAND}}
```
**Expected result:** {{EXPECTED}}
**If fails:** {{ACTION}}

### Post-Execution
- [ ] Run verification queries
- [ ] Check application logs for errors
- [ ] Monitor database metrics
- [ ] Confirm application functionality
- [ ] Update migration status

---

## Verification Queries

### Data Integrity Checks
```sql
-- Count should match expected
SELECT COUNT(*) FROM {{TABLE}};

-- Check for nulls where not expected
SELECT COUNT(*) FROM {{TABLE}} WHERE {{COLUMN}} IS NULL;

-- Check for duplicates
SELECT {{COLUMN}}, COUNT(*)
FROM {{TABLE}}
GROUP BY {{COLUMN}}
HAVING COUNT(*) > 1;

-- Validate relationships
SELECT COUNT(*)
FROM {{TABLE_A}} a
LEFT JOIN {{TABLE_B}} b ON a.id = b.a_id
WHERE b.id IS NULL;
```

### Application Verification
- [ ] Critical user flow 1: {{FLOW}}
- [ ] Critical user flow 2: {{FLOW}}
- [ ] API endpoints returning correct data
- [ ] No increase in error rates

---

## Monitoring During Migration

### Database Metrics
| Metric | Normal | Alert Threshold |
|--------|--------|-----------------|
| Lock wait time | < 1s | > 5s |
| Replication lag | < 1s | > 10s |
| Active connections | < 80% | > 90% |
| Query latency (P99) | < 100ms | > 500ms |
| Disk I/O | Baseline | 2x baseline |

### Application Metrics
| Metric | Normal | Alert Threshold |
|--------|--------|-----------------|
| Error rate | < 0.1% | > 1% |
| Response time (P99) | < 500ms | > 2s |
| Request rate | Baseline | < 50% baseline |

---

## Rollback Triggers

**Immediately rollback if:**
- [ ] Migration fails mid-execution
- [ ] Error rate exceeds {{THRESHOLD}}%
- [ ] P99 latency exceeds {{MS}}ms
- [ ] Data integrity check fails
- [ ] Replication lag exceeds {{SECONDS}}s

**Discuss before rollback if:**
- [ ] Minor performance degradation
- [ ] Non-critical feature affected
- [ ] Edge case issues discovered

---

## Rollback Procedure

### Step 1: Assess
- Confirm rollback is necessary
- Notify stakeholders

### Step 2: Execute Rollback
```sql
{{ROLLBACK_COMMANDS}}
```

### Step 3: Verify Rollback
```sql
{{VERIFICATION_THAT_ROLLBACK_WORKED}}
```

### Step 4: Application Recovery
- [ ] Restart affected services (if needed)
- [ ] Clear caches (if needed)
- [ ] Verify application functionality

### Step 5: Post-Mortem
- Document what went wrong
- Schedule retry with fixes

---

## Common Migration Patterns

### Adding a Column (Safe)
```sql
-- Add with default (instant in modern DBs)
ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active';
```

### Adding a Column (Legacy/Large Tables)
```sql
-- Step 1: Add nullable column
ALTER TABLE users ADD COLUMN status VARCHAR(20);

-- Step 2: Backfill in batches
UPDATE users SET status = 'active'
WHERE id BETWEEN {{START}} AND {{END}};

-- Step 3: Add default for new rows
ALTER TABLE users ALTER COLUMN status SET DEFAULT 'active';

-- Step 4: (Optional) Make NOT NULL after backfill
ALTER TABLE users ALTER COLUMN status SET NOT NULL;
```

### Renaming a Column (Zero Downtime)
```sql
-- Step 1: Add new column
ALTER TABLE users ADD COLUMN full_name VARCHAR(255);

-- Step 2: Copy data
UPDATE users SET full_name = name;

-- Step 3: (Deploy code using both)

-- Step 4: Drop old column (after code deployed)
ALTER TABLE users DROP COLUMN name;
```

### Changing Column Type
```sql
-- Step 1: Add new column with new type
ALTER TABLE orders ADD COLUMN amount_new BIGINT;

-- Step 2: Migrate data
UPDATE orders SET amount_new = amount;

-- Step 3: (Deploy code using new column)

-- Step 4: Drop old, rename new
ALTER TABLE orders DROP COLUMN amount;
ALTER TABLE orders RENAME COLUMN amount_new TO amount;
```

### Adding Index (Non-Blocking)
```sql
-- PostgreSQL
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);

-- MySQL 8+
ALTER TABLE users ADD INDEX idx_email (email), ALGORITHM=INPLACE, LOCK=NONE;
```

---

## Large Table Migration Tips

### Batch Processing Template
```sql
-- Process in batches of 10,000
DO $$
DECLARE
  batch_size INT := 10000;
  max_id INT;
  current_id INT := 0;
BEGIN
  SELECT MAX(id) INTO max_id FROM {{TABLE}};

  WHILE current_id < max_id LOOP
    UPDATE {{TABLE}}
    SET {{COLUMN}} = {{VALUE}}
    WHERE id > current_id AND id <= current_id + batch_size
      AND {{CONDITION}};

    current_id := current_id + batch_size;
    COMMIT;

    -- Optional: Add delay to reduce load
    PERFORM pg_sleep(0.1);
  END LOOP;
END $$;
```

### Progress Monitoring
```sql
-- Check migration progress
SELECT
  COUNT(*) FILTER (WHERE new_column IS NOT NULL) AS migrated,
  COUNT(*) FILTER (WHERE new_column IS NULL) AS remaining,
  ROUND(100.0 * COUNT(*) FILTER (WHERE new_column IS NOT NULL) / COUNT(*), 2) AS percent_complete
FROM {{TABLE}};
```

---

## Communication Templates

### Pre-Migration Notice
```
Subject: Scheduled Database Migration - {{DATE}}

We will be performing a database migration on {{DATE}} at {{TIME}}.

Impact: {{EXPECTED_IMPACT}}
Duration: ~{{ESTIMATED_DURATION}}
Downtime: {{YES_NO}}

Please contact {{CONTACT}} with questions.
```

### Migration Complete
```
Subject: Database Migration Complete

The database migration has been completed successfully.

Duration: {{ACTUAL_DURATION}}
Status: ✅ Success

All systems are operating normally.
```

---

## Post-Migration Checklist

- [ ] Migration script marked as executed
- [ ] Documentation updated
- [ ] Monitoring confirmed stable
- [ ] Stakeholders notified of completion
- [ ] Cleanup tasks scheduled (if any)
- [ ] Lessons learned documented

---

*"A migration without a rollback plan is just hope with extra steps."*
