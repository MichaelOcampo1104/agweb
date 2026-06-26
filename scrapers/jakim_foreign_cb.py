"""
Scraper #1 — JAKIM Recognized Foreign Halal Certification Bodies (PDF).

Source: https://myehalal.halal.gov.my  (Malaysia's national halal authority)
JAKIM publishes a PDF listing every halal certification body it recognizes
worldwide (~100+ bodies across ~60 countries). This is one of the cleanest,
most authoritative global directories of halal certifiers in existence — the
perfect seed for our `certification_bodies` table.

Document layout (verified against the 25-Feb-2025 edition):
  • Page 1: cover. Pages 2-3: a TABLE OF CONTENTS mapping  COUNTRY -> page(s).
  • Each country then has its own section. The section starts with the country
    name in UPPER CASE, followed by numbered entries laid out as text columns:
        1. <Body Name part 1> <Title> <Contact person>
           <Body Name part 2 / acronym> (<Role>)
           <address lines>
           Tel / Mobile / Fax
           Email: <addresses>
           Website: <url>
  • pdfplumber flattens the columns, so the contact person's name lands on the
    SAME line as the start of the body name. We recover the real name by
    cutting each record's first line at the contact title (Mr./Dr./...) and
    re-joining the wrapped name from the following lines.

Parsing is defensive: anything we can't confidently identify is skipped rather
than guessed, and the whole run is logged. If a future edition changes the
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

# Honorifics that mark where the contact person's name begins on a record's
# first line. Everything before this on the line is body-name text.
_CONTACT_TITLE = re.compile(
    r"\b(?:Mr|Mrs|Ms|Mdm|Dr|Sheikh|Prof|Haji|Hajah|Ustaz|Ustazah|Syed|Dato|Datin|Tuan|Puan)\b\.?",
    re.IGNORECASE,
)

# Roles that appear as a trailing parenthetical on the contact line, e.g.
# "(Chairman)". These belong to the person, not the body, so we strip them.
_ROLE_PARENS = re.compile(
    r"\s*\((?:Chairman|President|Director|Vice[- ]President|Operations Manager|"
    r"Manager|CEO|Chief Executive Officer|Secretary|Treasurer|Representative|"
    r"Trustee|Head|Officer|Coordinator|Auditor|Consultant|Member|Adviser|Advisor|"
    r"Proprietor|Owner|Founder|Imam|Sheikh|Mufti|Halal Officer|Executive)\)",
    re.IGNORECASE,
)

# Lines that look like the start of an address or contact field — once we see
# one, the body name is finished.
_ADDRESS_START = re.compile(
    r"^(?:Level|Lot|Unit|Floor|Block|No\.?|P\.?O\.?|Plot|Jalan|Street|St\.|"
    r"Road|Rd\.|Avenue|Ave\.?|Boulevard|Building|Bldg|Tower|Complex|Centre|Center|"
    r"Kg\.?|Desa|Taman|Jalan|Tel|Mobile|Fax|Email|Website|Halal Logo)",
    re.IGNORECASE,
)


class JakimForeignCBScraper(BaseScraper):
    name = "jakim_foreign_cb"
    target_table = "certification_bodies"

    def fetch(self) -> list[dict[str, Any]]:
        import pdfplumber

        path = self.download(JAKIM_CB_PDF_URL, JAKIM_CB_PDF_FILENAME)
        with pdfplumber.open(path) as pdf:
            page_texts = [(p.extract_text() or "") for p in pdf.pages]

        if not page_texts:
            raise ScraperError("JAKIM PDF yielded no extractable text.")

        countries_raw = self._parse_toc(page_texts[:3])
        if not countries_raw:
            raise ScraperError("Could not parse the JAKIM PDF table of contents.")

        return self._parse_sections(page_texts, countries_raw)

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
        """Display-friendly country name from a raw TOC entry."""
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

    # ------------------------------------------------------- section parsing
    def _parse_sections(
        self, page_texts: list[str], countries_raw: list[str]
    ) -> list[dict[str, Any]]:
        # Map normalized heading -> clean display country name.
        country_lookup = {
            self._norm(raw): self._clean_country(raw) for raw in countries_raw
        }

        bodies: list[dict[str, Any]] = []
        current_country: str | None = None
        current_lines: list[str] = []

        def flush() -> None:
            if not current_lines:
                return
            for rec in self._split_records(current_lines):
                parsed = JakimForeignCBScraper._parse_record(rec, current_country)
                if parsed:
                    bodies.append(parsed)

        for text in page_texts:
            for raw_line in text.splitlines():
                stripped = raw_line.strip()
                if not stripped:
                    continue
                if re.fullmatch(r"Page \d+ of \d+", stripped, re.IGNORECASE):
                    continue
                # Country heading? (normalized line matches a known country)
                if self._norm(stripped) in country_lookup:
                    flush()
                    current_lines = []
                    current_country = country_lookup[self._norm(stripped)]
                    continue
                # Repeated column header row on each page
                if stripped.lower().startswith("no. organization"):
                    continue
                if current_country is None:
                    continue                                 # still in cover/TOC
                current_lines.append(stripped)
        flush()
        return bodies

    # ----------------------------------------------------- record splitting
    @staticmethod
    def _split_records(lines: list[str]) -> list[list[str]]:
        """A new record begins on a line like '1. Foo' / '12. Foo'."""
        records: list[list[str]] = []
        current: list[str] = []
        for line in lines:
            if re.match(r"^\d+\.\s+\S", line):
                if current:
                    records.append(current)
                current = [line]
            elif current:
                current.append(line)
        if current:
            records.append(current)
        return records

    # ------------------------------------------------------- record parsing
    def _parse_record(lines: list[str], country: str | None) -> dict[str, Any] | None:
        text = "\n".join(lines)

        # --- line 1: body-name start + (title + contact person) merged ---
        first = lines[0]
        m = re.match(r"^\d+\.\s+(.*)$", first)
        rest = m.group(1).strip() if m else first.strip()
        title_match = _CONTACT_TITLE.search(rest)
        name1 = rest[: title_match.start()].strip() if title_match else rest

        # --- following lines: keep name continuation until address/contact ---
        # The PDF interleaves two columns, so a continuation line may also carry
        # a contact role like "(Director)" or a person's title. We take the
        # name-portion of each line (text before any role/title/address marker).
        name_parts = [name1] if name1 else []
        for nxt in lines[1:6]:
            nxt_s = nxt.strip()
            if not nxt_s:
                break
            if ":" in nxt_s or _ADDRESS_START.match(nxt_s):
                break
            # stop at street numbers ("12 Howes Street", "427-429 William Street")
            if re.match(r"^\d+\s*\w", nxt_s):
                break
            # cut the line at a contact person's title, keep the name text before it
            tm = _CONTACT_TITLE.search(nxt_s)
            if tm:
                if tm.start() > 0:
                    name_parts.append(nxt_s[: tm.start()].strip())
                break
            # cut at a role parenthetical, keep what's before, and keep going
            rm = _ROLE_PARENS.search(nxt_s)
            if rm:
                if rm.start() > 0:
                    name_parts.append(nxt_s[: rm.start()].strip())
                continue
            name_parts.append(nxt_s)

        name = re.sub(r"\s+", " ", " ".join(name_parts)).strip()
        # Safety net: if a contact title somehow slipped in, cut there.
        late_title = _CONTACT_TITLE.search(name)
        if late_title:
            name = name[: late_title.start()].strip()
        name = _ROLE_PARENS.sub("", name).strip()             # drop "(Chairman)" etc.
        name = re.sub(r"\s{2,}", " ", name).strip()
        if not name:
            return None

        website = JakimForeignCBScraper._extract_after(text, "Website")
        email = JakimForeignCBScraper._extract_after(text, "Email")

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
            "raw_payload": {"lines": lines},
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
