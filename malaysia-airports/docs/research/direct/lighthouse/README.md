# Lighthouse lab measurements (17 November 2026)

Independently measured by this project, not taken from any publisher. Lighthouse 13, mobile emulation with simulated slow-4G throttling, run from a shared cloud container; median of the valid runs (up to 3).

**Read these as indicative only.** Hosts outside the session allowlist (analytics, tag managers, chat widgets, some image and video CDNs) were blocked, which removes weight and scripts that real visitors download; other jobs shared the CPU; a single location was used. They are not field data and are not comparable with Chrome UX Report figures. The useful signal is the order of magnitude and the pattern of failures, not the exact score.

| Site | URL | Valid runs | Performance | Accessibility | Best practices | SEO | LCP | TBT | CLS | Page weight | Requests |
|---|---|---|---|---|---|---|---|---|---|---|---|
| mahb | https://airports.malaysiaairports.com.my/en/klia1 | 1/3 | 9 | 79 | 85 | 100 | 6.9 s | 4461 ms | 0.621 | 32.7 MB | 171 |
| mahb-departures | https://airports.malaysiaairports.com.my/en/klia1/flight-information/departures | 0/3 | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| changi | https://www.changiairport.com/ | 3/3 | 58 | 74 | 96 | 85 | 7.9 s | 379 ms | 0.077 | 21.0 MB | 122 |
| heathrow | https://www.heathrow.com/ | 3/3 | 56 | 92 | 96 | 92 | 6.3 s | 393 ms | 0.102 | 1.8 MB | 47 |
| hamad | https://dohahamadairport.com/ | 0/3 | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| hkia | https://www.hongkongairport.com/en/ | 3/3 | 28 | 68 | 50 | 83 | 8.9 s | 2454 ms | 0.184 | 2.3 MB | 59 |
| dubai | https://www.dubaiairports.ae/ | 3/3 | 68 | 100 | 96 | 92 | 6.1 s | 26 ms | 0 | 4.4 MB | 94 |
| munich | https://www.munich-airport.com/ | 3/3 | 47 | 47 | 96 | 85 | 8.7 s | 389 ms | 0 | 4.6 MB | 63 |
| haneda | https://tokyo-haneda.com/en/ | 3/3 | 49 | 80 | 96 | 91 | 24.5 s | 732 ms | 0.062 | 13.2 MB | 187 |
| istanbul | https://www.istairport.com/en | 3/3 | 53 | 78 | 92 | 92 | 16.7 s | 163 ms | 0 | 5.9 MB | 100 |
| incheon | https://www.airport.kr/ap_en/index.do | 3/3 | 27 | 79 | 73 | 100 | 25.1 s | 2403 ms | 0 | 4.5 MB | 215 |
| schiphol | https://www.schiphol.nl/en/ | 3/3 | 76 | 92 | 96 | 82 | 1.6 s | 1079 ms | 0 | 0.5 MB | 9 |

Notes

- **mahb** is the KLIA Terminal 1 homepage of airports.malaysiaairports.com.my. An earlier run the same day (under heavier CPU contention) gave performance 19, accessibility 79, LCP 5.2 s, CLS 0.621, 34.3 MB, 172 requests; the departures page gave performance 17, accessibility 82, LCP 17.5 s, CLS 0.453, 2.3 MB, 114 requests. The departures page could not be re-measured in the second run because the site stopped answering this network (see the audit).
- **schiphol** is NOT a measurement of the Schiphol site: the response was a Cloudflare bot-challenge page (9 requests). It is listed only to record that the site could not be measured. We did not attempt to bypass the challenge.
- **hamad** failed in the second run (no first contentful paint within the time limit). The first run the same day gave performance 55, accessibility 82, best practices 69, SEO 69, LCP 36.6 s, 11.6 MB, 191 requests.
- Accessibility scores are automated checks only (roughly a third of WCAG issues are machine-detectable) and are not conformance claims.
