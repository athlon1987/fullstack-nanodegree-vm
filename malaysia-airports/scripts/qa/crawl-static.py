#!/usr/bin/env python3
"""Static link crawl of a running build (server HTML, no JavaScript).

Seeds: every <loc> in /sitemap.xml, plus /en and /ms. Fetches each same-origin HTML page, collects its
<a href> targets, checks that every target answers 200 (redirects are followed and reported) and that
every #fragment exists as an id on the target page. Pages found through links are crawled too, so the
crawl covers pages that are linked but not in the sitemap.

Each request carries a fresh client address in the x-e2e-client-ip header. Start the server with
TRUSTED_CLIENT_IP_HEADER=x-e2e-client-ip so per-route rate limits cannot show up as broken links.

Usage:  python3 scripts/qa/crawl-static.py [BASE_URL] [OUT_JSON]
        (defaults: http://localhost:3100 and crawl-static.json)
Prints the counts; the JSON lists every broken link, missing anchor and redirect with the pages that
link to it. Exit code 1 when anything is broken or missing.
Standard library only (Python 3.9 or later).
"""
import json
import random
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser

BASE = (sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:3100').rstrip('/')
OUT = sys.argv[2] if len(sys.argv) > 2 else 'crawl-static.json'
MAX_PAGES = 4000
CLIENT_HEADER = 'x-e2e-client-ip'


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


opener = urllib.request.build_opener(NoRedirect)


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.hrefs, self.ids = [], set()

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get('id'):
            self.ids.add(a['id'])
        if tag == 'a' and a.get('href'):
            self.hrefs.append(a['href'])


def client_ip():
    return '10.%d.%d.%d' % (random.randint(1, 250), random.randint(1, 250), random.randint(1, 250))


def fetch(url, hops=0):
    """Returns (final_status, final_url, body, redirect_chain)."""
    req = urllib.request.Request(url, headers={'Accept': 'text/html', 'Accept-Language': 'en', CLIENT_HEADER: client_ip()})
    try:
        with opener.open(req, timeout=30) as r:
            body = r.read().decode('utf-8', 'replace') if 'html' in r.headers.get('content-type', '') else ''
            return r.status, url, body, []
    except urllib.error.HTTPError as e:
        if e.code in (301, 302, 303, 307, 308) and hops < 5:
            loc = urllib.parse.urljoin(url, e.headers.get('location'))
            status, final, body, chain = fetch(loc, hops + 1)
            return status, final, body, [(e.code, loc)] + chain
        return e.code, url, '', []
    except Exception as e:  # noqa: BLE001 - report any network failure as a broken target
        return f'ERR {e}', url, '', []


def norm(href, page):
    if href.startswith(('mailto:', 'tel:', 'javascript:', 'data:', 'sms:')):
        return None
    url = urllib.parse.urljoin(page, href)
    if urllib.parse.urlparse(url).netloc != urllib.parse.urlparse(BASE).netloc:
        return None
    return url


def visit(url):
    status, final, body, chain = fetch(url)
    parser = Links()
    if body:
        parser.feed(body)
    links = [n for n in (norm(h, final) for h in parser.hrefs) if n]
    return url, {'status': status, 'final': final, 'chain': chain, 'ids': parser.ids, 'links': links}


def main():
    xml = urllib.request.urlopen(urllib.request.Request(BASE + '/sitemap.xml', headers={CLIENT_HEADER: client_ip()})).read().decode()
    seeds = [urllib.parse.urljoin(BASE, urllib.parse.urlparse(u).path) for u in re.findall(r'<loc>([^<]+)</loc>', xml)]
    seeds += [BASE + '/en', BASE + '/ms']
    seeds = sorted(set(seeds))

    pages = {}  # url without fragment -> info
    linked_from = defaultdict(set)  # link (with fragment) -> pages that link to it
    queue = list(seeds)
    seen = set(queue)
    with ThreadPoolExecutor(max_workers=8) as pool:
        while queue and len(pages) < MAX_PAGES:
            batch, queue = queue[:64], queue[64:]
            for url, info in pool.map(visit, batch):
                pages[url] = info
                for link in info['links']:
                    linked_from[link].add(url)
                    target = link.split('#')[0]
                    path = urllib.parse.urlparse(target).path
                    # Crawl HTML pages only (not the API, build assets or files with an extension).
                    if target not in seen and not path.startswith(('/api/', '/_next/')) and not re.search(r'\.[a-z0-9]+$', path):
                        seen.add(target)
                        queue.append(target)

    # Targets that were not crawled as pages (files, API routes, assets): status only.
    extra = sorted({link.split('#')[0] for link in linked_from} - set(pages))
    with ThreadPoolExecutor(max_workers=8) as pool:
        for url, info in pool.map(visit, extra):
            pages[url] = info

    broken, missing_anchor, redirects = [], [], []
    for link, sources in sorted(linked_from.items()):
        target, _, frag = link.partition('#')
        info = pages.get(target)
        status = info['status'] if info else 'unchecked'
        if status != 200:
            broken.append({'link': link, 'status': status, 'from': sorted(sources)[:5], 'count': len(sources)})
            continue
        if info['chain']:
            redirects.append({'link': link, 'chain': info['chain'], 'from': sorted(sources)[:3]})
        if frag:
            frag_dec = urllib.parse.unquote(frag)
            if frag_dec not in info['ids'] and frag_dec not in ('main', 'top', ''):
                missing_anchor.append({'link': link, 'from': sorted(sources)[:5], 'count': len(sources)})

    html_pages = [u for u, i in pages.items() if i['links'] or i['ids']]
    summary = {
        'base': BASE,
        'seeds': len(seeds),
        'pages_crawled': len(html_pages),
        'urls_checked': len(pages),
        'unique_links': len(linked_from),
        'broken': broken,
        'missing_anchor': missing_anchor,
        'redirected_links': len(redirects),
        'redirect_samples': redirects[:15],
        'non_200_pages': [{'url': u, 'status': i['status']} for u, i in pages.items() if i['status'] != 200][:50],
    }
    with open(OUT, 'w') as f:
        json.dump(summary, f, indent=1, default=list)
    print(json.dumps({k: (len(v) if isinstance(v, list) else v) for k, v in summary.items()}, indent=1))
    return 1 if broken or missing_anchor else 0


if __name__ == '__main__':
    sys.exit(main())
