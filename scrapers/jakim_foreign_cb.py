"""
Scraper #1 — JAKIM Recognized Foreign Halal Certification Bodies (PDF).

Source: https://myehalal.halal.gov.my  (Malaysia's national halal authority)
JAKIM publishes a PDF listing every halal certification body it recognizes
worldwide (~100+ bodies across ~60 countries). This is one of the cleanest,
most authoritative global directories of halal certifiers in existence — the
perfect seed for our `certification_bodies` table.

Document layout (verified against the 25-Feb-2025 edition):
  • Page 1: cover. Pages 2-3: a TABLE OF CONTENTS mapping COUNTRY -> page(s).
  • Each country section is a real 4-column table, one row per body:
        [ No. | Organization & Address | Contact | Halal Logo ]
    Crucially, the body NAME and its postal ADDRESS share a single cell
    (column 2), separated only by line breaks. Flattening the page to text
    (the earlier approach) merged those two together and produced names with
    street addresses and contact-person names glued on.

Strategy:
  1. Extract the page as a TABLE (pdfplumber.extract_tables) — this keeps
     name+address in their own cell, isolated from the Contact column.
  2. Within that cell, split name lines from address lines: an address line
     starts with a digit, a street keyword, or follows a closed acronym
     parenthetical like "(AHQC)". A name line that ends with a legal-entity
     suffix (Ltd, GmbH, Authority, Council, …) terminates the name.
  3. Country is taken from the TOC so we don't depend on the trailing
     "Australia" line that sometimes appears inside the address cell.

Parsing is defensive: rows whose name we cannot confidently reconstruct
(ends on a connector, unclosed parenthesis, or a footer/total line) are
SKIPPED rather than guessed, and the run is logged. AGENTS.md §6: a missing
row is better than a row with a wrong name. If a future edition changes the
layout enough to break parsing, the run is marked 'error' — no bad data written.
"""
from __future__ import annotations

import re
from typing import Any

from base import BaseScraper, ScraperError

# JAKIM publishes dated editions. Pin the latest confirmed-good URL here.
JAKIM_CB_PDF_URL = (
    "https://myehalal.halal.gov.my/portal-halal/v1/pdf/cb/CBLIST-25FEBRUARY2025.pdf"
)
JAKIM_CB_PDF_FILENAME = "jakim_foreign_cb.pdf"

# Lines that look like the start of an address. Once we hit one inside a cell,
# the body NAME is finished and everything after is postal address. NOTE: "Halal"
# is deliberately excluded — it legitimately starts many body names
# ("Halal Certification Authority", "Halal Italia", …).
_ADDRESS_START = re.compile(
    r"^(?:Level|Lot|Unit|Floor|Block|No\.?|P\.?O\.?|Plot|Jalan|Street|St\.|"
    r"Road|Rd\.|Avenue|Ave\.?|Boulevard|Blvd|Building|Bldg|Tower|Complex|"
    r"Centre|Center|Kg\.?|Desa|Taman|Kawasan|Tel|Mobile|Fax|Email|Website|"
    # non-English street words seen in the source (Brazil, Spain, Italy, Russia…)
    r"Rua|Avenida|Via|Viale|Calle|Str\.?|Straits|Porchester)",
    re.IGNORECASE,
)

# A name line ending with one of these legal/entity suffixes is likely the FINAL
# name line — the address follows. Matches "Pty. Ltd.", "GmbH", "Authority", …
_ENTITY_SUFFIX = re.compile(
    r"(?:Ltd\.?|Ltda\.?|GmbH|Inc\.?|Corp\.?|Corporation|Pvt\.?\s*Ltd\.?|LLC|LLP|LP|"
    r"S\.?L\.?|S\.?A\.?|Berhad|Bhd\.?|Co\.?|Limited|Foundation|Trust|Authority|"
    r"Council|Association|Society|Organiz(?:a|s)tion|Centre|Center|Institute|"
    r"Bureau|Board|Federation|Chamber|Services?|Agency|Department|Ministry)"
    r"\.?$",
    re.IGNORECASE,
)

# A name line ending with a country name terminates the org name — the address
# follows on the next line. (Catches cases where the legal suffix is absent but
# the body name itself ends in its country, e.g. "JMUIM Halal Pakistan".)
_COUNTRY_TERMINATOR = re.compile(
    r"(?:Pakistan|India|Bangladesh|Malaysia|Indonesia|Türkiye|Turkey|Egypt|"
    r"Nigeria|Senegal|Morocco|Tunisia|Sudan|Jordan|Lebanon|Iraq|Iran|"
    r"Afghanistan|Uzbekistan|Kazakhstan|Tajikistan)$",
    re.IGNORECASE,
)

# A name that ends on one of these lowercase connectors is incomplete — the real
# name continues (usually the acronym) on a later line we can't safely reach, so
# we drop the row rather than ship a truncated name.
_CONNECTOR_END = {
    "of", "and", "the", "in", "for", "de", "la", "el", "du", "der",
    "von", "und", "na", "da", "do", "del",
}

# Footer / summary rows that aren't real bodies ("TOTAL NO. OF CB", "NO. COUNTRY"),
# plus the repeated column-header row ("Organization & Address", "No.").
_NON_BODY = re.compile(
    r"^(?:TOTAL|NO\.|GRAND|NUMBER|ORGANIZATION|NO\b)",
    re.IGNORECASE,
)

# A name longer than this almost certainly has address text glued on (real body
# names, even long government ones, stay under ~90 chars). Drop rather than ship.
_MAX_NAME_LEN = 90

# A name ending in a bare digit ("Office 212", "Street 3") has an address tail.
_TRAILING_DIGIT = re.compile(r"\d\s*$")


class JakimForeignCBScraper(BaseScraper):
    name = "jakim_foreign_cb"
    target_table = "certification_bodies"

    def before_upsert(self) -> None:
        """Delete rows previously written by THIS scraper before re-inserting.

        Names can change when the JAKIM PDF layout shifts (addresses/acronyms get
        re-parsed), so a plain upsert on (name, country) would leave the old,
        now-different-named rows behind as orphans. Pruning by `source` makes a
        re-run a clean replace. Safe because `source` is set exclusively here.
        """
        self.client.table(self.target_table).delete().eq("source", self.name).execute()

    def fetch(self) -> list[dict[str, Any]]:
        import pdfplumber

        path = self.download(JAKIM_CB_PDF_URL, JAKIM_CB_PDF_FILENAME)
        with pdfplumber.open(path) as pdf:
            self._page_texts = [(p.extract_text() or "") for p in pdf.pages]
            tables_by_page = [p.extract_tables() or [] for p in pdf.pages]

        page_texts = self._page_texts
        if not page_texts:
            raise ScraperError("JAKIM PDF yielded no extractable text.")
        if not any(tables_by_page):
            raise ScraperError(
                "JAKIM PDF yielded no extractable tables — the layout may have "
                "changed; update the parser (see AGENTS.md §12)."
            )

        countries_raw = self._parse_toc(page_texts[:3])
        if not countries_raw:
            raise ScraperError("Could not parse the JAKIM PDF table of contents.")

        return self._parse_tables(tables_by_page, countries_raw)

    # ----------------------------------------------------------- normalization
    @staticmethod
    def _norm(s: str) -> str:
        """Aggressive normalization for heading matching: upper-case, drop
        parentheticals and punctuation, collapse spaces."""
        s = s.upper()
        s = re.sub(r"\([^)]*\)", " ", s)
        s = re.sub(r"[^A-Z\s]", " ", s)
        return re.sub(r"\s+", " ", s).strip()

    @staticmethod
    def _clean_country(raw: str) -> str:
        """Display-friendly country name from a raw TOC entry, with the
        common aliases collapsed to a single canonical form (dedupes rows
        that would otherwise split, e.g. 'USA' vs 'United States of America')."""
        c = re.sub(r"\s*\([^)]*\)\s*$", "", raw).strip()       # drop "(USA)" etc.
        small = {"of", "and", "the"}
        words = c.split()
        out = []
        for i, w in enumerate(words):
            out.append(w.lower() if (i > 0 and w.lower() in small) else w.capitalize())
        c = " ".join(out)
        return {
            "Kingdom of Saudi Arabia": "Saudi Arabia",
            "Netherlands Holland": "Netherlands",
            "Netherlands / Holland": "Netherlands",
            # canonical US / UK names so duplicates merge on (name, country)
            "Usa": "United States",
            "U S A": "United States",
            "United States of America": "United States",
            "Uk": "United Kingdom",
            "U K": "United Kingdom",
            "United Kingdom of Great Britain": "United Kingdom",
        }.get(c, c)

    # ------------------------------------------------------- table of contents
    @staticmethod
    def _parse_toc(toc_pages: list[str]) -> list[str]:
        """TOC rows look like  '1 Australia 4 – 6'  or  '38 Switzerland 50'."""
        countries: list[str] = []
        pattern = re.compile(r"^\d+\s+(.+?)\s+\d+(?:\s*[–-]\s*\d+)?\s*$")
        for text in toc_pages:
            for line in text.splitlines():
                line = re.sub(r"\s+", " ", line).strip()
                if line.upper().startswith("TABLE OF CONTENT") or line.upper() == "NO. COUNTRY PAGE":
                    continue
                m = pattern.match(line)
                if not m:
                    continue
                countries.append(m.group(1).strip())
        return countries

    # ------------------------------------------------------- table extraction
    def _parse_tables(
        self, tables_by_page: list[list[list[list[str]]]], countries_raw: list[str]
    ) -> list[dict[str, Any]]:
        # The country for each body comes from the TOC, not from the address cell
        # (which sometimes omits or misspells it). We walk pages in order and
        # switch the "current country" whenever a page's text contains a country
        # heading; every body row on that page inherits it.
        country_lookup = {
            self._norm(raw): self._clean_country(raw) for raw in countries_raw
        }

        bodies: list[dict[str, Any]] = []
        seen: set[tuple[str, str]] = set()                # dedupe (name, country)
        current_country: str | None = None

        for tables, page_text in zip(tables_by_page, self._page_texts):
            # Update current country from any heading on this page.
            for line in page_text.splitlines():
                key = self._norm(line.strip())
                if key in country_lookup:
                    current_country = country_lookup[key]
                    break

            for table in tables:
                for row in table:
                    if not row or len(row) < 2:
                        continue
                    cell = row[1] or ""
                    name = self._extract_name(cell)
                    if not name or not self._is_clean_name(name):
                        continue
                    rec = self._build_record(
                        name=name,
                        country=current_country,
                        row=row,
                        raw_cell=cell,
                    )
                    key = (rec["name"], rec.get("country") or "")
                    if key in seen:
                        continue
                    seen.add(key)
                    bodies.append(rec)
        return bodies

    @staticmethod
    def _is_clean_name(name: str) -> bool:
        """Final acceptance gate. We DROP anything we can't trust rather than
        ship a wrong name (AGENTS.md §6): column headers, footers, truncated
        names (ending on a connector), unbalanced acronym parens OR quote
        marks, names with an address glued on (trailing digit or excessive
        length)."""
        if _NON_BODY.match(name):
            return False
        if name.split()[-1].lower() in _CONNECTOR_END:
            return False
        if name.count("(") != name.count(")"):
            return False
        # curly/smart quotes (" " ' ' " ") wrap multi-line org names in the PDF
        if name.count("“") != name.count("”"):
            return False
        if _TRAILING_DIGIT.search(name):                 # "Office 212", "Street 3"
            return False
        if len(name) > _MAX_NAME_LEN:
            return False
        return True

    @staticmethod
    def _extract_name(cell: str) -> str | None:
        """Pull the body name out of an 'Organization & Address' cell.

        Lines are name-lines until we hit an address boundary (a digit-led line,
        a street keyword, or a non-parenthetical line after a closed acronym).
        A name line ending in a legal-entity suffix terminates the name.
        """
        lines = [ln.strip() for ln in cell.split("\n") if ln.strip()]
        if not lines:
            return None

        parts: list[str] = []
        acronym_closed = False
        for ln in lines:
            if re.match(r"^\d", ln) or _ADDRESS_START.match(ln):
                break                                   # address begins here
            if acronym_closed and not ln.startswith("("):
                break                                   # acronym ended the name
            parts.append(ln)
            if ln.endswith(")"):
                acronym_closed = True
                continue
            if _ENTITY_SUFFIX.search(ln) or _COUNTRY_TERMINATOR.search(ln):
                break                                   # name is complete

        name = re.sub(r"\s+", " ", " ".join(parts)).strip()
        return name or None

    def _build_record(
        self, *, name: str, country: str | None, row: list[str], raw_cell: str
    ) -> dict[str, Any]:
        # The name has already passed the _is_clean_name gate upstream, so we
        # only assemble the row here. Email/website come from the Contact column
        # (row[2]) via label-based extraction.
        full_text = "\n".join(
            (c or "").replace("\n", " ") for c in row
        )
        website = JakimForeignCBScraper._extract_after(full_text, "Website")
        email = JakimForeignCBScraper._extract_after(full_text, "Email")

        return {
            "name": name,
            "country": country,
            "region": None,
            "website": website,
            "email": email,
            "recognized_by": ["JAKIM"],
            "notes": "Recognized by JAKIM (Malaysia) as a foreign halal certification body.",
            "source_url": JAKIM_CB_PDF_URL,
            "source": "jakim_foreign_cb",
            "raw_payload": {"cell": raw_cell, "contact": row[2] if len(row) > 2 else None},
        }

    @staticmethod
    def _extract_after(text: str, label: str) -> str | None:
        """Value following a 'Label:' marker (Website url or first Email)."""
        idx = text.find(f"{label}:")
        if idx == -1:
            idx = text.find(f"{label} :")
            if idx == -1:
                return None
        tail = text[idx + len(label) + 1:].lstrip(" :\n")
        next_label = re.search(r"\n(Website|Email|Tel|Mobile|Fax|Contact)\s*:", tail)
        segment = tail[: next_label.start()] if next_label else tail
        segment = segment.strip()
        if not segment:
            return None
        if label.lower() == "website":
            url = segment.split()[0].rstrip(".,)")
            return url if url.startswith("http") else f"https://{url}"
        m = re.search(r"[\w.+-]+@[\w-]+\.[\w.-]+", segment)
        return m.group(0) if m else None
