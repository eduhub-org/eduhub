"""Dry run of the attendance matching against stored Attendance Records.

Re-runs ``match_participants`` (the code in this checkout) on the records
already stored in Session.attendanceData and prints every participant whose
automatic Attendance would change its status or match type, and every
Attendance a re-check would add with ATTENDED. Other fields (minutes,
record indexes, recorded names) are not compared. Writes nothing: the
database is opened read-only through ``psql``.

The stored records are what Zoom/LimeSurvey returned at check time, so this
shows the effect of matching changes. Changes in how Zoom rows are merged
into records (zoom_client) only take effect on a real re-check.

Usage (from the repo root; DATABASE_URL e.g. via cloud-sql-proxy, see
scripts/attendance-debug/README.md):
  PYTHONPATH=functions/shared_py:functions/callPythonFunction \
    python3 scripts/attendance-debug/dry_run_matching.py 691 704
  ... dry_run_matching.py --running   # all courses with a session in the last 120 days
"""
import json
import os
import subprocess
import sys

import pandas as pd

from pythonFunctions.check_attendance import match_participants

SESSIONS = """
SELECT coalesce(json_agg(json_build_object(
  'id', id, 'courseId', "courseId", 'title', title,
  'startDateTime', "startDateTime", 'endDateTime', "endDateTime",
  'records', "attendanceData"::json) ORDER BY "startDateTime"), '[]')
FROM "Session"
WHERE "attendanceData" IS NOT NULL AND "courseId" IS NOT NULL AND (%s)
"""

PARTICIPANTS = """
SELECT coalesce(json_agg(json_build_object(
  'courseId', e."courseId", 'id', u.id, 'firstName', u."firstName",
  'lastName', u."lastName", 'email', u.email)), '[]')
FROM "CourseEnrollment" e JOIN "User" u ON u.id = e."userId"
WHERE e."courseId" IN (%s) AND NOT e."isTest"
  AND e.status IN ('CONFIRMED', 'REGISTERED', 'COMPLETED')
"""

ATTENDANCES = """
SELECT coalesce(json_agg(json_build_object(
  'sessionId', "sessionId", 'userId', "userId", 'status', status, 'source', source,
  'matchType', "matchType", 'recordedIdentifier', "recordedIdentifier")), '[]')
FROM "Attendance" WHERE "sessionId" IN (%s)
"""


def psql(db_url, sql):
    """Run one read-only query; errors never echo the URL (it holds the password)."""
    done = subprocess.run(
        ["psql", db_url, "-X", "-At", "-c", sql],
        capture_output=True, text=True,
        env={**os.environ, "PGOPTIONS": "-c default_transaction_read_only=on"},
    )
    if done.returncode != 0:
        sys.exit(f"psql failed: {done.stderr.strip()}")
    return json.loads(done.stdout)


def load(db_url, course_ids, running):
    if running:
        where = """"courseId" IN (SELECT "courseId" FROM "Session"
                   WHERE "startDateTime" > now() - interval '120 days')"""
    else:
        where = '"courseId" IN (%s)' % ",".join(str(int(c)) for c in course_ids)
    sessions = psql(db_url, SESSIONS % where)
    if not sessions:
        return []
    courses = ",".join(sorted({str(s["courseId"]) for s in sessions}))
    people = psql(db_url, PARTICIPANTS % courses)
    attendances = psql(db_url, ATTENDANCES % ",".join(str(s["id"]) for s in sessions))
    for s in sessions:
        seen = set()
        s["participants"] = [
            p for p in people
            if p["courseId"] == s["courseId"] and not (p["id"] in seen or seen.add(p["id"]))
        ]
        s["current"] = [a for a in attendances if a["sessionId"] == s["id"]]
        s["manual"] = {a["userId"] for a in s["current"] if a["source"] == "INSTRUCTOR"}
    return sessions


def records_frame(stored):
    frame = pd.read_json(pd.io.common.StringIO(json.dumps(stored)))
    for column in ("joinDateTime", "leaveDateTime"):
        if column in frame:
            frame[column] = pd.to_datetime(frame[column], unit="ms", utc=True, errors="coerce")
    return frame.sort_index().reset_index(drop=True)


def main(argv):
    running = "--running" in argv
    course_ids = [a for a in argv if a != "--running"]
    sessions = load(os.environ["DATABASE_URL"], course_ids, running)
    changed = new_rows = 0
    for s in sessions:
        session = {
            "id": s["id"],
            "startDateTime": pd.Timestamp(s["startDateTime"]),
            "endDateTime": pd.Timestamp(s["endDateTime"]),
        }
        participants = pd.DataFrame(s["participants"], columns=["id", "firstName", "lastName", "email"])
        rows = match_participants(participants, records_frame(s["records"]), session)
        current = {c["userId"]: c for c in s["current"] if c["source"] != "INSTRUCTOR"}
        names = {p["id"]: f"{p['firstName']} {p['lastName']}" for p in s["participants"]}
        header = f"\n== course {s['courseId']} session {s['id']} {s['startDateTime'][:10]} {s['title']}"
        for row in rows:
            old = current.get(row["userId"])
            if old is None:
                new_rows += 1
                if row["status"] != "ATTENDED":
                    continue
                old = {}
            elif old.get("status") == row["status"] and old.get("matchType") == row["matchType"]:
                continue
            if header:
                print(header)
                header = None
            changed += 1
            manual = " (manual fix exists)" if row["userId"] in s["manual"] else ""
            print(
                f"  {names.get(row['userId'], row['userId'])}: "
                f"{old.get('status')}/{old.get('matchType')} [{old.get('recordedIdentifier')}] -> "
                f"{row['status']}/{row['matchType']} [{row['recordedIdentifier']}]"
                f"{' ' + str(round(row['duration'] / 60)) + ' min' if row.get('duration') else ''}{manual}"
            )
    print(f"\n{changed} change(s) in {len(sessions)} session(s); "
          f"{new_rows} Attendance(s) a re-check would add (ATTENDED ones are listed above)")


if __name__ == "__main__":
    main(sys.argv[1:])
