"""Read-only dump of the raw Zoom data behind one session's attendance.

Shows every past instance of the meeting (also those the session-window
filter drops), the raw participant rows of the person you look for
(incl. breakout-room ids) and what aggregate_participants makes of them.

Usage (env: ZOOM_API_KEY, ZOOM_API_SECRET, ZOOM_ACCOUNT_ID):
  PYTHONPATH=functions/shared_libs python3 scripts/attendance-debug/zoom_raw_dump.py \
      <meeting-url> <session-start-utc> <session-end-utc> <name-or-email-regex>
"""
import re
import sys

import pandas as pd
from api_clients.zoom_client import ZoomClient

url, start, end, pattern = sys.argv[1:5]
rx = re.compile(pattern, re.I)
zc = ZoomClient()
meeting_id = zc.get_meeting_id(url)

instances = zc.list_past_meeting_instances(meeting_id)
kept = {i["uuid"] for i in zc.filter_instances_by_session_window(instances, start, end)}
print(f"\n=== Instances of meeting {meeting_id} (kept = inside session window) ===")
for inst in sorted(instances, key=lambda i: i.get("start_time", "")):
    print(f"{inst.get('start_time')}  kept={inst['uuid'] in kept}  uuid={inst['uuid']}")

rows = []
for uuid in kept:
    for p in zc.get_meeting_instance_participants(uuid):
        rows.append(dict(p, _meeting_uuid=uuid))
raw = pd.DataFrame(rows)
if raw.empty:
    sys.exit("\nNo participant rows in the kept instances.")
mine = raw[raw.apply(lambda r: bool(rx.search(f"{r.get('name')} {r.get('user_email')}")), axis=1)]
cols = [c for c in ["name", "user_email", "id", "user_id", "participant_user_id",
                    "join_time", "leave_time", "duration", "status", "bo_mtg_id",
                    "failover", "_meeting_uuid"] if c in mine.columns]
pd.set_option("display.width", 250, "display.max_columns", None, "display.max_rows", None)
print(f"\n=== Raw rows matching /{pattern}/ ({len(mine)} of {len(raw)}) ===")
print(mine.sort_values("join_time")[cols].to_string(index=False))

print("\n=== Distinct display names in the meeting (spot renamed / device names) ===")
if "user_email" not in raw.columns:
    raw["user_email"] = ""
print(raw.fillna({"user_email": ""}).groupby(["name", "user_email"]).size().rename("rows").to_string())

agg = zc.aggregate_participants(rows)
agg["minutes"] = (agg["duration"] / 60).round(1)
print(f"\n=== Aggregated records matching /{pattern}/ (what check_attendance sees) ===")
print(agg[agg.apply(lambda r: bool(rx.search(f"{r['name']} {r['email']}")), axis=1)]
      [["name", "email", "joinDateTime", "leaveDateTime", "minutes", "interruptionCount"]]
      .to_string(index=False))
