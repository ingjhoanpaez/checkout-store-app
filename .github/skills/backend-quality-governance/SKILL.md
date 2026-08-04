---
name: backend-quality-governance
description: "Review or implement NestJS backend code for SOLID, ACID transactions, hexagonal architecture, single responsibility, centralized validation, strong TypeScript typing, and secure checkout data handling. Use when auditing, refactoring, adding modules, repositories, use cases, DTOs, database migrations, or payment flows in this project."
argument-hint: "Describe the backend module or change to review"
user-invocable: true
---

# Backend Quality Governance

Use this skill for backend design and implementation work in this repository.

## Procedure

1. Identify the owning module and draw the dependency flow `HTTP adapter -> use case -> domain port -> infrastructure adapter`. Verify every dependency points inward.
2. Keep `domain` free of Nest, ORM, HTTP, database, and provider imports. Keep `application` framework-neutral; compose its use cases through factory providers in the Nest module.
3. Confirm each operation has one responsibility and one authoritative type, validation schema, mapper, port, and source of truth. Name ports by capability, not by a framework or storage technology.
4. Put validation at the boundary: `src/config/environment.ts` is the only schema, default, normalization, and mapping owner for environment variables; Nest factories and CLI configuration consume it. Use DTO/pipe for HTTP, entity invariant for domain rules, and migrations for database invariants. Validate each rule once in its owning layer.
5. Reject ORM models, database transactions, HTTP exceptions, request/response objects, or provider SDK types crossing into domain or application contracts. Translate technical failures in adapters into typed business outcomes.
6. For checkout writes, verify a unit-of-work boundary: persist `PENDING`, invoke payment outside the database transaction, then atomically persist final status, delivery assignment, and approved stock decrement. Require idempotency for callbacks and retries.
7. Use explicit, strict TypeScript types. Do not introduce `any`, duplicate constants, duplicate validators, unchecked casts, or non-null assertions. Use `unknown` plus narrowing for untrusted data.
8. Add or update focused Jest tests for domain rules, framework-free use cases, adapter translation, and controller HTTP mapping. Validate with type-check/build, lint without auto-fix, and the narrowest affected test suite.

## Architecture Acceptance Checklist

- Domain and application imports contain no Nest, Sequelize, Express, or provider SDK modules.
- Each use case depends on interfaces or tokens declared by the domain, never a concrete adapter.
- Nest modules are the only place that bind a port to its concrete implementation.
- Every write that spans aggregates uses a unit-of-work port and database constraints.
- Payment data is transient and every persisted payment result is idempotent.
- Environment variables and database connection options have one canonical mapping; no other file reads those values directly from `process.env`.

## Security Boundaries

- Private provider keys only come from validated server environment variables.
- Never persist or log card PAN, CVV, or provider authentication data.
- Store only provider references and non-sensitive payment metadata required to reconcile a transaction.