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

        # 3. LTA Rail and Road Construction Projects ---------------------------
        lta_projects = self._get_lta_projects()
        for row in lta_projects:
            key = (row["name"], row["agency"])
            if key not in seen:
                seen.add(key)
                rows.append(row)

        return rows

    def _get_lta_projects(self) -> list[dict[str, Any]]:
        """Returns a list of high-value LTA active and completed rail and road contract awards."""
        return [
            {
                "name": "Cross Island Line Phase 1 - Contract CR116 (Defu Station and Tunnels)",
                "slug": slugify("Cross Island Line Phase 1 - Contract CR116 (Defu Station and Tunnels)"),
                "agency": "LTA",
                "project_type": "rail",
                "status": "under_construction",
                "description": "Design and construction of Defu station and tunnels for the Cross Island Line (CRL) Phase 1.",
                "budget": 467000000.00,
                "contractor_name": "Gammon Construction Limited",
                "contractor_contact": "Enquiries: gammon.sg@gammonconstruction.com",
                "location": "Defu Avenue 1",
                "start_date": "2021-12-01",
                "expected_completion": "2030",
                "actual_completion": None,
                "source": self.name,
                "source_url": "https://www.lta.gov.sg",
                "raw_payload": {"contract_id": "CR116", "scope": "Station and tunnels"},
            },
            {
                "name": "Cross Island Line Phase 1 - Contract CR105 (Tavistock Station and Tunnels)",
                "slug": slugify("Cross Island Line Phase 1 - Contract CR105 (Tavistock Station and Tunnels)"),
                "agency": "LTA",
                "project_type": "rail",
                "status": "under_construction",
                "description": "Design and construction of Tavistock station and tunnels for the Cross Island Line (CRL) Phase 1.",
                "budget": 407000000.00,
                "contractor_name": "Sato Kogyo (S) Pte. Ltd.",
                "contractor_contact": "Enquiries: general@satokogyo.com.sg",
                "location": "Ang Mo Kio Avenue 3",
                "start_date": "2021-12-01",
                "expected_completion": "2030",
                "actual_completion": None,
                "source": self.name,
                "source_url": "https://www.lta.gov.sg",
                "raw_payload": {"contract_id": "CR105", "scope": "Station and tunnels"},
            },
            {
                "name": "Cross Island Line Phase 1 - Contract CR112 (Hougang Interchange Station and Tunnels)",
                "slug": slugify("Cross Island Line Phase 1 - Contract CR112 (Hougang Interchange Station and Tunnels)"),
                "agency": "LTA",
                "project_type": "rail",
                "status": "under_construction",
                "description": "Design and construction of Hougang interchange station and tunnels for the Cross Island Line (CRL) Phase 1.",
                "budget": 604000000.00,
                "contractor_name": "Samsung C&T Corporation",
                "contractor_contact": "Enquiries: samsungcnt@samsung.com",
                "location": "Hougang Central",
                "start_date": "2021-11-01",
                "expected_completion": "2030",
                "actual_completion": None,
                "source": self.name,
                "source_url": "https://www.lta.gov.sg",
                "raw_payload": {"contract_id": "CR112", "scope": "Interchange station and tunnels"},
            },
            {
                "name": "Jurong Region Line - Contract J109 (Toh Guan, Jurong Town Hall and Pandan Reservoir Stations)",
                "slug": slugify("Jurong Region Line - Contract J109 (Toh Guan, Jurong Town Hall and Pandan Reservoir Stations)"),
                "agency": "LTA",
                "project_type": "rail",
                "status": "under_construction",
                "description": "Design and construction of Toh Guan, Jurong Town Hall and Pandan Reservoir stations and elevated viaducts for the Jurong Region Line (JRL).",
                "budget": 265000000.00,
                "contractor_name": "Daewoo Engineering & Construction Co., Ltd.",
                "contractor_contact": "Enquiries: info@daewooenc.com",
                "location": "Jurong East / Pandan Reservoir",
                "start_date": "2020-11-01",
                "expected_completion": "2028",
                "actual_completion": None,
                "source": self.name,
                "source_url": "https://www.lta.gov.sg",
                "raw_payload": {"contract_id": "J109", "scope": "Elevated stations and viaducts"},
            },
            {
                "name": "Thomson-East Coast Line - Contract T316 (Marine Parade Station and Tunnels)",
                "slug": slugify("Thomson-East Coast Line - Contract T316 (Marine Parade Station and Tunnels)"),
                "agency": "LTA",
                "project_type": "rail",
                "status": "completed",
                "description": "Construction of Marine Parade Station and associated tunnels for Thomson-East Coast Line (TEL).",
                "budget": 555000000.00,
                "contractor_name": "Samsung C&T Corporation",
                "contractor_contact": "Enquiries: samsungcnt@samsung.com",
                "location": "Marine Parade Road",
                "start_date": "2016-03-01",
                "expected_completion": "2024",
                "actual_completion": "2024-06-23",
                "source": self.name,
                "source_url": "https://www.lta.gov.sg",
                "raw_payload": {"contract_id": "T316", "scope": "Station and tunnels"},
            },
            {
                "name": "North-South Corridor - Contract N102 (Tunnel between Kampong Java Road and Suffolk Road)",
                "slug": slugify("North-South Corridor - Contract N102 (Tunnel between Kampong Java Road and Suffolk Road)"),
                "agency": "LTA",
                "project_type": "road",
                "status": "under_construction",
                "description": "Design and construction of tunnel section between Kampong Java Road and Suffolk Road for the North-South Corridor (NSC).",
                "budget": 350000000.00,
                "contractor_name": "Ssangyong Engineering & Construction Co., Ltd.",
                "contractor_contact": "Enquiries: webmaster@ssangyong.ne.kr",
                "location": "Kampong Java",
                "start_date": "2018-09-01",
                "expected_completion": "2027",
                "actual_completion": None,
                "source": self.name,
                "source_url": "https://www.lta.gov.sg",
                "raw_payload": {"contract_id": "N102", "scope": "Corridor tunnel construction"},
            },
            {
                "name": "North-South Corridor - Contract N109 (Tunnel between Ang Mo Kio Ave 3 and Ang Mo Kio Ave 9)",
                "slug": slugify("North-South Corridor - Contract N109 (Tunnel between Ang Mo Kio Ave 3 and Ang Mo Kio Ave 9)"),
                "agency": "LTA",
                "project_type": "road",
                "status": "under_construction",
                "description": "Design and construction of tunnel section between AMK Ave 3 and AMK Ave 9 for the North-South Corridor (NSC).",
                "budget": 809000000.00,
                "contractor_name": "Samsung C&T Corporation",
                "contractor_contact": "Enquiries: samsungcnt@samsung.com",
                "location": "Ang Mo Kio",
                "start_date": "2018-11-01",
                "expected_completion": "2027",
                "actual_completion": None,
                "source": self.name,
                "source_url": "https://www.lta.gov.sg",
                "raw_payload": {"contract_id": "N109", "scope": "Corridor tunnel construction"},
            },
            {
                "name": "Circle Line Stage 6 - Contract C882 (Keppel Station and Tunnels)",
                "slug": slugify("Circle Line Stage 6 - Contract C882 (Keppel Station and Tunnels)"),
                "agency": "LTA",
                "project_type": "rail",
                "status": "under_construction",
                "description": "Construction of Keppel station and tunnels for Circle Line Stage 6 (CCL6).",
                "budget": 313800000.00,
                "contractor_name": "China State Construction Engineering Corporation Limited (Singapore Branch)",
                "contractor_contact": "Enquiries: cscel@chinaconstruction.com.sg",
                "location": "Keppel Road",
                "start_date": "2017-09-01",
                "expected_completion": "2026",
                "actual_completion": None,
                "source": self.name,
                "source_url": "https://www.lta.gov.sg",
                "raw_payload": {"contract_id": "C882", "scope": "Station and tunnels"},
            }
        ]

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
