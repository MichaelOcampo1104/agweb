"""
Scraper #2 — Halal Foundation global halal certification bodies list (HTML).

Source: https://halalfoundation.org/major-halal-certification-companies/
A curated, human-readable list of ~12 major halal certifiers worldwide. Used to
ENRICH the certification_bodies directory (adds website/region for bodies that
the JAKIM PDF lists more sparsely). Because the table upserts on (name, country),
re-running after the JAKIM scraper merges fields without duplicating rows.

Page layout (verified): the certifier list is a numbered set of <h2> headings,
each shaped like  "1. American Halal Foundation (AHF)"  followed by descriptive
paragraphs. We parse each numbered h2 as a body, then scan the following sibling
content for the body's own website link.
"""
from __future__ import annotations

import re
from typing import Any

from bs4 import BeautifulSoup, Tag

from base import BaseScraper

SOURCE_URL = "https://halalfoundation.org/major-halal-certification-companies/"

# Headings that are part of the page chrome, NOT certifier entries.
_CHROME_HEADINGS = {
    "frequently asked questions (faqs)", "disclaimer", "related posts:",
    "qualify your products for halal certification", "connect with ahf",
    "international halal accreditation & recognition", "apply", "sitemap",
    "subscribe to our newsletter", "locations",
}

# Certifier names that embed a country/region hint. Country strings MUST match
# the canonical names used by the JAKIM scraper (see jakim_foreign_cb._clean_country)
# so upserts merge rows instead of splitting them on "USA" vs "United States".
_COUNTRY_HINTS = [
    ("United States", ["american", "u.s.", "usa", "united states"]),
    ("United Kingdom", [" uk ", "united kingdom", "british"]),
    ("Canada", ["canada", "canadian"]),
    ("Australia", ["australia", "australian"]),
    ("India", ["india", "hind"]),
    ("Malaysia", ["malaysia", "malaysian"]),
    ("Indonesia", ["indonesia", "indonesian", "bpjph"]),
    ("Thailand", ["thailand", "cicot"]),
    ("Taiwan", ["taiwan", "thida"]),
    ("UAE", ["emirates", "esma", "uae"]),
    ("South Africa", ["south africa", "sanhã", "sanha"]),
]


class HalalFoundationBodiesScraper(BaseScraper):
    name = "halal_foundation_bodies"
    target_table = "certification_bodies"

    def before_upsert(self) -> None:
        """Replace rows previously written by THIS scraper (see JAKIM scraper's
        before_upsert for rationale — keeps re-runs idempotent)."""
        self.client.table(self.target_table).delete().eq("source", self.name).execute()

    def fetch(self) -> list[dict[str, Any]]:
        html = self.get_text(SOURCE_URL)
        soup = BeautifulSoup(html, "html.parser")

        bodies: list[dict[str, Any]] = []
        for h2 in soup.find_all("h2"):
            raw = h2.get_text(" ", strip=True)
            # numbered list entry, e.g. "1. American Halal Foundation (AHF)"
            m = re.match(r"^\d+\.\s+(.+)$", raw)
            if not m:
                continue
            name = m.group(1).strip()
            if name.lower() in _CHROME_HEADINGS:
                continue
            website = self._first_external_link(h2)
            country = self._guess_country(name)

            bodies.append({
                "name": name,
                "country": country,
                "region": None,
                "website": website,
                "recognized_by": [],
                "notes": "Listed by Halal Foundation as a major global halal certifier.",
                "source_url": SOURCE_URL,
                "source": self.name,
                "raw_payload": {"heading": raw, "href": website},
            })
        return bodies

    def _first_external_link(self, heading: Tag) -> str | None:
        """
        Walk forward through the heading's following siblings until we hit the
        next heading, and return the first link to an external (non-Halal-Foundation) site.
        """
        sibling = heading.find_next_sibling()
        hops = 0
        while sibling is not None and hops < 8:
            if isinstance(sibling, Tag) and sibling.name in ("h2", "h3"):
                break
            if isinstance(sibling, Tag):
                for a in sibling.find_all("a", href=True):
                    href = a["href"].strip()
                    if href.startswith("http") and "halalfoundation.org" not in href:
                        return href
            sibling = sibling.find_next_sibling()
            hops += 1
        return None

    @staticmethod
    def _guess_country(text: str) -> str | None:
        low = f" {text.lower()} "
        for country, hints in _COUNTRY_HINTS:
            if any(h in low for h in hints):
                return country
        return None
