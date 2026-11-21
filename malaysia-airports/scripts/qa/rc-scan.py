#!/usr/bin/env python3
"""Which sitemap pages stream their <h1> inside a hidden segment that React reveals later with $RC.

With Partial Prerendering and streaming, parts of a page can arrive as <div hidden id="S:..."> blocks
that a later $RC("B:...","S:...") call moves into place. When the page's <h1> is inside such a
block, the heading and lead are not in the first flush: the browser cannot paint them until the
script runs. E-02 requires 0 such pages among the static pages in the sitemap.

For every sitemap URL the scan records whether an <h1> exists, which hidden segment (if any)
contains it, and how many $RC reveals the page has in all.

Usage:  python3 scripts/qa/rc-scan.py [BASE_URL] [OUT_JSON]
        (defaults: http://localhost:3100 and rc-scan.json)
Exit code 1 when any sitemap page holds its h1 in a hidden segment. Standard library only.
"""
import json
import random
import re
import sys
import urllib.request
from collections import Counter
from concurrent.futures import ThreadPoolExecutor

BASE = (sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:3100').rstrip('/')
OUT = sys.argv[2] if len(sys.argv) > 2 else 'rc-scan.json'


def get(path):
    ip = '10.%d.%d.%d' % (random.randint(1, 250), random.randint(1, 250), random.randint(1, 250))
    req = urllib.request.Request(BASE + path, headers={'x-e2e-client-ip': ip})
    return urllib.request.urlopen(req).read().decode('utf-8', 'replace')


def check(path):
    html = get(path)
    h1 = html.find('<h1')
    inside = None
    first_hidden = None
    for m in re.finditer(r'<div hidden id="(S:[0-9a-z]+)">', html):
        sid = m.group(1)
        if first_hidden is None:
            first_hidden = m.start()
        end = html.find('$RC("B:%s","%s")' % (sid[2:], sid))
        if end < 0:
            end = html.find('"%s")' % sid, m.start())
        if m.start() < h1 < end:
            inside = sid
    return {'path': path, 'h1': h1, 'firstHidden': first_hidden, 'h1InHidden': inside, 'reveals': html.count('$RC(')}


def kind(path):
    parts = path.split('/')[2:]
    if not parts or parts == ['']:
        return 'home'
    if len(parts) == 1 and len(parts[0]) == 3:
        return 'airport overview'
    if len(parts) >= 2 and len(parts[0]) == 3:
        return 'airport/' + parts[1]
    return parts[0]


def main():
    locs = [re.sub(r'^https?://[^/]+', '', u) for u in re.findall(r'<loc>([^<]+)</loc>', get('/sitemap.xml'))]
    with ThreadPoolExecutor(8) as ex:
        rows = list(ex.map(check, locs))
    hidden = [r for r in rows if r['h1InHidden']]
    no_h1 = [r['path'] for r in rows if r['h1'] < 0]
    print('pages', len(rows), '; h1 inside a hidden segment (revealed by $RC):', len(hidden), '; pages without an h1 in the HTML:', len(no_h1))
    print('hidden by kind:', Counter(kind(r['path']) for r in hidden).most_common())
    print('reveals per page:', dict(sorted(Counter(r['reveals'] for r in rows).items())), '; total', sum(r['reveals'] for r in rows))
    with open(OUT, 'w') as f:
        json.dump({'pages': len(rows), 'hidden': sorted(r['path'] for r in hidden), 'noH1': no_h1, 'rows': rows}, f, indent=1)
    return 1 if hidden else 0


if __name__ == '__main__':
    sys.exit(main())
