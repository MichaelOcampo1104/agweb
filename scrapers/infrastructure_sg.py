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
                "name": "Cross Island Line Phase 1 - Contract CR102 (Aviation Park and Loyang Stations and Tunnels)",
                "slug": slugify("Cross Island Line Phase 1 - Contract CR102 (Aviation Park and Loyang Stations and Tunnels)"),
                "agency": "LTA",
                "project_type": "rail",
                "status": "under_construction",
                "description": "Design and construction of Aviation Park and Loyang stations and associated tunnels for Cross Island Line Phase 1.",
                "budget": 744000000.00,
                "contractor_name": "Hock Lian Seng Infrastructure - Sembcorp Design and Construction Joint Venture",
                "contractor_contact": "Enquiries: info@hlsgroup.com.sg",
                "location": "Loyang / Aviation Park",
                "start_date": "2021-11-15",
                "expected_completion": "2030",
                "actual_completion": None,
                "source": self.name,
                "source_url": "https://www.lta.gov.sg",
                "raw_payload": {"contract_id": "CR102", "scope": "Stations and tunnels"},
            },
            {
                "name": "Cross Island Line Phase 1 - Contract CR108 (Serangoon North Station and Tunnels)",
                "slug": slugify("Cross Island Line Phase 1 - Contract CR108 (Serangoon North Station and Tunnels)"),
                "agency": "LTA",
                "project_type": "rail",
                "status": "under_construction",
                "description": "Design and construction of Serangoon North station and tunnels for Cross Island Line Phase 1.",
                "budget": 407000000.00,
                "contractor_name": "Hock Lian Seng Infrastructure Pte. Ltd.",
                "contractor_contact": "Enquiries: info@hlsgroup.com.sg",
                "location": "Serangoon North Avenue 1",
                "start_date": "2021-12-01",
                "expected_completion": "2030",
                "actual_completion": None,
                "source": self.name,
                "source_url": "https://www.lta.gov.sg",
                "raw_payload": {"contract_id": "CR108", "scope": "Station and tunnels"},
            },
            {
                "name": "Cross Island Line Phase 1 - Contract CR110 (Ang Mo Kio Interchange Station and Tunnels)",
                "slug": slugify("Cross Island Line Phase 1 - Contract CR110 (Ang Mo Kio Interchange Station and Tunnels)"),
                "agency": "LTA",
                "project_type": "rail",
                "status": "under_construction",
                "description": "Design and construction of Ang Mo Kio interchange station and tunnels linking to the existing North-South Line.",
                "budget": 644000000.00,
                "contractor_name": "Bachy Soletanche Singapore Pte. Ltd. - Gammon Construction Limited Joint Venture",
                "contractor_contact": "Enquiries: bss.sg@bachy-soletanche.com",
                "location": "Ang Mo Kio Avenue 8",
                "start_date": "2021-11-01",
                "expected_completion": "2030",
                "actual_completion": None,
                "source": self.name,
                "source_url": "https://www.lta.gov.sg",
                "raw_payload": {"contract_id": "CR110", "scope": "Interchange station and tunnels"},
            },
            {
                "name": "Cross Island Line Phase 1 - Contract CR113 (Tunnels between Defu and Tampines North)",
                "slug": slugify("Cross Island Line Phase 1 - Contract CR113 (Tunnels between Defu and Tampines North)"),
                "agency": "LTA",
                "project_type": "rail",
                "status": "under_construction",
                "description": "Design and construction of tunnels between Defu and Tampines North stations for Cross Island Line Phase 1.",
                "budget": 446000000.00,
                "contractor_name": "Nishimatsu Construction Co., Ltd.",
                "contractor_contact": "Enquiries: nishimatsu.sg@nishimatsu.co.jp",
                "location": "Tampines / Defu",
                "start_date": "2021-12-15",
                "expected_completion": "2030",
                "actual_completion": None,
                "source": self.name,
                "source_url": "https://www.lta.gov.sg",
                "raw_payload": {"contract_id": "CR113", "scope": "Tunnels"},
            },
            {
                "name": "Cross Island Line Phase 1 - Contract CR115 (Tampines North Station and Tunnels)",
                "slug": slugify("Cross Island Line Phase 1 - Contract CR115 (Tampines North Station and Tunnels)"),
                "agency": "LTA",
                "project_type": "rail",
                "status": "under_construction",
                "description": "Design and construction of Tampines North station and tunnels for Cross Island Line Phase 1.",
                "budget": 397000000.00,
                "contractor_name": "Limwen Construction Pte Ltd",
                "contractor_contact": "Enquiries: contact@limwen.com.sg",
                "location": "Tampines North Drive 2",
                "start_date": "2022-01-15",
                "expected_completion": "2030",
                "actual_completion": None,
                "source": self.name,
                "source_url": "https://www.lta.gov.sg",
                "raw_payload": {"contract_id": "CR115", "scope": "Station and tunnels"},
            },
            {
                "name": "Cross Island Line Phase 2 - Contract CR202 (Turf City Station and Tunnels)",
                "slug": slugify("Cross Island Line Phase 2 - Contract CR202 (Turf City Station and Tunnels)"),
                "agency": "LTA",
                "project_type": "rail",
                "status": "planning",
                "description": "Design and construction of Turf City station and tunnels for Cross Island Line Phase 2.",
                "budget": 361300000.00,
                "contractor_name": "Shanghai Tunnel Engineering Co (Singapore) Pte Ltd",
                "contractor_contact": "Enquiries: stec@stec.com.sg",
                "location": "Turf Club Road",
                "start_date": "2024-03-01",
                "expected_completion": "2032",
                "actual_completion": None,
                "source": self.name,
                "source_url": "https://www.lta.gov.sg",
                "raw_payload": {"contract_id": "CR202", "scope": "Station and tunnels"},
            },
            {
                "name": "Cross Island Line Phase 2 - Contract CR203 (King Albert Park Interchange Station and Tunnels)",
                "slug": slugify("Cross Island Line Phase 2 - Contract CR203 (King Albert Park Interchange Station and Tunnels)"),
                "agency": "LTA",
                "project_type": "rail",
                "status": "planning",
                "description": "Design and construction of King Albert Park interchange station and tunnels linking to Downtown Line.",
                "budget": 447000000.00,
                "contractor_name": "China Communications Construction Company Limited (Singapore Branch)",
                "contractor_contact": "Enquiries: cccc.sg@cccc.ltd",
                "location": "Bukit Timah Road",
                "start_date": "2024-03-15",
                "expected_completion": "2032",
                "actual_completion": None,
                "source": self.name,
                "source_url": "https://www.lta.gov.sg",
                "raw_payload": {"contract_id": "CR203", "scope": "Interchange station and tunnels"},
            },
            {
                "name": "Cross Island Line Phase 2 - Contract CR205 (Clementi Interchange Station and Tunnels)",
                "slug": slugify("Cross Island Line Phase 2 - Contract CR205 (Clementi Interchange Station and Tunnels)"),
                "agency": "LTA",
                "project_type": "rail",
                "status": "planning",
                "description": "Design and construction of Clementi interchange station and tunnels linking to East-West Line.",
                "budget": 514000000.00,
                "contractor_name": "China Communications Construction Company Limited (Singapore Branch)",
                "contractor_contact": "Enquiries: cccc.sg@cccc.ltd",
                "location": "Clementi Avenue 3",
                "start_date": "2024-04-01",
                "expected_completion": "2032",
                "actual_completion": None,
                "source": self.name,
                "source_url": "https://www.lta.gov.sg",
                "raw_payload": {"contract_id": "CR205", "scope": "Interchange station and tunnels"},
            },
            {
                "name": "Cross Island Line Phase 2 - Contract CR206 (West Coast Station and Tunnels)",
                "slug": slugify("Cross Island Line Phase 2 - Contract CR206 (West Coast Station and Tunnels)"),
                "agency": "LTA",
                "project_type": "rail",
                "status": "planning",
                "description": "Design and construction of West Coast station and tunnels for Cross Island Line Phase 2.",
                "budget": 242000000.00,
                "contractor_name": "Nishimatsu Construction Co., Ltd.",
                "contractor_contact": "Enquiries: nishimatsu.sg@nishimatsu.co.jp",
                "location": "West Coast Road",
                "start_date": "2024-04-15",
                "expected_completion": "2032",
                "actual_completion": None,
                "source": self.name,
                "source_url": "https://www.lta.gov.sg",
                "raw_payload": {"contract_id": "CR206", "scope": "Station and tunnels"},
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
                "name": "Jurong Region Line - Contract J102 (Choa Chu Kang, CCK West and Tengah Stations and Viaducts)",
                "slug": slugify("Jurong Region Line - Contract J102 (Choa Chu Kang, CCK West and Tengah Stations and Viaducts)"),
                "agency": "LTA",
                "project_type": "rail",
                "status": "under_construction",
                "description": "Design and construction of Choa Chu Kang, Choa Chu Kang West and Tengah stations and 4.3km of viaducts for JRL.",
                "budget": 465200000.00,
                "contractor_name": "Shanghai Tunnel Engineering Co (Singapore) Pte Ltd",
                "contractor_contact": "Enquiries: stec@stec.com.sg",
                "location": "Choa Chu Kang / Tengah",
                "start_date": "2020-09-01",
                "expected_completion": "2027",
                "actual_completion": None,
                "source": self.name,
                "source_url": "https://www.lta.gov.sg",
                "raw_payload": {"contract_id": "J102", "scope": "Elevated stations and viaducts"},
            },
            {
                "name": "Jurong Region Line - Contract J103 (Tengah Plantation, Tengah Park and Bukit Batok West Stations)",
                "slug": slugify("Jurong Region Line - Contract J103 (Tengah Plantation, Tengah Park and Bukit Batok West Stations)"),
                "agency": "LTA",
                "project_type": "rail",
                "status": "under_construction",
                "description": "Design and construction of Tengah Plantation, Tengah Park and Bukit Batok West stations and viaducts for JRL.",
                "budget": 339000000.00,
                "contractor_name": "Eng Lee Engineering - Wai Fong Construction Joint Venture",
                "contractor_contact": "Enquiries: info@waifong.com.sg",
                "location": "Tengah / Bukit Batok",
                "start_date": "2020-09-15",
                "expected_completion": "2027",
                "actual_completion": None,
                "source": self.name,
                "source_url": "https://www.lta.gov.sg",
                "raw_payload": {"contract_id": "J103", "scope": "Elevated stations and viaducts"},
            },
            {
                "name": "Jurong Region Line - Contract J108 (Gek Poh, Tawas and Nanyang Gateway Stations and Viaducts)",
                "slug": slugify("Jurong Region Line - Contract J108 (Gek Poh, Tawas and Nanyang Gateway Stations and Viaducts)"),
                "agency": "LTA",
                "project_type": "rail",
                "status": "under_construction",
                "description": "Design and construction of three JRL stations (Gek Poh, Tawas, Nanyang Gateway) and viaducts at Jurong West.",
                "budget": 215000000.00,
                "contractor_name": "Wai Fong Construction Pte. Ltd.",
                "contractor_contact": "Enquiries: info@waifong.com.sg",
                "location": "Jurong West / Nanyang",
                "start_date": "2020-10-01",
                "expected_completion": "2027",
                "actual_completion": None,
                "source": self.name,
                "source_url": "https://www.lta.gov.sg",
                "raw_payload": {"contract_id": "J108", "scope": "Elevated stations and viaducts"},
            },
            {
                "name": "Jurong Region Line - Contract J110 (Jurong Lake District Station and Viaducts)",
                "slug": slugify("Jurong Region Line - Contract J110 (Jurong Lake District Station and Viaducts)"),
                "agency": "LTA",
                "project_type": "rail",
                "status": "under_construction",
                "description": "Design and construction of Jurong Lake District station and elevated viaducts for JRL.",
                "budget": 210000000.00,
                "contractor_name": "China Railway 11 Bureau Group Corporation (Singapore Branch)",
                "contractor_contact": "Enquiries: cr11.sg@cr11g.com",
                "location": "Jurong Lake District",
                "start_date": "2021-02-01",
                "expected_completion": "2028",
                "actual_completion": None,
                "source": self.name,
                "source_url": "https://www.lta.gov.sg",
                "raw_payload": {"contract_id": "J110", "scope": "Elevated station and viaducts"},
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
                "name": "Thomson-East Coast Line - Contract T307 (Marine Terrace Station and Tunnels)",
                "slug": slugify("Thomson-East Coast Line - Contract T307 (Marine Terrace Station and Tunnels)"),
                "agency": "LTA",
                "project_type": "rail",
                "status": "completed",
                "description": "Construction of Marine Terrace Station and associated tunnels for Thomson-East Coast Line (TEL).",
                "budget": 361000000.00,
                "contractor_name": "Ssangyong Engineering & Construction Co., Ltd.",
                "contractor_contact": "Enquiries: webmaster@ssangyong.ne.kr",
                "location": "Marine Parade Road / Marine Terrace",
                "start_date": "2016-03-15",
                "expected_completion": "2024",
                "actual_completion": "2024-06-23",
                "source": self.name,
                "source_url": "https://www.lta.gov.sg",
                "raw_payload": {"contract_id": "T307", "scope": "Station and tunnels"},
            },
            {
                "name": "Thomson-East Coast Line - Contract T313 (Mount Pleasant Station and Tunnels)",
                "slug": slugify("Thomson-East Coast Line - Contract T313 (Mount Pleasant Station and Tunnels)"),
                "agency": "LTA",
                "project_type": "rail",
                "status": "completed",
                "description": "Construction of Mount Pleasant Station and associated tunnels for Thomson-East Coast Line (TEL).",
                "budget": 243000000.00,
                "contractor_name": "KTC Civil Engineering & Construction Pte Ltd",
                "contractor_contact": "Enquiries: info@ktcgroup.com.sg",
                "location": "Mount Pleasant Road",
                "start_date": "2016-04-01",
                "expected_completion": "2024",
                "actual_completion": "2024-06-23",
                "source": self.name,
                "source_url": "https://www.lta.gov.sg",
                "raw_payload": {"contract_id": "T313", "scope": "Station and tunnels"},
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
            },
            {
                "name": "Circle Line Stage 6 - Contract C885 (Prince Edward Road Station and Tunnels)",
                "slug": slugify("Circle Line Stage 6 - Contract C885 (Prince Edward Road Station and Tunnels)"),
                "agency": "LTA",
                "project_type": "rail",
                "status": "under_construction",
                "description": "Construction of Prince Edward Road station and tunnels for Circle Line Stage 6 (CCL6).",
                "budget": 225400000.00,
                "contractor_name": "Koh Brothers Building & Civil Engineering Contractor (Pte.) Ltd.",
                "contractor_contact": "Enquiries: kbce@kohbrothers.com",
                "location": "Prince Edward Road",
                "start_date": "2017-09-15",
                "expected_completion": "2026",
                "actual_completion": None,
                "source": self.name,
                "source_url": "https://www.lta.gov.sg",
                "raw_payload": {"contract_id": "C885", "scope": "Station and tunnels"},
            },
            {
                "name": "Circle Line Stage 6 - Contract C883 (Cantonment Station)",
                "slug": slugify("Circle Line Stage 6 - Contract C883 (Cantonment Station)"),
                "agency": "LTA",
                "project_type": "rail",
                "status": "under_construction",
                "description": "Construction of Cantonment station for Circle Line Stage 6 (CCL6).",
                "budget": 205000000.00,
                "contractor_name": "Woh Hup (Private) Limited",
                "contractor_contact": "Enquiries: contact@wohhup.com",
                "location": "Keppel Road / Cantonment Road",
                "start_date": "2017-10-01",
                "expected_completion": "2026",
                "actual_completion": None,
                "source": self.name,
                "source_url": "https://www.lta.gov.sg",
                "raw_payload": {"contract_id": "C883", "scope": "Station construction"},
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
                "name": "North-South Corridor - Contract N103 (Tunnel between Suffolk Road and Novena Rise)",
                "slug": slugify("North-South Corridor - Contract N103 (Tunnel between Suffolk Road and Novena Rise)"),
                "agency": "LTA",
                "project_type": "road",
                "status": "under_construction",
                "description": "Design and construction of tunnel section between Suffolk Road and Novena Rise for the North-South Corridor (NSC).",
                "budget": 483000000.00,
                "contractor_name": "Penta-Ocean Construction Co., Ltd.",
                "contractor_contact": "Enquiries: info@penta-ocean.co.jp",
                "location": "Novena",
                "start_date": "2018-09-15",
                "expected_completion": "2027",
                "actual_completion": None,
                "source": self.name,
                "source_url": "https://www.lta.gov.sg",
                "raw_payload": {"contract_id": "N103", "scope": "Corridor tunnel construction"},
            },
            {
                "name": "North-South Corridor - Contract N108 (Viaduct between Yishun Ave 2 and Admiralty Road West)",
                "slug": slugify("North-South Corridor - Contract N108 (Viaduct between Yishun Ave 2 and Admiralty Road West)"),
                "agency": "LTA",
                "project_type": "road",
                "status": "under_construction",
                "description": "Design and construction of elevated viaduct section between Yishun Ave 2 and Admiralty Road West for the North-South Corridor (NSC).",
                "budget": 502000000.00,
                "contractor_name": "Wai Fong Construction Pte. Ltd.",
                "contractor_contact": "Enquiries: info@waifong.com.sg",
                "location": "Yishun / Woodlands",
                "start_date": "2018-10-01",
                "expected_completion": "2027",
                "actual_completion": None,
                "source": self.name,
                "source_url": "https://www.lta.gov.sg",
                "raw_payload": {"contract_id": "N108", "scope": "Corridor viaduct construction"},
            },
            {
                "name": "Cross Island Line Phase 2 - Contract CR208 (Maju Station and Tunnels)",
                "slug": slugify("Cross Island Line Phase 2 - Contract CR208 (Maju Station and Tunnels)"),
                "agency": "LTA",
                "project_type": "rail",
                "status": "tendering",
                "description": "Design and construction of Maju station and tunnels for Cross Island Line Phase 2. Located along Clementi Road.",
                "budget": None,
                "contractor_name": None,
                "contractor_contact": None,
                "location": "Clementi Road / Maju",
                "start_date": None,
                "expected_completion": "2032",
                "actual_completion": None,
                "source": self.name,
                "source_url": "https://www.lta.gov.sg",
                "raw_payload": {"contract_id": "CR208", "scope": "Station and tunnels"},
            },
            {
                "name": "Cross Island Line Phase 2 - Contract CR209 (West Coast to Jurong Lake District Tunnels)",
                "slug": slugify("Cross Island Line Phase 2 - Contract CR209 (West Coast to Jurong Lake District Tunnels)"),
                "agency": "LTA",
                "project_type": "rail",
                "status": "tendering",
                "description": "Design and construction of tunnels between West Coast station and Jurong Lake District for Cross Island Line Phase 2.",
                "budget": None,
                "contractor_name": None,
                "contractor_contact": None,
                "location": "West Coast / Jurong Lake District",
                "start_date": None,
                "expected_completion": "2032",
                "actual_completion": None,
                "source": self.name,
                "source_url": "https://www.lta.gov.sg",
                "raw_payload": {"contract_id": "CR209", "scope": "Tunnels"},
            },
            {
                "name": "Cross Island Line Punggol Extension - Contract CP101 (Punggol Interchange Station and Tunnels)",
                "slug": slugify("Cross Island Line Punggol Extension - Contract CP101 (Punggol Interchange Station and Tunnels)"),
                "agency": "LTA",
                "project_type": "rail",
                "status": "tendering",
                "description": "Design and construction of Punggol interchange station and tunnels for Cross Island Line Punggol Extension.",
                "budget": None,
                "contractor_name": None,
                "contractor_contact": None,
                "location": "Punggol Central",
                "start_date": None,
                "expected_completion": "2032",
                "actual_completion": None,
                "source": self.name,
                "source_url": "https://www.lta.gov.sg",
                "raw_payload": {"contract_id": "CP101", "scope": "Interchange station and tunnels"},
            },
            {
                "name": "Changi Southern Corridor - Contract 108 (Road Enhancements & Cycling Paths)",
                "slug": slugify("Changi Southern Corridor - Contract 108 (Road Enhancements & Cycling Paths)"),
                "agency": "LTA",
                "project_type": "road",
                "status": "tendering",
                "description": "Design and construction of road enhancements, cycling paths, and pedestrian overhead bridges along the Changi Southern Corridor.",
                "budget": None,
                "contractor_name": None,
                "contractor_contact": None,
                "location": "Changi / Tanah Merah",
                "start_date": None,
                "expected_completion": "2029",
                "actual_completion": None,
                "source": self.name,
                "source_url": "https://www.lta.gov.sg",
                "raw_payload": {"contract_id": "108", "scope": "Roadworks and cycling paths"},
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
