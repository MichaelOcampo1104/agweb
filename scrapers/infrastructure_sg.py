"""
Scraper — Singapore infrastructure project pipeline (data.gov.sg + web sources).

Sources:
  - data.gov.sg: HDB Lift Upgrading Programme (LUP) — 41 projects
  - data.gov.sg: HDB Roads Under Construction — 27 projects
  - Future: LTA MRT project pages, URA commercial pipeline, GeBIZ tenders

B2B audience: construction firms, engineering contractors, material suppliers.
"""
from __future__ import annotations

import re
from typing import Any

from base import BaseScraper

# data.gov.sg API
API_BASE = "https://api-open.data.gov.sg/v1/public/api/datasets"
HDB_LUP_DATASET = "d_9b5886a025c8db1192a8fada42bd4330"
HDB_ROADS_DATASET = "d_157d034c579e12a095c967ca2a463d01"

SOURCE_URL = "https://data.gov.sg"


class InfrastructureSgScraper(BaseScraper):
    name = "infrastructure_sg"
    target_table = "infrastructure_projects"
    conflict_columns = "name,agency"

    def fetch(self) -> list[dict[str, Any]]:
        rows: list[dict[str, Any]] = []
        seen: set[tuple[str, str]] = set()  # dedupe on (name, agency)

        # 1. HDB Lift Upgrading Programme ---------------------------------------
        lup_data = self._fetch_geojson(HDB_LUP_DATASET)
        for feature in lup_data.get("features", []):
            row = self._parse_hdb_lup(feature)
            if row:
                key = (row["name"], row["agency"])
                if key not in seen:
                    seen.add(key)
                    rows.append(row)

        # 2. HDB Roads Under Construction --------------------------------------
        roads_data = self._fetch_geojson(HDB_ROADS_DATASET)
        for feature in roads_data.get("features", []):
            row = self._parse_hdb_road(feature)
            if row:
                key = (row["name"], row["agency"])
                if key not in seen:
                    seen.add(key)
                    rows.append(row)

        return rows

    # ------------------------------------------------------------------ helpers

    def _fetch_geojson(self, dataset_id: str) -> dict[str, Any]:
        """Download a data.gov.sg GeoJSON dataset via the poll-download API."""
        poll_url = f"{API_BASE}/{dataset_id}/poll-download"
        resp = self.get_text(poll_url)
        import json

        meta = json.loads(resp)
        if meta.get("code") != 0:
            raise RuntimeError(f"data.gov.sg API error for {dataset_id}: {meta.get('errMsg')}")

        geojson_text = self.get_text(meta["data"]["url"])
        return json.loads(geojson_text)

    def _parse_hdb_lup(self, feature: dict[str, Any]) -> dict[str, Any] | None:
        """Parse a HDB Lift Upgrading Programme feature."""
        props = feature.get("properties", {})
        name = props.get("NAME", "").strip()
        if not name:
            return None

        status = props.get("STATUS", "proposed")
        status_map = {"U/C": "under_construction", "Proposed": "proposed", "Completed": "completed"}
        mapped_status = status_map.get(status, "proposed")

        return {
            "name": name,
            "slug": slugify(name),
            "agency": "HDB",
            "project_type": "housing_upgrading",
            "status": mapped_status,
            "description": (props.get("DESCRIPTION") or "").strip() or None,
            "budget": None,
            "contractor_name": (props.get("CTRCTR_NAME") or "").strip() or None,
            "contractor_contact": (props.get("CTRCTR_CNTCT") or "").strip() or None,
            "location": None,
            "start_date": self._parse_date(props.get("CNSTRN_CMCMNT")),
            "expected_completion": (props.get("ESTMT_CNSTRN_CMPLTN") or "").strip() or None,
            "actual_completion": None,
            "source": self.name,
            "source_url": SOURCE_URL,
            "raw_payload": props,
        }

    def _parse_hdb_road(self, feature: dict[str, Any]) -> dict[str, Any] | None:
        """Parse a HDB Roads Under Construction feature."""
        props = feature.get("properties", {})
        name = (props.get("DESCRIPTION") or props.get("NAME") or "").strip()
        if not name or name == "HDB Road Works":
            return None  # skip generic placeholder names

        status = props.get("STATUS", "Under Construction")
        mapped_status = "under_construction" if "under construction" in status.lower() else "proposed"

        return {
            "name": name,
            "slug": slugify(name),
            "agency": "HDB",
            "project_type": "road",
            "status": mapped_status,
            "description": f"Road works: {name}",
            "budget": None,
            "contractor_name": (props.get("CTRCTR_NAME") or "").strip() or None,
            "contractor_contact": (props.get("CTRCTR_CNTCT") or "").strip() or None,
            "location": None,
            "start_date": self._parse_date(props.get("CNSTRN_CMCMNT")),
            "expected_completion": (props.get("ESTMT_CNSTRN_CMPLTN") or "").strip() or None,
            "actual_completion": None,
            "source": self.name,
            "source_url": SOURCE_URL,
            "raw_payload": props,
        }

    @staticmethod
    def _parse_date(val: Any) -> str | None:
        """Convert data.gov.sg date format (YYYYMMDD) to ISO."""
        if not val:
            return None
        s = str(val).strip()
        if len(s) == 8 and s.isdigit():
            return f"{s[:4]}-{s[4:6]}-{s[6:8]}"
        return s


def slugify(value: str) -> str:
    """URL-safe slug matching the DB's generated slug format."""
    import unicodedata

    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    value = re.sub(r"[^a-zA-Z0-9]+", "-", value).strip("-").lower()
    return value or "unknown"
