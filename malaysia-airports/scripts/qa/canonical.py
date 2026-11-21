#!/usr/bin/env python3
"""Canonical and hreflang on every sitemap URL, with the number of canonicals per response.

For each sitemap URL: the canonical in the HTML <head> and in the Link response header(s), the en and
ms alternates, whether the page names itself canonical, and how many distinct canonical URLs the
response carries across head and header. "One canonical per response" means that last number is 1.
Paths given after the output file are checked the same way (for example flight pages and a 404).

Usage:  python3 scripts/qa/canonical.py [BASE_URL] [OUT_JSON] [extra paths ...]
        (defaults: http://localhost:3100 and canonical.json)
Exit code 1 when a sitemap URL lacks a self-canonical with both alternates, or carries more than one
distinct canonical. Standard library only.
"""
import json
import random
import re
import sys
import urllib.error
import urllib.request
from collections import Counter
from concurrent.futures import ThreadPoolExecutor

BASE = (sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:3100').rstrip('/')
OUT = sys.argv[2] if len(sys.argv) > 2 else 'canonical.json'
EXTRA = sys.argv[3:]


def client_ip():
    return '10.%d.%d.%d' % (random.randint(1, 250), random.randint(1, 250), random.randint(1, 250))


def get(path):
    req = urllib.request.Request(BASE + path, headers={'x-e2e-client-ip': client_ip()})
    try:
        r = urllib.request.urlopen(req)
        return r.status, r.headers, r.read().decode('utf-8', 'replace')
    except urllib.error.HTTPError as e:
        return e.code, e.headers, e.read().decode('utf-8', 'replace')


def check(path):
    status, headers, html = get(path)
    head = html[:html.find('</head>')]
    link = ' , '.join(headers.get_all('Link') or [])
    canon_html = re.findall(r'<link rel="canonical" href="([^"]+)"', head)
    alt_html = set(re.findall(r'<link rel="alternate" hrefLang="([a-z-]+)"', head, re.I))
    canon_hdr = re.findall(r'<([^>]+)>; rel="canonical"', link)
    alt_hdr = set(re.findall(r'rel="alternate"; hreflang="([a-z-]+)"', link))
    distinct = set(re.sub(r'^https?://[^/]+', '', c) for c in canon_html + canon_hdr)
    return {
        'path': path, 'status': status,
        'has': bool(canon_html or canon_hdr),
        'alts': {'en', 'ms'} <= (alt_html | alt_hdr),
        'self': any(c.endswith(path.split('?')[0]) for c in canon_html + canon_hdr),
        'html': len(canon_html), 'hdr': len(canon_hdr), 'distinct': len(distinct),
        'linkHeaders': len(headers.get_all('Link') or []),
        'preloadInLink': 'rel=preload' in link or 'rel="preload"' in link,
    }


def main():
    locs = [re.sub(r'^https?://[^/]+', '', u) for u in re.findall(r'<loc>([^<]+)</loc>', get('/sitemap.xml')[2])]
    with ThreadPoolExecutor(8) as ex:
        rows = list(ex.map(check, locs))
    ok = [r for r in rows if r['has'] and r['alts'] and r['self']]
    print('sitemap urls', len(rows), '; canonical + en + ms + self-canonical on', len(ok))
    print('canonical in html head on', sum(1 for r in rows if r['html']), '; in Link header on', sum(1 for r in rows if r['hdr']))
    print('Link header canonical count per response:', dict(Counter(r['hdr'] for r in rows)))
    print('html head canonical count per response:', dict(Counter(r['html'] for r in rows)))
    print('distinct canonical URLs per response:', dict(Counter(r['distinct'] for r in rows)))
    print('Link headers per response:', dict(Counter(r['linkHeaders'] for r in rows)), '; preload in Link on', sum(1 for r in rows if r['preloadInLink']))
    bad = [r for r in rows if r not in ok or r['distinct'] != 1]
    print('bad sample', bad[:5])
    extra = [check(p) for p in EXTRA]
    for r in extra:
        print('extra', r)
    with open(OUT, 'w') as f:
        json.dump({'sitemap': rows, 'extra': extra}, f, indent=1)
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main())
