# Attendance debugging

Read-only tools for checking a complaint like "I was there, but EduHub says I
missed the session". Matching itself lives in
`functions/callPythonFunction/pythonFunctions/check_attendance.py`.

| File | What it shows |
|------|---------------|
| `session_attendance.sql` | Queries for the Hasura console (Data → SQL): a course's sessions, one participant's Attendances, all Attendance Records of a session with who claimed each one |
| `zoom_raw_dump.py` | The raw Zoom report of one meeting: all instances (also those outside the session window), the raw rows of a person incl. breakout-room ids, and the records `check_attendance` gets from them |
| `dry_run_matching.py` | Re-runs the matching in this checkout on the stored records and lists every Attendance that would change. Run it before resetting `Session.attendanceData` for a re-check |

## Connecting to production

From the repo root, with `gcloud` logged in and Application Default
Credentials set up:

```bash
~/.local/bin/cloud-sql-proxy --port 54329 eduhub-production:europe-west1:default-dbi &
export DATABASE_URL=$(gcloud secrets versions access latest --secret hasura-db-url \
  --project eduhub-production --billing-project eduhub-production \
  | sed -E 's#@[^/]+/#@127.0.0.1:54329/#')
```

The Python scripts open the database read-only (`default_transaction_read_only`).

```bash
PYTHONPATH=functions/shared_py:functions/callPythonFunction \
  python3 scripts/attendance-debug/dry_run_matching.py 691 704
```

`zoom_raw_dump.py` needs `ZOOM_API_KEY`, `ZOOM_API_SECRET` (Secret Manager:
`zoom-api-key`, `zoom-api-secret`) and `ZOOM_ACCOUNT_ID` (environment of the
`call-python-function` Cloud Function); its docstring has the arguments.
