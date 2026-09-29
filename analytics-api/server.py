"""Small, privacy-aware analytics collector for davidrwijaya.site.

The service stores only allow-listed aggregate inputs. It never stores raw IP
addresses, full referrer URLs, form values, or arbitrary event properties.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import os
import re
import sqlite3
import threading
import time
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse


PORT = int(os.environ.get("PORT", "8080"))
DB_PATH = os.environ.get("ANALYTICS_DB_PATH", "/data/analytics.sqlite3")
SECRET = ""
ALLOWED_ORIGINS = {
    item.strip().rstrip("/")
    for item in os.environ.get(
        "ANALYTICS_ALLOWED_ORIGINS",
        "https://davidrwijaya.site,https://www.davidrwijaya.site",
    ).split(",")
    if item.strip()
}
RETENTION_DAYS = max(30, min(730, int(os.environ.get("ANALYTICS_RETENTION_DAYS", "730"))))
PRIVACY_THRESHOLD = max(3, min(20, int(os.environ.get("ANALYTICS_PRIVACY_THRESHOLD", "5"))))
MAX_BODY_BYTES = 4096
EVENT_LIMIT_PER_MINUTE = 120

EVENT_PROPERTIES = {
    "page_view": {},
    "project_open": {"projectSlug": "slug", "source": {"grid", "list", "sidebar", "unknown"}},
    "project_progress": {"projectSlug": "slug", "milestone": {50, 75, 100}},
    "cv_download": {"placement": {"about", "sidebar", "unknown"}},
    "contact_form_start": {},
    "contact_submit": {
        "outcome": {"success", "error"},
        "errorCategory": {"network", "timeout", "validation", "server", "unknown"},
    },
    "outbound_profile_click": {
        "destination": {"linkedin", "github", "instagram", "email"},
        "placement": {"sidebar", "contact", "unknown"},
    },
}
INTENT_EVENTS = {"cv_download", "contact_submit", "outbound_profile_click"}
RANGE_DAYS = {"7d": 7, "30d": 30, "90d": 90, "365d": 365}
SAFE_TEXT = re.compile(r"^[\w .:/+@-]+$", re.UNICODE)
SAFE_SLUG = re.compile(r"^[a-z0-9-]{1,80}$")
BOT_UA = re.compile(r"bot|crawler|spider|headless|lighthouse|pagespeed", re.I)

rate_lock = threading.Lock()
rate_buckets: dict[str, tuple[int, int]] = {}


def connect() -> sqlite3.Connection:
    db = sqlite3.connect(DB_PATH, timeout=5)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA journal_mode=WAL")
    db.execute("PRAGMA busy_timeout=5000")
    return db


def initialize() -> None:
    global SECRET
    os.makedirs(os.path.dirname(DB_PATH) or ".", exist_ok=True)
    configured_secret = os.environ.get("ANALYTICS_SECRET", "")
    secret_path = os.path.join(os.path.dirname(DB_PATH) or ".", ".analytics_secret")
    if len(configured_secret) >= 32:
        SECRET = configured_secret
    elif os.path.exists(secret_path):
        with open(secret_path, encoding="utf-8") as secret_file:
            SECRET = secret_file.read().strip()
    else:
        SECRET = os.urandom(32).hex()
        descriptor = os.open(secret_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(descriptor, "w", encoding="utf-8") as secret_file:
            secret_file.write(SECRET)
    with connect() as db:
        db.executescript(
            """
            CREATE TABLE IF NOT EXISTS events (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              created_at INTEGER NOT NULL,
              event_name TEXT NOT NULL,
              visitor_id TEXT NOT NULL,
              session_id TEXT NOT NULL,
              path TEXT NOT NULL,
              title TEXT NOT NULL DEFAULT '',
              referrer TEXT NOT NULL DEFAULT '',
              country TEXT NOT NULL DEFAULT '',
              region TEXT NOT NULL DEFAULT '',
              city TEXT NOT NULL DEFAULT '',
              device TEXT NOT NULL DEFAULT '',
              browser TEXT NOT NULL DEFAULT '',
              os TEXT NOT NULL DEFAULT '',
              screen TEXT NOT NULL DEFAULT '',
              locale TEXT NOT NULL DEFAULT '',
              utm_source TEXT NOT NULL DEFAULT '',
              utm_medium TEXT NOT NULL DEFAULT '',
              utm_campaign TEXT NOT NULL DEFAULT '',
              utm_content TEXT NOT NULL DEFAULT '',
              properties TEXT NOT NULL DEFAULT '{}'
            );
            CREATE INDEX IF NOT EXISTS events_created_at ON events(created_at);
            CREATE INDEX IF NOT EXISTS events_name_created ON events(event_name, created_at);
            CREATE INDEX IF NOT EXISTS events_session_created ON events(session_id, created_at);
            """
        )
        cutoff = int((time.time() - RETENTION_DAYS * 86400) * 1000)
        db.execute("DELETE FROM events WHERE created_at < ?", (cutoff,))


def compact(value: object, limit: int = 80) -> str:
    if not isinstance(value, str):
        return ""
    value = " ".join(value.strip().split())[:limit]
    return value if not value or SAFE_TEXT.fullmatch(value) else ""


def normalize_path(value: object) -> str:
    if not isinstance(value, str):
        return "/"
    path = urlparse(value).path[:180]
    if not path.startswith("/") or ".." in path:
        return "/"
    return path


def referrer_domain(value: object) -> str:
    if not isinstance(value, str) or not value:
        return ""
    try:
        host = (urlparse(value).hostname or "").lower()
    except ValueError:
        return ""
    if host in {"davidrwijaya.site", "www.davidrwijaya.site"}:
        return ""
    return host[:120] if re.fullmatch(r"[a-z0-9.-]+", host) else ""


def hash_value(value: str, purpose: str) -> str:
    return hmac.new(SECRET.encode(), f"{purpose}:{value}".encode(), hashlib.sha256).hexdigest()[:24]


def client_ip(headers) -> str:
    value = headers.get("cf-connecting-ip", "unknown")[:64].strip()
    return value if re.fullmatch(r"[0-9a-fA-F:.]+", value) else "unknown"


def visitor_id(ip: str, ua: str, now: datetime) -> str:
    # Daily rotation deliberately prevents long-term visitor profiling.
    return hash_value(f"{now:%Y-%m-%d}|{ip}|{ua[:240]}", "visitor")


def session_id(raw: object, ip: str, ua: str, now: datetime) -> str:
    candidate = raw if isinstance(raw, str) and re.fullmatch(r"[a-zA-Z0-9-]{8,64}", raw) else "missing"
    return hash_value(f"{now:%Y-%m-%d}|{candidate}|{ip}|{ua[:120]}", "session")


def user_agent_dimensions(ua: str, width: object) -> tuple[str, str, str, str]:
    if isinstance(width, int):
        screen = "<480" if width < 480 else "480–767" if width < 768 else "768–1023" if width < 1024 else "1024–1439" if width < 1440 else "1440+"
        device = "Mobile" if width < 768 else "Tablet" if width < 1024 else "Desktop"
    else:
        screen = "Unknown"
        device = "Mobile" if re.search(r"mobile|iphone|android", ua, re.I) else "Desktop"

    if "Edg/" in ua:
        browser = "Edge"
    elif "OPR/" in ua:
        browser = "Opera"
    elif "Chrome/" in ua or "CriOS/" in ua:
        browser = "Chrome"
    elif "Firefox/" in ua or "FxiOS/" in ua:
        browser = "Firefox"
    elif "Safari/" in ua:
        browser = "Safari"
    else:
        browser = "Other"

    if re.search(r"iphone|ipad|cpu (iphone )?os", ua, re.I):
        platform = "iOS"
    elif "Android" in ua:
        platform = "Android"
    elif "Windows" in ua:
        platform = "Windows"
    elif "Mac OS" in ua or "Macintosh" in ua:
        platform = "macOS"
    elif "Linux" in ua:
        platform = "Linux"
    else:
        platform = "Other"
    return device, browser, platform, screen


def safe_properties(event: str, value: object) -> dict[str, object]:
    source = value if isinstance(value, dict) else {}
    result: dict[str, object] = {}
    for key, rule in EVENT_PROPERTIES[event].items():
        candidate = source.get(key)
        if rule == "slug":
            if isinstance(candidate, str) and SAFE_SLUG.fullmatch(candidate):
                result[key] = candidate
        elif candidate in rule:
            result[key] = candidate
    return result


def rate_allowed(ip: str) -> bool:
    minute = int(time.time() // 60)
    key = hash_value(ip, "rate")
    with rate_lock:
        previous_minute, count = rate_buckets.get(key, (minute, 0))
        count = count + 1 if previous_minute == minute else 1
        rate_buckets[key] = (minute, count)
        if len(rate_buckets) > 5000:
            stale = [item for item, value in rate_buckets.items() if value[0] < minute - 1]
            for item in stale:
                rate_buckets.pop(item, None)
        return count <= EVENT_LIMIT_PER_MINUTE


def collect(payload: object, headers) -> tuple[int, dict[str, object]]:
    if len(SECRET) < 32:
        return 503, {"error": "collector_not_configured"}
    if not isinstance(payload, dict):
        return 400, {"error": "invalid_payload"}
    event = payload.get("event")
    if event not in EVENT_PROPERTIES:
        return 400, {"error": "unknown_event"}

    ua = headers.get("user-agent", "")[:300]
    if not ua or BOT_UA.search(ua):
        return 202, {"ok": True}
    ip = client_ip(headers)
    if not rate_allowed(ip):
        return 429, {"error": "rate_limited"}

    now = datetime.now(timezone.utc)
    device, browser, platform, screen = user_agent_dimensions(ua, payload.get("screenWidth"))
    row = (
        int(now.timestamp() * 1000),
        event,
        visitor_id(ip, ua, now),
        session_id(payload.get("sessionId"), ip, ua, now),
        normalize_path(payload.get("path")),
        compact(payload.get("title"), 120),
        referrer_domain(payload.get("referrer")),
        compact(headers.get("cf-ipcountry", ""), 2).upper(),
        compact(headers.get("cf-region-code", ""), 12).upper(),
        compact(headers.get("cf-ipcity", ""), 80),
        device,
        browser,
        platform,
        screen,
        compact(payload.get("locale"), 20),
        compact(payload.get("utmSource")),
        compact(payload.get("utmMedium")),
        compact(payload.get("utmCampaign")),
        compact(payload.get("utmContent")),
        json.dumps(safe_properties(event, payload.get("properties")), separators=(",", ":")),
    )
    with connect() as db:
        db.execute(
            """INSERT INTO events (
              created_at,event_name,visitor_id,session_id,path,title,referrer,
              country,region,city,device,browser,os,screen,locale,utm_source,
              utm_medium,utm_campaign,utm_content,properties
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            row,
        )
    return 202, {"ok": True}


def event_rows(start_ms: int, end_ms: int) -> list[dict[str, object]]:
    with connect() as db:
        rows = db.execute(
            "SELECT * FROM events WHERE created_at >= ? AND created_at < ? ORDER BY created_at",
            (start_ms, end_ms),
        ).fetchall()
    result = []
    for row in rows:
        item = dict(row)
        try:
            item["properties"] = json.loads(item["properties"])
        except (TypeError, json.JSONDecodeError):
            item["properties"] = {}
        result.append(item)
    return result


def summarize(rows: list[dict[str, object]]) -> dict[str, object]:
    pageviews = [row for row in rows if row["event_name"] == "page_view"]
    session_pages: dict[str, int] = defaultdict(int)
    for row in pageviews:
        session_pages[str(row["session_id"])] += 1
    sessions = set(session_pages)
    visitors = {str(row["visitor_id"]) for row in pageviews}
    intent_sessions = set()
    for row in rows:
        name = row["event_name"]
        props = row["properties"]
        if name in INTENT_EVENTS and not (name == "contact_submit" and props.get("outcome") != "success"):
            intent_sessions.add(str(row["session_id"]))
    bounces = sum(1 for count in session_pages.values() if count == 1)
    return {
        "pageviews": len(pageviews),
        "visitors": len(visitors),
        "sessions": len(sessions),
        "bounceRate": round(bounces * 100 / len(sessions), 1) if sessions else 0,
        "intentRate": round(len(intent_sessions) * 100 / len(sessions), 1) if sessions else 0,
    }


def percentage_change(current: float, previous: float) -> float | None:
    if previous == 0:
        return None
    return round((current - previous) * 100 / previous, 1)


def grouped_sessions(rows, key_name: str):
    groups: dict[str, set[str]] = defaultdict(set)
    visitors: dict[str, set[str]] = defaultdict(set)
    for row in rows:
        if row["event_name"] != "page_view":
            continue
        key = str(row.get(key_name) or "Unknown")
        groups[key].add(str(row["session_id"]))
        visitors[key].add(str(row["visitor_id"]))
    return groups, visitors


def dashboard(range_name: str) -> dict[str, object]:
    now_ms = int(time.time() * 1000)
    if range_name == "all":
        with connect() as db:
            first = db.execute("SELECT MIN(created_at) FROM events").fetchone()[0]
        start_ms = int(first or now_ms - 30 * 86400 * 1000)
    else:
        days = RANGE_DAYS.get(range_name, 30)
        start_ms = now_ms - days * 86400 * 1000
    span = now_ms - start_ms
    # event_rows uses an exclusive upper bound. Include events recorded in
    # the same millisecond as this dashboard request.
    current_rows = event_rows(start_ms, now_ms + 1)
    previous_rows = event_rows(max(0, start_ms - span), start_ms)
    current = summarize(current_rows)
    previous = summarize(previous_rows)
    comparison = {key: percentage_change(float(current[key]), float(previous[key])) for key in current}

    trend_buckets: dict[str, dict[str, object]] = defaultdict(lambda: {"pageviews": 0, "visitors": set()})
    for row in current_rows:
        if row["event_name"] != "page_view":
            continue
        day = datetime.fromtimestamp(int(row["created_at"]) / 1000, timezone.utc).strftime("%Y-%m-%d")
        trend_buckets[day]["pageviews"] = int(trend_buckets[day]["pageviews"]) + 1
        trend_buckets[day]["visitors"].add(row["visitor_id"])
    # Always return a continuous series, including confirmed zero-value days.
    # This keeps the public chart honest and useful before the first visit and
    # avoids visually implying that missing dates are missing telemetry.
    start_day = datetime.fromtimestamp(start_ms / 1000, timezone.utc).date()
    end_day = datetime.fromtimestamp(now_ms / 1000, timezone.utc).date()
    trend = []
    day = start_day
    while day <= end_day:
        key = day.isoformat()
        bucket = trend_buckets.get(key)
        trend.append({
            "date": key,
            "pageviews": int(bucket["pageviews"]) if bucket else 0,
            "visitors": len(bucket["visitors"]) if bucket else 0,
        })
        day += timedelta(days=1)

    realtime_rows = event_rows(now_ms - 5 * 60 * 1000, now_ms + 1)
    realtime = {
        "activeVisitors": len({str(row["visitor_id"]) for row in realtime_rows}),
        "activeSessions": len({str(row["session_id"]) for row in realtime_rows}),
        "eventsLast5Minutes": len(realtime_rows),
        "lastEventAt": (
            datetime.fromtimestamp(
                max(int(row["created_at"]) for row in current_rows) / 1000,
                timezone.utc,
            ).isoformat()
            if current_rows else None
        ),
    }

    location_sessions: dict[tuple[str, str], set[str]] = defaultdict(set)
    location_visitors: dict[tuple[str, str], set[str]] = defaultdict(set)
    for row in current_rows:
        if row["event_name"] != "page_view":
            continue
        country = str(row["country"] or "")
        if country in {"", "Unknown", "XX", "T1"}:
            continue
        city = str(row["city"] or "").strip()
        key = (city, country)
        location_sessions[key].add(str(row["session_id"]))
        location_visitors[key].add(str(row["visitor_id"]))

    locations = []
    for (city, country), session_set in location_sessions.items():
        if len(session_set) < PRIVACY_THRESHOLD:
            continue
        location_intent = {
            str(row["session_id"])
            for row in current_rows
            if str(row["session_id"]) in session_set and row["event_name"] in INTENT_EVENTS
        }
        locations.append({
            "city": city or None,
            "country": country,
            "sessions": len(session_set),
            "visitors": len(location_visitors[(city, country)]),
            "intentRate": round(len(location_intent) * 100 / len(session_set), 1),
        })
    # Known cities come first so historic country-only rows never obscure the
    # more useful city-level signal once Cloudflare starts supplying it.
    locations.sort(key=lambda item: (item["city"] is None, -item["sessions"], item["country"], item["city"] or ""))

    region_sessions: dict[tuple[str, str], set[str]] = defaultdict(set)
    city_sessions: dict[tuple[str, str, str], set[str]] = defaultdict(set)
    for row in current_rows:
        if row["event_name"] != "page_view":
            continue
        country = str(row["country"] or "")
        region = str(row["region"] or "")
        city = str(row["city"] or "")
        sid = str(row["session_id"])
        if country and region:
            region_sessions[(region, country)].add(sid)
        if country and region and city:
            city_sessions[(city, region, country)].add(sid)
    regions = [
        {"region": region, "country": country, "sessions": len(session_set)}
        for (region, country), session_set in region_sessions.items()
        if len(session_set) >= PRIVACY_THRESHOLD
    ]
    regions.sort(key=lambda item: item["sessions"], reverse=True)
    city_threshold = PRIVACY_THRESHOLD
    cities = [
        {"city": city, "region": region, "country": country, "sessions": len(session_set)}
        for (city, region, country), session_set in city_sessions.items()
        if len(session_set) >= city_threshold
    ]
    cities.sort(key=lambda item: item["sessions"], reverse=True)

    project_data: dict[str, dict[str, set[str] | int]] = defaultdict(lambda: {"views": 0, "visitors": set(), "sessions": set(), "engaged": set()})
    for row in current_rows:
        match = re.fullmatch(r"/works/([a-z0-9-]+)/?", str(row["path"]))
        props = row["properties"]
        slug = match.group(1) if match and row["event_name"] == "page_view" else props.get("projectSlug") if row["event_name"] == "project_progress" else None
        if not isinstance(slug, str) or not SAFE_SLUG.fullmatch(slug):
            continue
        if row["event_name"] == "page_view":
            project_data[slug]["views"] = int(project_data[slug]["views"]) + 1
            project_data[slug]["visitors"].add(str(row["visitor_id"]))
            project_data[slug]["sessions"].add(str(row["session_id"]))
        elif props.get("milestone") in {75, 100}:
            project_data[slug]["engaged"].add(str(row["session_id"]))
    projects = []
    for slug, data in project_data.items():
        session_count = len(data["sessions"])
        projects.append({
            "slug": slug,
            "views": data["views"],
            "visitors": len(data["visitors"]),
            "engagementRate": round(len(data["engaged"]) * 100 / session_count, 1) if session_count else 0,
        })
    projects.sort(key=lambda item: item["views"], reverse=True)

    first_page_by_session = {}
    for row in current_rows:
        if row["event_name"] == "page_view":
            first_page_by_session.setdefault(str(row["session_id"]), row)
    source_sessions: dict[str, set[str]] = defaultdict(set)
    for sid, row in first_page_by_session.items():
        source = str(row["utm_source"] or row["referrer"] or "Direct")
        source_sessions[source].add(sid)
    successful_intent = {
        str(row["session_id"])
        for row in current_rows
        if row["event_name"] in INTENT_EVENTS
        and not (row["event_name"] == "contact_submit" and row["properties"].get("outcome") != "success")
    }
    sources = [
        {
            "source": source,
            "sessions": len(session_set),
            "intentRate": round(len(session_set & successful_intent) * 100 / len(session_set), 1),
        }
        for source, session_set in source_sessions.items()
    ]
    sources.sort(key=lambda item: item["sessions"], reverse=True)

    device_sessions, _ = grouped_sessions(current_rows, "device")
    devices = [
        {"device": device, "sessions": len(session_set)}
        for device, session_set in device_sessions.items()
    ]
    devices.sort(key=lambda item: item["sessions"], reverse=True)

    all_sessions = set(first_page_by_session)
    project_sessions = {
        str(row["session_id"])
        for row in current_rows
        if row["event_name"] == "page_view" and re.fullmatch(r"/works/[a-z0-9-]+/?", str(row["path"]))
    }
    engaged_sessions = {
        str(row["session_id"])
        for row in current_rows
        if row["event_name"] == "project_progress" and row["properties"].get("milestone") in {75, 100}
    }
    funnel = [
        {"label": "Visited", "sessions": len(all_sessions)},
        {"label": "Opened a project", "sessions": len(project_sessions)},
        {"label": "Read 75%", "sessions": len(engaged_sessions)},
        {"label": "High intent", "sessions": len(successful_intent)},
    ]

    insights = []
    if len(all_sessions) >= 30:
        if projects:
            best = max((item for item in projects if item["views"] >= PRIVACY_THRESHOLD), key=lambda item: item["engagementRate"], default=None)
            if best:
                insights.append({"title": "Strongest project", "body": f"{best['slug'].replace('-', ' ').title()} keeps {best['engagementRate']}% of sessions to at least 75% depth."})
        qualified_sources = [item for item in sources if item["sessions"] >= PRIVACY_THRESHOLD]
        if qualified_sources:
            best_source = max(qualified_sources, key=lambda item: item["intentRate"])
            if best_source["intentRate"] > 0:
                insights.append({"title": "Highest-intent source", "body": f"{best_source['source']} converts {best_source['intentRate']}% of sessions into a CV, contact, or profile action."})
        if comparison["visitors"] is not None:
            direction = "up" if comparison["visitors"] >= 0 else "down"
            insights.append({"title": "Audience change", "body": f"Visitors are {direction} {abs(comparison['visitors'])}% versus the previous matching period."})

    return {
        "meta": {
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "range": range_name,
            "startAt": datetime.fromtimestamp(start_ms / 1000, timezone.utc).isoformat(),
            "privacyThreshold": PRIVACY_THRESHOLD,
            "hasData": bool(current_rows),
        },
        "stats": {"current": current, "comparison": comparison},
        "realtime": realtime,
        "trend": trend,
        "locations": locations[:12],
        "regions": regions[:8],
        "cities": cities[:8],
        "projects": projects[:12],
        "sources": sources[:12],
        "devices": devices,
        "funnel": funnel,
        "insights": insights,
    }


class Handler(BaseHTTPRequestHandler):
    server_version = "DRW-Analytics"
    sys_version = ""

    def log_message(self, fmt: str, *args) -> None:
        # Do not write client IP addresses to application logs.
        print(f"[analytics] {self.command} {self.path.split('?')[0]} {args[1] if len(args) > 1 else ''}", flush=True)

    def origin(self) -> str | None:
        origin = self.headers.get("Origin", "").rstrip("/")
        return origin if origin in ALLOWED_ORIGINS else None

    def send_json(self, status: int, data: object, cache: str = "no-store") -> None:
        body = json.dumps(data, separators=(",", ":")).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", cache)
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        origin = self.origin()
        if origin:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:
        if not self.origin():
            self.send_json(403, {"error": "origin_not_allowed"})
            return
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", self.origin())
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Max-Age", "86400")
        self.send_header("Vary", "Origin")
        self.end_headers()

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/health":
            self.send_json(200, {"status": "ok"}, "no-store")
            return
        if parsed.path == "/v1/public/dashboard":
            # When CMS owns visibility, only its server-side proxy can read data.
            service_token = os.environ.get("CMS_ANALYTICS_SERVICE_TOKEN", "")
            if service_token and not hmac.compare_digest(self.headers.get("X-Cms-Service-Token", ""), service_token):
                self.send_json(404, {"error": "not_found"}, "no-store")
                return
            range_name = parse_qs(parsed.query).get("range", ["30d"])[0]
            if range_name not in {*RANGE_DAYS, "all"}:
                self.send_json(400, {"error": "invalid_range"})
                return
            self.send_json(200, dashboard(range_name), "no-store")
            return
        self.send_json(404, {"error": "not_found"})

    def do_POST(self) -> None:
        if urlparse(self.path).path != "/v1/collect":
            self.send_json(404, {"error": "not_found"})
            return
        if not self.origin():
            self.send_json(403, {"error": "origin_not_allowed"})
            return
        if not self.headers.get("Content-Type", "").lower().startswith("application/json"):
            self.send_json(415, {"error": "content_type"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            length = 0
        if length <= 0 or length > MAX_BODY_BYTES:
            self.send_json(413 if length > MAX_BODY_BYTES else 400, {"error": "body_size"})
            return
        try:
            payload = json.loads(self.rfile.read(length))
        except (UnicodeDecodeError, json.JSONDecodeError):
            self.send_json(400, {"error": "invalid_json"})
            return
        status, response = collect(payload, self.headers)
        self.send_json(status, response)


if __name__ == "__main__":
    initialize()
    print(f"[analytics] listening on :{PORT}", flush=True)
    ThreadingHTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
