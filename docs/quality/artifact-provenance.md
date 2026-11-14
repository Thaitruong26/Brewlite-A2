# Provenance and limitations

- **Primary sources:** Assignment2-BrewLite.pdf (uploaded) and signed-off group decisions dated 14/11/2026 as supplied in conversation.
- **Secondary technical reference:** Official VNPay Sandbox API documentation linked in SRS. All APIs/modules/schema are **proposed A2 designs**, not lifted from A1 code.
- **Diagram source**: each `.puml` is editable PlantUML; `SVG` review views are exported independently from `.dot` Graphviz descriptions (except the two sequence previews and swimlane preview, which are generated SVG). This means diagrams represent the same intended system, **but rendering parity with `.puml` was not verified**. Run PlantUML CLI, visually review and replace screenshots before submission.
- **Validation:** `tools/validate_docs.py` checks continuous IDs, FR/NFR presence in SRS/trace/tests, required diagram sources/figures, local Markdown links and decision caveats. It does NOT prove behavioral correctness, diagram compiler validity or successful runtime tests.
- **Open decisions:** O-01 points conversion (blocker); O-02 deployment platform; O-03/04 pending expiry/refund reconciliation; O-05 sandbox credentials; O-06 NFR thresholds approval.
