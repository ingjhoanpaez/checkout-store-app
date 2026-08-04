---
name: Backend Architecture
description: "Use when creating or modifying backend TypeScript, NestJS modules, database models, repositories, use cases, controllers, configuration, validation, or tests. Enforces SOLID, ACID, strong typing, centralized validation, and the project's hexagonal boundaries."
applyTo: "backend/**/*.ts"
---
# Backend Architecture Rules

- Keep one business capability per module under `src/modules/<capability>` with `domain`, `application`, and `infrastructure` layers.
- Depend only inward: `domain` depends on nothing outside itself; `application` depends only on domain contracts and shared language; `infrastructure` implements domain ports; Nest modules compose concrete adapters. Dependencies must never point from domain/application to HTTP, ORM, database, provider SDK, or Nest types.
- Keep Nest decorators, dependency injection bindings, controllers, pipes, guards, ORM models, and SDK clients at the composition or infrastructure edge. Construct framework-neutral use cases through `useFactory` providers when they require ports.
- Define a port in `domain/ports` for every dependency that crosses the application boundary. Ports expose domain types and business outcomes only; never expose `Model`, `Transaction`, `HttpException`, request/response, or provider SDK types.
- Implement each port in a single adapter with mapping at the boundary. Adapters may translate technical failures into typed domain/application errors, but must not leak HTTP exceptions to use cases or entities.
- Controllers only translate HTTP. They validate input through DTOs/pipes, invoke one use case, and map the use case result to HTTP; they never contain business rules, ORM calls, or payment-provider calls.
- Use cases orchestrate one business operation. Domain entities own invariants; repository and external-service ports define dependencies; infrastructure implements ports.
- Keep database models, ORM queries, HTTP clients, and framework exceptions in infrastructure. Do not expose them through domain ports or entities.
- Validate each external input once at its boundary. `src/config/environment.ts` is the single owner of environment schema, defaults, normalization, and variable-to-configuration mapping; Nest factories and Sequelize CLI must consume it rather than read `process.env` or reconstruct connection options. Centralize HTTP input in DTOs/pipes and persistence constraints in migrations. Do not repeat equivalent validation in downstream layers.
- Keep one package manager and one lockfile. Tooling required by scripts, including migration tooling, must be declared in `package.json`; never rely on a global installation.
- Use explicit types for public methods, injected dependencies, DTOs, ports, configuration, and persistence attributes. Do not use `any`, unsafe assertions, or non-null assertions to bypass type checks.
- Prefer `unknown` at untrusted boundaries and narrow it with a type guard or validator. Model expected business failures with named error types or `Result`; reserve exceptions for unexpected technical failures.
- Use a single authoritative name and type for each concept. Do not duplicate constants, validators, interfaces, or mapping logic across layers.
- For state changes involving stock, customer, delivery, and transaction records, orchestrate a unit-of-work port and use one database transaction. Enforce database constraints and optimistic/concurrency-safe stock updates. Persist a transaction as pending before requesting payment; update stock only for approved payment outcomes.
- Do not hold a database transaction open during a remote payment call. Persist the pending state, call the provider through a port, then use a new atomic transaction to persist the final result, delivery assignment, and stock mutation. Make webhook or retry processing idempotent through a unique provider transaction reference.
- Treat card PAN, CVV, and authentication data as transient: validate at the request boundary, forward only to the payment adapter, never persist, log, expose, or store it in browser persistence.
- Add focused Jest tests for domain invariants, framework-free use cases, adapters, and controller mappings before or with behavior changes. Run type-check/build, lint without auto-fix, and the smallest relevant test suite before completing work.