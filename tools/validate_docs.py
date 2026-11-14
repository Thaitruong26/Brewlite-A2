#!/usr/bin/env python3
"""Static cross-document checks for BrewLite A2 Task 1-3 artifacts."""
import csv, re, sys
from pathlib import Path
from urllib.parse import unquote
root=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path(__file__).resolve().parents[1]
errors=[]; warnings=[]
reg=root/'docs/requirements/requirements-register.csv'
with reg.open(encoding='utf-8',newline='') as f: rr=list(csv.DictReader(f))
fr=[r for r in rr if r['type']=='FR']; nfr=[r for r in rr if r['type']=='NFR']
for typ,items in [('FR',fr),('NFR',nfr)]:
 ids=[r['id'] for r in items]
 want=[f'{typ}-{j:02d}' for j in range(1,len(ids)+1)]
 if ids!=want: errors.append(f'{typ} IDs missing/not sequential: {ids} vs {want}')
for r in fr:
 for k in ['acceptance','usecases','diagrams','adr','planned_api','test_id']:
  if not r[k].strip():errors.append(f"{r['id']} missing {k}")
for r in nfr:
 for k in ['acceptance','adr','test_id']:
  if not r[k].strip():errors.append(f"{r['id']} missing {k}")
srs=(root/'docs/requirements/software-requirements-specification.md').read_text(encoding='utf-8')
trace=(root/'docs/traceability-matrix.md').read_text(encoding='utf-8')
tests=(root/'docs/quality/acceptance-test-catalog.md').read_text(encoding='utf-8')
for r in rr:
 for where,s in [('SRS',srs),('trace',trace),('tests',tests)]:
  if r['id'] not in s:errors.append(f"{r['id']} absent in {where}")
 if r['test_id'] not in tests:errors.append(f"{r['test_id']} absent from tests")
 for d in [x.strip() for x in r.get('diagrams','').split(';') if x.strip()]:
  if d not in trace: errors.append(f"{d} not referenced by trace matrix")
 for a in [x.strip() for x in r['adr'].split(';') if x.strip()]:
  if a not in (root/'docs/architecture/architecture.md').read_text(encoding='utf-8'):
   warnings.append(f'{a} not explicitly named in architecture')
for name in ['use-case-overview','use-case-checkout','activity-checkout','sequence-checkout','sequence-cancel-refund','class-domain','class-inventory','architecture-logical','deployment-production']:
 for ext in ['.puml','.svg']:
  if not (root/'docs/diagrams'/f'{name}{ext}').is_file(): errors.append(f'Missing: {name}{ext}')
for path in root.rglob('*.md'):
 text=path.read_text(encoding='utf-8')
 for target in re.findall(r'\]\(([^)]+)\)',text):
  if target.startswith(('http://','https://','#','mailto:')):continue
  rel=target.split('#',1)[0]
  if rel and not (path.parent/unquote(rel)).exists():errors.append(f'Broken link {path.relative_to(root)} -> {target}')
mandatory=['PENDING','PAYMENT_FAILED','PAID','PREPARING','READY','COMPLETED','CANCELLED']
for f in ['docs/requirements/software-requirements-specification.md','docs/requirements/use-case-checkout-specification.md','docs/diagrams/activity-checkout.puml','docs/diagrams/class-domain.puml','docs/architecture/architecture.md']:
 t=(root/f).read_text(encoding='utf-8')
 for k in ['PAID','CANCELLED','PREPARING']:
  if k not in t: errors.append(f'{k} missing from {f}')
if 'O-01' not in srs or 'O-02' not in (root/'docs/deployment.md').read_text(encoding='utf-8'):
 errors.append('Missing explicit unresolved decision(s)')
print(f'FR={len(fr)} NFR={len(nfr)} diagrams=9 docs={len(list(root.rglob("*.md")))}')
print(f'Errors: {len(errors)}, Warnings: {len(warnings)}')
for x in errors:print('ERROR:',x)
for x in warnings:print('WARNING:',x)
sys.exit(1 if errors else 0)
