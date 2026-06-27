"""
Base infrastructure shared by all scrapers.

Each scraper subclasses BaseScraper and implements `fetch()` (returns a list of
plain dicts) and `table()` (returns the target table name). The base class
handles:
  • HTTP fetch with retries + realistic headers
  • Downloading binary files (PDFs) to ./downloads/
  • Upserting rows into Supabase (dedupe by the table's natural key)
  • Logging a row to scrape_runs
  • In-memory dry-run mode for local testing without touching the DB

Environment variables (read from the repo-root .env):
  SUPABASE_URL              your project URL
  SUPABASE_SERVICE_ROLE_KEY service-role key (scrapers MUST use the service key,
                            never the anon key — anon has no write access by design)
"""
from __future__ import annotations

import os
import time
import datetime as dt
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Iterable

import httpx
from dotenv import load_dotenv

# .env lives at the repo root (one level above /scrapers)
_REPO_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(_REPO_ROOT / ".env")

DOWNLOAD_DIR = Path(__file__).resolve().parent / "downloads"
DOWNLOAD_DIR.mkdir(exist_ok=True)

# Realistic browser headers — many gov portals block default httpx UA strings.
HTTP_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}


@dataclass
class ScrapeResult:
    """Outcome of one scraper run, surfaced to the CLI and logged to the DB."""
    source: str
    status: str = "success"          # success | error | partial
    rows_fetched: int = 0
    rows_upserted: int = 0
    error_message: str | None = None
    started_at: dt.datetime = field(default_factory=dt.datetime.utcnow)
    finished_at: dt.datetime | None = None


class ScraperError(Exception):
    pass


class BaseScraper:
    """Common fetch + persist logic. Subclasses provide the source-specific bits."""

    #: short identifier stored in the `source` column, e.g. "jakim_foreign_cb"
    name: str = "base"
    #: target table: "manufacturers" or "certification_bodies"
    target_table: str = "certification_bodies"

    def __init__(self) -> None:
        self.url = os.getenv("SUPABASE_URL", "")
        self.service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
        self._client = None  # lazy

    # ------------------------------------------------------------------ DB
    @property
    def client(self):
        """Lazy Supabase client. Only constructed when we actually persist."""
        if self._client is None:
            if not self.url or not self.service_key:
                raise ScraperError(
                    "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set. "
                    "Add them to the repo-root .env (see .env.example)."
                )
            from supabase import create_client, Client

            self._client = create_client(self.url, self.service_key)
        return self._client

    # ---------------------------------------------------- methods to override
    def fetch(self) -> list[dict[str, Any]]:
        """Return a list of row dicts. Override in each subclass."""
        raise NotImplementedError

    def before_upsert(self) -> None:
        """Hook run immediately before upserting, with the DB client available.
        Override to delete stale rows from a previous run of THIS source, so
        re-runs are idempotent (no orphans left behind when names change).
        Default: do nothing."""
        return None

    # -------------------------------------------------------------- upserting
    def _dedupe_key(self, row: dict[str, Any]) -> dict[str, Any]:
        """Columns that uniquely identify a row (must match a UNIQUE constraint)."""
        if self.target_table == "certification_bodies":
            return {"name": row["name"], "country": row.get("country")}
        return {"name": row["name"], "country": row["country"]}

    def upsert(self, rows: Iterable[dict[str, Any]]) -> int:
        """Upsert rows into the target table, returning the count written."""
        rows = list(rows)
        if not rows:
            return 0
        table = self.client.table(self.target_table)
        # on_conflict matches the natural unique constraint on each table
        res = table.upsert(
            rows, on_conflict="name,country"
        ).execute()
        return len(res.data or [])

    # ----------------------------------------------------------- run logging
    def _log_run(self, result: ScrapeResult) -> None:
        """Record this run in scrape_runs (service role only)."""
        try:
            self.client.table("scrape_runs").insert({
                "source": result.source,
                "status": result.status,
                "rows_fetched": result.rows_fetched,
                "rows_upserted": result.rows_upserted,
                "error_message": result.error_message,
                "started_at": result.started_at.isoformat(),
                "finished_at": (result.finished_at or dt.datetime.utcnow()).isoformat(),
            }).execute()
        except Exception:
            # Logging is best-effort — never fail the run because logging failed.
            pass

    # --------------------------------------------------------------- runtime
    def run(self, dry_run: bool = False) -> ScrapeResult:
        """Execute fetch → (optionally) upsert → log. Returns the result."""
        result = ScrapeResult(source=self.name)
        try:
            rows = self.fetch()
            result.rows_fetched = len(rows)
            if dry_run:
                print(f"[dry-run] {self.name}: fetched {len(rows)} rows (not persisted)")
                for r in rows[:5]:
                    print(f"          sample: {r}")
            else:
                self.before_upsert()                       # prune stale rows first
                written = self.upsert(rows)
                result.rows_upserted = written
                print(f"[ok] {self.name}: fetched {len(rows)}, upserted {written}")
        except Exception as exc:  # surface as a failed run, don't raise
            result.status = "error"
            result.error_message = str(exc)
            print(f"[error] {self.name}: {exc}")
        finally:
            result.finished_at = dt.datetime.utcnow()
            if not dry_run:
                self._log_run(result)
        return result

    # --------------------------------------------------------- HTTP helpers
    @staticmethod
    def get_text(url: str, *, retries: int = 3, timeout: float = 30.0) -> str:
        """GET a URL and return text, retrying transient failures."""
        last_exc: Exception | None = None
        with httpx.Client(headers=HTTP_HEADERS, follow_redirects=True, timeout=timeout) as c:
            for attempt in range(1, retries + 1):
                try:
                    r = c.get(url)
                    r.raise_for_status()
                    return r.text
                except httpx.HTTPError as exc:
                    last_exc = exc
                    time.sleep(1.5 * attempt)
        raise ScraperError(f"GET {url} failed after {retries} attempts: {last_exc}")

    @staticmethod
    def download(url: str, filename: str) -> Path:
        """Download a binary file (PDF, etc.) into ./downloads/ and return its path."""
        dest = DOWNLOAD_DIR / filename
        with httpx.Client(headers=HTTP_HEADERS, follow_redirects=True, timeout=60.0) as c:
            with c.stream("GET", url) as r:
                r.raise_for_status()
                with open(dest, "wb") as f:
                    for chunk in r.iter_bytes():
                        f.write(chunk)
        return dest
