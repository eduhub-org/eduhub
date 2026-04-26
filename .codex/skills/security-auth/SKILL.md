---
name: security-auth
description: Apply EduHub authentication, authorization, and security conventions. Use when working on Keycloak, NextAuth, JWT/session handling, role checks, Hasura permissions, or security-sensitive frontend and backend behavior.
---
# Security Auth

Use this skill for authentication, authorization, and security-sensitive changes.

## Core Architecture

EduHub authentication spans:

- Keycloak for identity and realm roles
- NextAuth session handling in the frontend
- Hasura role-based permissions
- frontend role-aware GraphQL hooks

Changes in one layer often require checking the others.

## Core Rules

- preserve least-privilege behavior
- do not hardcode a lower or broader role than the user actually has
- verify both authenticated and unauthorized behavior
- treat admin, instructor, and participant flows as distinct

## Frontend Expectations

- use existing auth/session helpers instead of inventing parallel state
- keep role checks explicit and readable
- when gating UI actions, ensure unauthorized users cannot trigger the underlying write path indirectly

## GraphQL Expectations

- use role-aware hooks for GraphQL operations
- verify Hasura permissions match the actual caller role
- when adding fields to existing fragments, check whether all consuming roles are allowed to read them

## Sensitive Change Checklist

For auth or permission changes, check:

1. login/session flow
2. frontend role checks
3. GraphQL role headers and hooks
4. Hasura metadata permissions
5. unauthorized and authorized test paths

## Output Style For This Skill

When you make a security-relevant change, state clearly:

1. which role or permission boundary changed
2. which layers were updated
3. how unauthorized behavior was verified
