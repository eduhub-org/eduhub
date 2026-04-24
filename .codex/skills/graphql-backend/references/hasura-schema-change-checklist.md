# Hasura Schema Change Checklist

Use this checklist for any schema-affecting task.

## Required Layers

1. SQL migration in `backend/migrations/default/...`
2. metadata updates in `backend/metadata/` when tables, relationships, or permissions change
3. query and fragment updates in `frontend-nx/apps/edu-hub/queries/`
4. GraphQL type regeneration
5. function impact scan in `functions/`

## Permission Reminder

When a field is role-restricted in Hasura:

- verify which frontend role actually requests it
- prefer role-aware query hooks
- avoid hidden permission mismatches caused by hardcoded user-role helpers
