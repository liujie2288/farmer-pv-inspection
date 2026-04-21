<!--
Sync Impact Report
==================
Version change: 1.0.0 → 1.1.0
Modified principles: none
Added sections:
  - Core Principle IV: Responsive & Adaptive Design
Removed sections: none
Templates requiring updates:
  ✅ .specify/templates/plan-template.md — Constitution Check section aligns; no changes needed
  ✅ .specify/templates/spec-template.md — Requirements structure compatible; no changes needed
  ✅ .specify/templates/tasks-template.md — Task categorization compatible; no changes needed
  ✅ .specify/templates/commands/*.md — No command templates exist
Follow-up TODOs: none
-->

# Farmer PV Inspection System Constitution

## Core Principles

### I. Code Quality

All code MUST be readable, maintainable, and follow consistent conventions.

- Every module MUST have a single, clear responsibility.
- Naming MUST be descriptive and consistent across the codebase
  (variables, functions, classes, files).
- Code MUST pass linting and formatting checks before commit.
- Duplicate logic MUST be extracted into shared utilities; no
  copy-paste implementations.
- Public APIs and interfaces MUST have type annotations and
  parameter/return documentation.

**Rationale**: The system serves field inspection workflows where
reliability and long-term maintainability directly impact operations.
Poor code quality compounds into regressions that are costly to fix
in production.

### II. Test-First (NON-NEGOTIABLE)

Tests MUST be written before implementation and MUST fail before
the corresponding code is written.

- Red-Green-Refactor cycle is strictly enforced: write failing test
  → user approves test → then implement.
- Every bug fix MUST include a regression test that reproduces the
  defect before the fix is applied.
- Integration tests MUST cover all API contracts and cross-module
  boundaries.
- Test coverage MUST NOT decrease between commits on the main branch.
- Mocking external services is acceptable; mocking internal business
  logic is prohibited.

**Rationale**: PV inspection involves safety-relevant data. Untested
code puts field operations and compliance at risk. Test-first
development catches defects at the cheapest possible stage.

### III. Consistent User Experience

All user-facing interfaces MUST deliver a uniform, predictable
experience across the entire system.

- Navigation patterns, terminology, and visual components MUST be
  consistent between web, mobile, and any other client.
- Error messages MUST be user-friendly, actionable, and never expose
  internal system details.
- Every interactive feature MUST provide clear feedback for loading,
  success, and error states.
- Accessibility standards MUST be followed (keyboard navigation,
  sufficient color contrast, screen-reader support).
- UI text MUST be written in the end-user's language (Chinese for
  primary users) and reviewed for clarity.

**Rationale**: Field inspectors operate under time pressure in outdoor
conditions. Inconsistent UI increases training costs and the risk of
data entry errors during inspections.

### IV. Responsive & Adaptive Design

All pages MUST adopt a mobile-first design strategy while ensuring
full usability on desktop (PC) screens.

- Inspector-facing pages MUST be optimized for mobile as the primary
  device (touch targets, single-column layout, thumb-friendly
  navigation).
- Admin-facing pages MUST provide an enhanced desktop layout that
  leverages wider screen real estate (multi-column dashboards,
  data tables with sortable columns, bulk actions).
- Every page MUST be tested at both mobile (375px) and desktop
  (1280px) breakpoints before being considered complete.
- Shared components MUST gracefully adapt between breakpoints without
  requiring separate implementations per device.
- Admin operations that are impractical on mobile (batch import,
  report export, complex data editing) MAY be desktop-only but MUST
  display a clear message on mobile devices.

**Rationale**: Field inspectors use phones outdoors while administrators
manage plans and review data on office PCs. A single-device approach
would compromise usability for one of the two primary user roles.

## Technical Constraints

- All external dependencies MUST be explicitly declared in a lockfile
  (package-lock.json, requirements.txt, or equivalent).
- Secrets and credentials MUST NEVER appear in source code, commits,
  or logs. Use environment variables or a secrets manager.
- API endpoints MUST follow RESTful conventions and return standard
  error codes with structured error bodies.
- Database migrations MUST be reversible (each UP migration MUST have
  a corresponding DOWN migration).

## Development Workflow

- Feature branches MUST be created via the Spec-Kit pipeline
  (specify → clarify → plan → tasks → implement).
- Each task MUST be committed individually with a descriptive message
  referencing the task ID.
- Pull requests MUST pass all automated checks (lint, test, build)
  before merge.
- Code review MUST verify compliance with this constitution before
  approval.

## Governance

This constitution is the authoritative source for development
standards. All code reviews, design decisions, and process
disagreements MUST be resolved in favor of constitution compliance.

### Amendment Procedure

1. Propose amendment with justification and impact assessment.
2. Team review and discussion (minimum one business day for feedback).
3. Approved amendments update the constitution version per semantic
   versioning rules.
4. All in-progress features MUST align with the new amendment within
   one sprint of ratification.

### Versioning Policy

- **MAJOR**: Principle removal or incompatible redefinition.
- **MINOR**: New principle or materially expanded guidance.
- **PATCH**: Clarifications, wording fixes, non-semantic changes.

### Compliance Review

- The Constitution Check gate in the implementation plan template
  MUST be completed before research begins.
- Any principle violation MUST be documented in the Complexity
  Tracking table with explicit justification.

**Version**: 1.1.0 | **Ratified**: 2026-04-20 | **Last Amended**: 2026-04-21
