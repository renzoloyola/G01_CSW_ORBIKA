# SDD ledger — plan: docs/superpowers/plans/2026-10-03-orbika-hardening-demo.md

Ruling: El proyecto no es un repositorio Git y el usuario prohibió inicializarlo — se omiten worktree, commits, task-start/task-done y review-package; cada tarea se controla con RED/GREEN y suite completa — costo si fuera incorrecto: no habrá historial automático ni rangos de revisión.

Pre-flight: Task 1 produce AppError/errorHandler consumed by Tasks 2, 4 y 5 — nombres consistentes.
Pre-flight: Task 2 produce validators and TRANSICIONES_PEDIDO consumed by Tasks 4 y 5 — firmas consistentes.
Pre-flight: Task 3 produce transactional RPCs consumed by Task 4 — nombres consistentes.
Pre-flight: Tasks 6-8 share auth profile and route conventions — no conflict found.
Pre-flight: Task 9 consumes final database schema from Task 3 — deterministic demo identifiers required.

Task 1: complete (tests: `npm test` -> 5/5 pass).

Task 2: complete (tests: `npm test` -> 22/22 pass).
Task 3: Ruling: no hay PostgreSQL local ni credenciales DDL y la API administrativa no aplica migraciones — se usa una prueba contractual estática para permisos y bloqueos SQL, seguida de verificación de sintaxis visual; la migración deberá ejecutarse en Supabase SQL Editor — costo si fuera incorrecto: una incompatibilidad específica de PostgreSQL solo aparecería al aplicar la migración.

Task 3: complete (tests: `npm test` included 5/5 migration contract tests).
Task 4: Ruling: la autorización se prueba en el servicio real y se duplica con `requireRole`; una prueba de ruta no distinguiría ambas defensas sin acoplarse al registro interno de Express — se prioriza el comportamiento observable del servicio — costo si fuera incorrecto: una ruta futura podría omitir la defensa temprana, aunque el servicio seguirá negando el acceso.
Task 4: complete (tests: 7/7 service behavior; full backend suite 38/38 pass).
Task 5: complete (tests: 4/4 service behavior; full backend suite 38/38 pass).

Task 6: complete (frontend auth tests 6/6 pass).
Task 7: complete (product helper tests 6/6 pass; frontend build pass).
Task 8: complete (order action tests 7/7 pass; frontend suite 19/19 and build pass).

Task 9: Ruling: el seeder usa un repositorio de alto nivel inyectable en vez de recibir `db` y `authAdmin` directamente — permite probar idempotencia con comportamiento real del dominio y confina Supabase al adaptador — costo si fuera incorrecto: una divergencia del adaptador solo aparece en la ejecución integrada, que también se verificó dos veces.
Task 9: complete (2/2 seed tests pass; remote seed ran twice with stable counts: 2 users, 8 products, 5 orders, 1 rating, 3 notifications).
Task 10: complete (dependency audits 0 vulnerabilities; accidental empty directory removed; README updated; API health, 7 purchasable products and 5 buyer/5 seller orders verified).

Final review: self-review (native mode; subagents not authorized).
Final: fixed perfil role self-escalation through direct Supabase update — migration test RED->GREEN, backend suite 42/42.
Final: fixed buyer product publishing through permissive RLS — migration test RED->GREEN, backend suite 42/42.
Final: fixed missing seller business data during registration — auth and migration tests RED->GREEN.
Final: minor (deferred): production JavaScript bundle is 509 kB and Vite warns above 500 kB; route-level code splitting can be added later.
Final: minor (deferred): local Node 23 is outside Vitest 5's declared support range, although all suites pass; use Node 22.12+ LTS or Node 24+ for supported tooling.
Final: Ruling: migration 002 cannot be applied with the available Supabase service-role REST key and no CLI/database password is configured — source is corrected and documented, but the user must run it once in Supabase SQL Editor — cost if omitted: the remote database retains the old privileged function permissions and role policies.
