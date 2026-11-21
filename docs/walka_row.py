"""A walk as Walka keeps it (one file of its "sessions" folder) -> a row for the accounts' "walks" table.

For whoever writes a program that sends walks (docs/data-model.md, "From
Walka's own record of a walk"). This is the website's own reader,
src/lib/account/import.ts (walkaRecord and outside), line for line in
Python, so that a program sends the SAME row the website makes from the
same file. Standard library only.

    row = walk_row(record)             # record: the file's JSON, read as it is. None: not one of Walka's records
    why = outside(row, now_ms)         # None: within the database's limits; else the reason, in the website's words

Checked on 21 November 2026 against the website's code on 564 records
(503 made by Walka's own recorder in eleven time zones, 61 awkward ones):
the same answer for each. Nothing in this repository runs it: a program
that takes it over keeps it, and tests it, itself. If import.ts changes,
this must change with it - the three records in tests/import.test.ts
(EVENING, MIDNIGHT, OLD) and the rows expected for them are the first
thing to try.

Before a row is sent as JSON: "steps" and "utc_offset_min" are whole
numbers (int), never 66.0; and every row of one request has the same
keys, with None where there is nothing.
"""

from __future__ import annotations

import calendar
import math
import re
from datetime import datetime, timedelta, timezone
from typing import Any

MOST_SECONDS = 86_400
MOST_METRES = 200_000
MOST_STEPS = 400_000
MOST_KCAL = 20_000
DAY_MS = 86_400_000
TWO_DAYS_MS = 2 * DAY_MS
YEAR_2000_MS = 946_684_800_000

# import.ts WALKA_ID. [0-9], not \d: JavaScript's \d is ASCII only, Python's is not.
WALKA_ID = re.compile(r"^([0-9]{4})([0-9]{2})([0-9]{2})-([0-9]{2})([0-9]{2})([0-9]{2})(?:-[0-9]{1,9})?$")
EPOCH = datetime(1970, 1, 1, tzinfo=timezone.utc)


def _number(value: Any) -> bool:
    """import.ts number(): a JSON number that is finite. (true/false are not numbers in JavaScript.)"""
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def _js_round(x: float) -> int:
    """Math.round: halves go up (towards +infinity)."""
    return math.floor(x + 0.5)


def _tenth(n: float) -> float | int:
    """import.ts tenth(): Math.round(n * 10) / 10."""
    value = _js_round(n * 10) / 10
    return int(value) if value == int(value) else value


def _utc(seconds: float) -> str | None:
    """import.ts utc(): seconds since 1970 -> "2026-11-19T20:30:00.400Z" (milliseconds, rounded)."""
    ms = _js_round(seconds * 1000)
    if abs(ms) > 8.64e15:
        return None
    try:
        at = EPOCH + timedelta(milliseconds=ms)
    except OverflowError:
        return None
    return at.strftime("%Y-%m-%dT%H:%M:%S.") + f"{at.microsecond // 1000:03d}Z"


def _word(value: Any, known: tuple[str, ...]) -> str | None:
    return value if isinstance(value, str) and value in known else None


def walk_row(record: Any) -> dict[str, Any] | None:
    """import.ts walkaRecord(). None if it is not one of Walka's records. The limits are not looked at."""
    if not isinstance(record, dict):
        return None
    found = WALKA_ID.match(record["id"]) if isinstance(record.get("id"), str) else None
    if not found:
        return None
    start, end, seconds = record.get("start"), record.get("end"), record.get("seconds")
    distance_m, steps, kcal = record.get("distance_m"), record.get("steps"), record.get("kcal")
    if not all(_number(v) for v in (start, end, seconds, distance_m, steps, kcal)):
        return None
    if float(steps) != math.floor(steps):  # Number.isInteger
        return None
    extra = record.get("kcal_extra")
    if extra is None:  # (older records do not have it at all)
        extra = 0
    if not _number(extra):
        return None
    started_at, ended_at = _utc(start), _utc(end)
    if not started_at or not ended_at:
        return None

    y, mo, d, h, mi, s = (int(part) for part in found.groups())
    try:
        datetime(y, mo, d, h, mi, s)  # "20261340-256199" is no time
    except ValueError:
        return None
    if y < 100:  # JavaScript's Date.UTC reads the years 0-99 as 1900-1999: the id does not come back the same
        return None
    wall = calendar.timegm((y, mo, d, h, mi, s))  # the id read as if it were UTC, in seconds

    # How far that clock was ahead of UTC then. Kept only when id and start agree to the second.
    ahead = (wall - start) / 60
    minutes = _js_round(ahead)
    offset = minutes if abs(ahead - minutes) * 60 <= 1.5 and -720 <= minutes <= 840 else None

    return {
        "origin": "walka",
        "client_id": record["id"],
        "started_at": started_at,
        "ended_at": ended_at,
        "local_day": f"{found.group(1)}-{found.group(2)}-{found.group(3)}",
        "utc_offset_min": offset,
        "seconds": _tenth(seconds),
        "distance_m": _tenth(distance_m),
        "steps": int(steps),
        "kcal": _tenth(kcal),
        # 0 in a record with calories is an older record that never knew: empty, not "none"
        "kcal_extra": None if extra == 0 and kcal > 0 else _tenth(extra),
        "session": _word(record.get("source"), ("wow", "manual", "free")),
        "steps_source": _word(record.get("steps_source"), ("treadmill", "estimate")),
        "distance_source": _word(record.get("distance_source"), ("treadmill", "speed")),
        "calories_source": _word(record.get("calories_source"), ("speed", "heart_rate")),
    }


def _ms(text: str) -> int:
    return round((datetime.strptime(text, "%Y-%m-%dT%H:%M:%S.%fZ").replace(tzinfo=timezone.utc) - EPOCH) / timedelta(milliseconds=1))


def outside(walk: dict[str, Any], now_ms: int) -> str | None:
    """import.ts outside(): what the database would refuse, in the website's words - or None."""
    start, end = _ms(walk["started_at"]), _ms(walk["ended_at"])
    try:
        day = calendar.timegm(datetime.strptime(walk["local_day"], "%Y-%m-%d").timetuple()) * 1000
    except ValueError:
        return "Its day is not a day."
    if not walk["client_id"] or len(walk["client_id"]) > 64:
        return "Its name is longer than 64 characters."
    if end < start:
        return "It ends before it starts."
    if end - start > TWO_DAYS_MS:
        return "It lasts longer than two days."
    if start < YEAR_2000_MS:
        return "It starts before the year 2000."
    if start > now_ms + TWO_DAYS_MS:
        return "It starts in the days to come."
    if walk["seconds"] < 0:
        return "The time walked is not a number from zero up."
    if walk["seconds"] > MOST_SECONDS:
        return "The time walked is more than a day."
    if walk["seconds"] > (end - start) / 1000 + 60:
        return "The time walked is longer than the walk lasted."
    if walk["distance_m"] < 0:
        return "The distance is not a number from zero up."
    if walk["distance_m"] > MOST_METRES:
        return "The distance is more than 200 km (124 miles)."
    if walk["steps"] < 0:
        return "The steps are not a whole number from zero up."
    if walk["steps"] > MOST_STEPS:
        return "There are more than 400,000 steps."
    if walk["kcal"] < 0:
        return "The calories are not a number from zero up."
    if walk["kcal"] > MOST_KCAL:
        return "There are more than 20,000 kcal."
    extra = walk.get("kcal_extra")
    if extra is not None and (extra < 0 or extra > MOST_KCAL):
        return "The calories on top of sitting are not a number from 0 to 20,000."
    first_day = (start // DAY_MS) * DAY_MS - DAY_MS
    last_day = (end // DAY_MS) * DAY_MS + DAY_MS
    if day < first_day or day > last_day:
        return "Its day does not fit the time it started."
    return None
