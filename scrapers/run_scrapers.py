"""
CLI runner for all scrapers.

Usage (from the /scrapers directory, with the venv active):

    python run_scrapers.py jakim-cb              # run one scraper
    python run_scrapers.py --all                 # run every registered scraper
    python run_scrapers.py jakim-cb --dry-run    # fetch only, don't write to DB

Keys are read from the repo-root .env (see .env.example):
    SUPABASE_URL
    SUPABASE_SERVICE_ROLE_KEY
"""
from __future__ import annotations

import sys

import typer

from base import ScraperError
from jakim_foreign_cb import JakimForeignCBScraper
from halal_foundation_bodies import HalalFoundationBodiesScraper
from manufacturer_template import ManufacturerTemplateScraper

# Registry: CLI name -> scraper class. Add new scrapers here.
SCRAPERS = {
    "jakim-cb": JakimForeignCBScraper,
    "halal-foundation": HalalFoundationBodiesScraper,
    "manufacturer-template": ManufacturerTemplateScraper,
}

app = typer.Typer(add_completion=False, help="Halal directory data scrapers.")


@app.command()
def run(
    scraper: str = typer.Argument(
        None, help=f"Scraper to run. One of: {', '.join(SCRAPERS)}"
    ),
    all_scrapers: bool = typer.Option(False, "--all", help="Run every registered scraper."),
    dry_run: bool = typer.Option(False, "--dry-run", help="Fetch only; don't write to the DB."),
) -> None:
    """Run one scraper (or --all) and report the outcome."""
    if not scraper and not all_scrapers:
        typer.echo("Specify a scraper or --all. Available: " + ", ".join(SCRAPERS))
        raise typer.Exit(code=2)

    targets: list[str]
    if all_scrapers:
        targets = list(SCRAPERS)
    else:
        if scraper not in SCRAPERS:
            typer.echo(f"Unknown scraper '{scraper}'. Available: {', '.join(SCRAPERS)}")
            raise typer.Exit(code=2)
        targets = [scraper]

    exit_code = 0
    for name in targets:
        cls = SCRAPERS[name]
        try:
            result = cls().run(dry_run=dry_run)
        except ScraperError as exc:
            typer.secho(f"[fatal] {name}: {exc}", fg=typer.colors.RED)
            exit_code = 1
            continue
        if result.status == "error":
            exit_code = 1

    raise typer.Exit(code=exit_code)


@app.command()
def list_scrapers() -> None:
    """List registered scrapers."""
    for name, cls in SCRAPERS.items():
        typer.echo(f"{name:24s} -> {cls.__name__}  (writes to '{cls.target_table}')")


if __name__ == "__main__":
    app()
