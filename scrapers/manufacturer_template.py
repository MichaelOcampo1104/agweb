"""
Scraper #3 — Manufacturer scraper TEMPLATE.

The certifier directory (scrapers #1 and #2) is your SEO backbone. The real
product is the `manufacturers` table. Each manufacturer source has a different
shape, so rather than ship a fake scraper, this is a fully-wired template that
follows the exact same pattern as the live scrapers. To add a real manufacturer
source:

  1. Find a source that lists manufacturers + their cert details (start with a
     single certifier's public certified-company list, e.g. one of the JAKIM-recognized
     bodies' own websites, or a halal-portal directory).
  2. Copy this file → manufacturers_<source>.py.
  3. Implement fetch() to return dicts shaped like the example below.
  4. Register it in run_scrapers.py's SCRAPERS map.
  5. Run:  python run_scrapers.py manufacturers_<source>

Every field below maps directly to the manufacturers table. The upsert dedupes
on (name, country), so re-runs are safe and idempotent.
"""
from __future__ import annotations

from typing import Any

from base import BaseScraper

# TODO: replace with a real source URL that lists certified manufacturers.
EXAMPLE_SOURCE_URL = "https://example.org/halal-certified-companies"


class ManufacturerTemplateScraper(BaseScraper):
    name = "manufacturer_template"
    target_table = "manufacturers"

    def fetch(self) -> list[dict[str, Any]]:
        """
        Return one dict per manufacturer. Example shape (all keys map 1:1 to the
        manufacturers table columns):

            {
                "name": "Al-Salam Food Industries",
                "slug": "al-salam-food-industries",
                "country": "Turkey",
                "city": "Istanbul",
                "region": "Middle East",
                "website": "https://alsalam-food.example",
                "email": None,
                "phone": None,
                "industries": ["Food & Beverage"],
                "products": ["Frozen Meat", "Canned Goods"],
                "cert_body": "TSE (Turkish Standards Institution)",
                "cert_body_id": None,          # set if you can resolve to certification_bodies.id
                "cert_number": "TSE-12345",
                "cert_status": "active",
                "cert_valid_until": "2027-03-01",
                "source": self.name,
                "source_url": EXAMPLE_SOURCE_URL,
                "raw_payload": {...},          # keep the original row for traceability
            }

        Implementation pattern (mirror jakim_foreign_cb.py / halal_foundation_bodies.py):

            html = self.get_text(EXAMPLE_SOURCE_URL)
            soup = BeautifulSoup(html, "html.parser")
            rows = []
            for card in soup.select(".company-card"):
                rows.append({
                    "name": ...,
                    "slug": slugify(...),
                    ...
                })
            return rows
        """
        # Intentionally returns nothing until you point it at a real source.
        # Remove this raise once you implement a real source.
        raise NotImplementedError(
            "ManufacturerTemplateScraper is a scaffold. Point it at a real source "
            "(see docstring) and implement fetch()."
        )


def slugify(value: str) -> str:
    """URL-safe slug matching the DB's generated slug format."""
    import unicodedata

    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    import re
    value = re.sub(r"[^a-zA-Z0-9]+", "-", value).strip("-").lower()
    return value or "unknown"
