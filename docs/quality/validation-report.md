# Validation report (documentation only)

- Data baseline: 14/11/2026 group decisions.
- Requirements source: `requirements/requirements-register.csv`.
- Generated registry: **32 FR, 16 NFR**; matrix + test catalog cover **100% registered IDs**.
- Diagrams: **9 editable PlantUML sources and 9 matching-name review SVGs**; extra activity swimlane SVG.
- ADR: **8** under `architecture/adr/`.
- Automated check: `python tools/validate_docs.py` → **0 errors, 0 warnings** (run on generated output).
- Each relative link in Markdown resolves to a local file at time of generation.
- **Not claimed:** PlantUML CLI render success, source A2 compilation, test execution, CI pass, deployed production.
- **Blocking decisions:** O-01 points conversion rate and O-02 provider approval (plus O-03..06).
