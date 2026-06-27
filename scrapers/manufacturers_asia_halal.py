"""
Scraper — Asia Halal Directory manufacturers (Singapore, MUIS-certified).

Source: https://www.asiahalaldirectory.com/company-listing/
~500 halal-certified companies across food, cosmetics, pharma, and services.
All entries are Singapore-based with MUIS certification.

The listing is paginated (10 pages × 50 entries) with structured cards
containing name, category, description, website, phone, and email.
"""
from __future__ import annotations

import re
from typing import Any
from urllib.parse import urljoin

from bs4 import BeautifulSoup, Tag
from base import BaseScraper

BASE_URL = "https://www.asiahalaldirectory.com"
LISTING_URL = f"{BASE_URL}/company-listing/"


class ManufacturersAsiaHalalScraper(BaseScraper):
    name = "manufacturers_asia_halal"
    target_table = "manufacturers"

    def fetch(self) -> list[dict[str, Any]]:
        rows: list[dict[str, Any]] = []

        for page in range(1, 11):
            url = LISTING_URL if page == 1 else f"{LISTING_URL}?page_number={page}"
            html = self.get_text(url)
            soup = BeautifulSoup(html, "html.parser")

            cards = soup.select("div.cmp-col")
            if not cards:
                break

            for card in cards:
                row = self._parse_card(card)
                if row and row.get("name"):
                    rows.append(row)

        return rows

    def _parse_card(self, card: Tag) -> dict[str, Any] | None:
        """Parse a single company card (div.cmp-col) into a manufacturers row."""
        # --- name (h6 inside div.cmp-info) ----------------------------------
        name_el = card.select_one("h6")
        if not name_el:
            return None
        name = name_el.get_text(strip=True)

        # --- category (a.cmp-category) --------------------------------------
        cat_el = card.select_one("a.cmp-category")
        category_text = cat_el.get_text(strip=True) if cat_el else None
        industries = [category_text] if category_text else []

        # --- description (p inside div.cmp-info) ----------------------------
        desc_el = card.select_one("div.cmp-info > p")
        description = desc_el.get_text(" ", strip=True) if desc_el else None

        # --- detail URL -----------------------------------------------------
        detail_el = card.select_one("a.cmp-url")
        detail_url = urljoin(BASE_URL, detail_el["href"]) if detail_el else LISTING_URL

        # --- contacts (div.cmp-contact > div > a) ---------------------------
        website = None
        phone = None
        email = None
        emails_extra: list[str] = []

        contact_divs = card.select("div.cmp-contact div")
        for div in contact_divs:
            link = div.select_one("a")
            if not link:
                continue
            img = link.select_one("img")
            img_src = img["src"] if img else ""

            if "web.png" in img_src and website is None:
                website = link.get_text(strip=True)
                if website and not website.startswith("http"):
                    website = link.get("href", website)
            elif "phone.png" in img_src and phone is None:
                phone = link.get_text(strip=True)
            elif "email.png" in img_src:
                email_addr = link.get_text(strip=True)
                if email is None:
                    email = email_addr
                else:
                    emails_extra.append(email_addr)

        # --- extract products from description -------------------------------
        products: list[str] = self._extract_products(description) if description else []

        return {
            "name": name,
            "slug": slugify(name),
            "country": "Singapore",
            "city": None,
            "region": "Asia Pacific",
            "website": website,
            "email": email,
            "phone": phone,
            "industries": industries,
            "products": products,
            "cert_body": "MUIS (Majlis Ugama Islam Singapura)",
            "cert_body_id": None,
            "cert_number": None,
            "cert_status": "active",
            "cert_valid_until": None,
            "source": self.name,
            "source_url": LISTING_URL,
            "raw_payload": {
                "description": description,
                "detail_url": detail_url,
                "emails_extra": emails_extra,
            },
        }

    @staticmethod
    def _extract_products(description: str) -> list[str]:
        """Pull short product-like phrases from bullet-separated descriptions."""
        bullets = re.split(r"[•\-*]\s+", description)
        if len(bullets) > 1:
            candidates = [b.strip().rstrip(".") for b in bullets[1:] if 3 < len(b.strip()) < 80]
            return candidates[:8]
        return []


def slugify(value: str) -> str:
    """URL-safe slug matching the DB's generated slug format."""
    import unicodedata

    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    value = re.sub(r"[^a-zA-Z0-9]+", "-", value).strip("-").lower()
    return value or "unknown"
