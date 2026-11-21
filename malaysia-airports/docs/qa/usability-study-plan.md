# Moderated usability study: plan

Owner: head of quality. Date: 21 November 2026. Status: **plan, not run.** No participant has used the product yet.

This plan answers the review panel's item 6.1.13 ([`panel/re-review.md`](panel/re-review.md)) and backlog dependency
OOS-15 ([`fix-backlog.md`](fix-backlog.md)): a moderated study on phones in English and Malay, including screen-reader
and magnifier users. It turns the study design in [`usability.md`](usability.md), section 7, into a protocol MAHB can
commission. The delivery team runs the sessions and the analysis; **MAHB funds the study, recruits the participants
and signs off the results**.

Sources for the tasks: the critical journeys and top 15 tasks in
[`../strategy/product-strategy.md`](../strategy/product-strategy.md), sections 4.1 and 4.2; the simulated walkthrough
in [`usability.md`](usability.md), sections 2 and 3 (one expert, 18 tasks, 36 runs, no users); and the round-four
state of the build ([`verification.md`](verification.md), Round four). Figures marked [proposal] are this plan's
choices, to be confirmed with MAHB.

---

## 1. Objectives

| # | Objective | Decision it feeds |
|---|---|---|
| O1 | Find where real passengers fail or hesitate on the critical journeys, on their own phones, in English and Malay | The issue list to fix before a closed pilot (formative round) |
| O2 | Measure task success, unaided success and time on task against the brief's and the strategy's targets | The launch decision, task by task (summative round) |
| O3 | Find the barriers that NVDA, VoiceOver on iOS, TalkBack and screen-magnifier users meet on the same tasks, with their WCAG references | The accessibility fixes, and the scope of the accessibility statement |
| O4 | Test whether people read the provenance labels and round four's wording as intended: "Official", "Estimated", "Suggestion", "Not published", "Demonstration data", "Status not available", "Past:" and "Rates not verified" | Whether the honesty labels work, or mislead |
| O5 | Measure the same tasks on the current MAHB site | The baselines the strategy lacks (success, time and SUS today) |

Out of scope: the accuracy of operational data (the build uses demonstration flights), a WCAG conformance audit
(a separate expert task), and commerce, since nothing can be bought.

## 2. Stages and builds

| Stage | When | Build | Purpose |
|---|---|---|---|
| 1. Pilot | Week 1 | The current build on staging | 2 internal and 3 external sessions: debug the scripts, timings, answer key, Malay wording and recording |
| 2. Formative | Weeks 2 to 3 | The current build (round four, `ygqxXIFcmSWq51rkxYSGE`, or later), demonstration data stated to every participant | O1, O3, O4: think-aloud, issue list |
| 3. Summative | Weeks 5 to 6 | The launch candidate with the **official flight feed on staging** (OOS-01) | O2, O3, O4: timed, no think-aloud |
| Baseline | Weeks 5 to 6 | The current MAHB site | O5: the same tasks, a matched group |

The summative round does not run on demonstration data: if the official feed is not on staging by week 5, it waits.

**Staging set-up** (Team, with MAHB hosting): HTTPS; the client-address header declared (`TRUSTED_CLIENT_IP_HEADER`)
so that participants do not share one rate-limit bucket; the "Concept prototype" banner kept. Flights follow the
clock: either pick each session's flight numbers from `/api/flights?airport=kul&direction=d&limit=200` on the day,
or fix both the server and the browser clock, never one alone (gallery note 6, `docs/prototype/README.md`). Without a
fixed clock, do not schedule board tasks between about 22:55 and 05:05 Kuala Lumpur time, when the KLIA board's
window holds no demonstration departures.

## 3. Participants

Recruited by MAHB, through the channels in [`usability.md`](usability.md), section 7.3: professional panels,
corporate travel desks, parenting groups, disability and self-advocacy organisations, autism organisations (for
example NASOM), community centres, Butterfly Effect registrants and MAHB's assistance desk with consent, and
intercepts in the KLIA halls with MAHB's permission.

| Group | Persona | Screener | Formative | Summative (phone / desktop) |
|---|---|---|---|---|
| Frequent travellers | P1, P8 | Flies from KLIA at least monthly (P1), or weekly on domestic routes including Subang, Penang, Kota Kinabalu or Kuching (P8) | 6 | 11 / 7 |
| First-time international visitors | P2 | Has never visited Malaysia; includes people with English as a second language; remote, before travel | 5 | 10 / 2 |
| Families with an infant | P3 | Child under 2; has flown or will fly within 6 months | 3 | 7 / 2 |
| Wheelchair and mobility-aid users | P4 | Uses a wheelchair or mobility aid when flying | 3 | 10 / 3 |
| Older travellers | P5 | 65 or over; prefers Bahasa Malaysia; at least half use 125% text or larger | 5 | 10 / 3 |
| Neurodivergent travellers, or parents | P6 | Autistic or ADHD adults, or parents of autistic children (the parent takes part) | 3 | 10 / 2 |
| Transit passengers | P7 | Has self-transferred between KLIA Terminal 1 and Terminal 2 | 4 | 4 / 2 |
| People who meet arrivals | P9 | Has collected someone at KLIA in the last 6 months | 3 | 2 / 3 |
| **Persona groups** | | | **32** | **64 / 24** |
| Screen-reader users: NVDA | any | Uses NVDA daily with Chrome, Edge or Firefox on Windows, for a year or more | 3 | 2 (reported descriptively) |
| Screen-reader users: VoiceOver | any | Uses VoiceOver daily on an iPhone, for a year or more | 3 | 2 |
| Screen-reader users: TalkBack | any | Uses TalkBack daily on an Android phone, for a year or more | 3 | 2 |
| Screen-magnifier users | any | Uses a magnifier (ZoomText, Windows Magnifier, iOS or Android zoom) at 200% or more | 3 | 2 |
| **All** | | | **44** | **64 / 24, plus 8** |

- **Language.** At least 40% of sessions in Bahasa Malaysia, at least one Malay session in every group, and at least 3
  of the 5 formative P5 sessions in Malay. At least 2 of the 12 assistive-technology participants use Malay.
- **First-time and frequent.** Record every participant's flights in the last 12 months and whether they have used
  KLIA, so that results can be split by experience, not only by persona.
- **Devices.** Participants' own phones and their own assistive-technology settings; an Android majority on phones
  (to be matched to MAHB's analytics once available). Half the phone sessions on a throttled 4G profile; a roaming
  profile for P2 and P7.
- **Baseline.** A group matched on persona and language, at least 32 phone participants [proposal], on the current
  MAHB site.
- **Exclusions.** MAHB and delivery-team staff and their households; anyone who has taken part in an earlier session
  of this study; anyone under 18.
- **Incentives** (assessment from usability.md): about RM 100 to RM 150 for a 60-minute session and RM 50 for a
  15-minute intercept; 90-minute sessions for assistive-technology and P4 participants, with travel costs and a
  companion's costs paid. Paid in full even if the participant stops early.

## 4. Tasks and success criteria

Scenarios avoid interface words ("tile", "Meeting mode", "Tanya Kami"). The answer key is written from the build
under test in the week before each round and frozen; if content changes, the key changes with a dated note. Where
the honest answer is that a fact is not published, success is reporting that and naming whom to ask: that is the
correct answer on this build, and the product should make it findable.

### 4.1 Core tasks (strategy tasks 1, 3, 4, 5, 6, 7, 9 and 10)

| Task | Journey (strategy 4.2) | Scenario (example wording) | Success: the participant states … | Target (strategy) | Simulated result, 18 Nov (usability.md) |
|---|---|---|---|---|---|
| C1 Flight status | Departing | "Your flight [chosen on the day] leaves this evening. Find out whether it is on time and where you need to go." | the status, terminal and gate shown | 30 s median; 2 interactions | Success, unaided (P1-T1) |
| C3 When to arrive | Departing | "You fly at [time]. What time should you be at the airport?" | the arrive-by or check-in closing time shown, and that the airline sets the deadline | 3 interactions | Success, unaided; answer 8 scrolls down at 125% text (P5-T1), moved up since |
| C4 Into the city | Arriving; ground transport | "You land at KLIA Terminal 1 and need to reach KL Sentral. How will you go, and what will it cost?" | an official option, its fare and the date the fare is valid to, and not to accept rides offered in the hall | 2 interactions | Success, unaided (P2-T1); touting guidance missing then, added since |
| C5 Parking | Parking | "You will park at KLIA for three days. How much will it cost, and where would you book?" | a figure per car park with its status (today every KLIA rate reads "not verified") or "no price published", and reaches the official booking hand-off | 60 s to a price; 3 interactions to a price, 5 to the hand-off | Success, unaided (P1-T2) |
| C6 Meet an arrival | Meeting | "Your cousin lands from Bali tonight. When should you be in the arrival hall, where do you wait, and where can you pick her up?" | the estimated exit time and that it is an estimate, the waiting area, and a pick-up point or that none is published | 3 interactions | Success with a gap: no pick-up point (P9-T1) |
| C7 A facility | Accessibility; facilities | "You are at Terminal 1 and need a prayer room." (P3: a nursing room) | its location and side of security, or "not published" and whom to ask | 45 s; 2 interactions | Nursing room partial (P3-T1); Calm Room success (P6-T2) |
| C9 Self-transfer | Transiting | "You land at Terminal 1 at 10:00 and fly from Terminal 2 at 13:00 on a separate ticket. Is that enough time? What must you do?" | the verdict, the ordered steps (immigration, bags, train or shuttle, check in again, security) and to contact the departing airline if it is tight | 2 min; 3 interactions | Success, unaided; verdict 4,279 px down (P7-T1), now at 454 px |
| C10 Assistance | Accessibility | "You use a wheelchair and fly with [airline]. Arrange help for your trip." (Alternate Malaysia Airlines and AirAsia.) | the request route (through the airline) and its lead time: 48 hours for Malaysia Airlines; for an airline whose notice period is not published, that it is not published and to ask the airline | 2 interactions | Success, unaided (P4-T1) |

### 4.2 Persona tasks (two per group)

| Group | Task A: success | Task B: success |
|---|---|---|
| P1 | Save the flight from C1 and find it again from the home page later in the session: the saved flight is found from the home; the participant says updates arrive only while a page of the site is open | Faster way through security at KLIA (strategy task 15): names Fast Track for the right terminal, says its price and hours are not published, reaches the hand-off |
| P8 | Subang's parking daily cap (task 5, another airport): says it is not published and names the official route | Save a flight and find it again from the home page (as P1, task A) |
| P2 | What to submit before landing (task 11): the Malaysia Digital Arrival Card, within three days before arrival, free on the official portal | Which KLIA terminal AirAsia uses (task 2): Terminal 2 |
| P3 | Baby milk and baby food through security (task 12): allowed, with the rule shown | Food open now before security at Terminal 1 (task 13): names an outlet and its side of security, or that hours are estimated |
| P4 | "Is the train to the satellite building running now?" (task 8): states any notice with its date, or that the status is not available and where to check; **does not conclude it is running normally from the absence of a notice** | Step-free route from the arrival hall to the taxi (task 7 and C-08): the route and its lift; that the taxi counter is not on the map |
| P5 | Switch to Malay and the largest text, then answer C3 (task 3): set-up done unaided and the time stated | Reach a verified phone number and say what it is for (task 14): a labelled official number, such as the group line +60 3 8777 0000 |
| P6 | What the Butterfly Effect offers and how to register (task 10): register at an information counter for a Butterfly Kit | Calm Room in Terminal 2 (task 7): the Mezzanine Floor (Level 3A) of the Departure Hall |
| P7 | Train or shuttle between terminals (task 9): train RM 2, the free shuttle, and that the sources disagree on its frequency | "Your first flight lands an hour late." (task 9): contact the departing airline first, then an information counter |
| P9 | Short-stay parking for 2 to 3 hours at Terminal 1 (task 5): that no rate is verified (klia.info gives RM 52 a day), or the estimate shown with its status | Save the arriving flight and check from the home page whether it has landed (task 1, repeat use): the status shown |

**Assistive-technology participants** do C1, C3, C7 and C10, then one persona task that fits their travel, so
that each technology meets the flight page, the timeline, the facilities list and the assistance route.

### 4.3 Session plan

| Part | Formative (60 min; AT and P4 90 min) | Summative (75 min) |
|---|---|---|
| Welcome, notice and consent | 10 min | 10 min |
| Background: flying, devices, assistive technology, language | 5 min | 5 min |
| Tasks | 4 core tasks (rotated, so each core task has at least 16 attempts) and 2 persona tasks, thinking aloud | All 8 core tasks and 2 persona tasks, no thinking aloud |
| SEQ after each task; SUS; comprehension and trust probes | 10 min | 10 min |
| Debrief | 5 min | 5 min |

Order is counterbalanced (a Latin square over the core tasks). Ceilings: 5 minutes a task, 3 minutes for C1.
In-terminal intercepts: 15 minutes, 2 tasks, with passengers who have time; never near boarding.

## 5. Method

- **Moderated, one participant at a time**, in person (Klang Valley, Penang, Kota Kinabalu; in the KLIA halls for
  intercepts) or remotely (P2 before travel; assistive-technology users who prefer their own set-up, sharing their
  screen and their screen reader's speech).
- **Moderators.** Two trained moderators, one a native Malay speaker who runs every Malay session; a note-taker; an
  assistive-technology specialist moderates or co-moderates those sessions. Moderators read the same script and
  give only the prompts in it.
- **Help levels**, logged per task: 0 none; 1 the task card re-read; 2 a hint; 3 the moderator shows the way.
  **Unaided** means level 0 or 1 with no external search engine and no phone call (as usability.md 7.5). Level 2 or
  3 is a failure for unaided success.
- **Coding.** Each answer is coded against the frozen key as success, partial or failure; partial counts as failure.
  Two coders code a 20% sample independently and report their agreement; the moderators do not code their own
  sessions.
- **Recording**, with consent: screen, audio and, optionally, face; the moderator's timer; interactions, scrolls,
  wrong turns and first clicks from the recording.
- **Observers** from MAHB watch live from another room or stream, in small numbers, with the participant told.

## 6. Metrics and targets

| Metric | Definition | Target | Source |
|---|---|---|---|
| Task success | Correct answer against the key, any help level | At least 95%, all core tasks pooled | Brief |
| Unaided success | Success at help level 0 or 1 | At least 90% for each core task; at least 80% among P2, P4, P5 and P6 together | Brief; strategy section 7 |
| Time on task | From reading the task card to stating the answer; median, and geometric mean with a 95% interval | Flight status 30 s; parking price 60 s; T1 to T2 plan 2 min; prayer room 45 s (medians) | Strategy section 7 |
| Errors | Wrong turns (left the shortest path, then recovered); dead ends; **critical errors**: a wrong answer the participant would act on, such as the wrong terminal, a time already past, "Status not available" read as "running normally" or a "not verified" price read as confirmed | No critical error on C1, C3 and C10 [proposal]; all others reported per task | This plan |
| SEQ | Single Ease Question (1 to 7) after each task | Median at least 6 | usability.md 7.1 (proposed there) |
| SUS | System Usability Scale at the end; a validated Malay version, or one back-translated and checked in the pilot | At least 80 with a 95% interval, and compared with the baseline | usability.md 7.1 (proposed there; 68 is the commonly cited average) |
| Label comprehension | The participant explains each label and says whether it would change what they do | At least 80% correct per label | usability.md 7.1 |
| Trust | "How sure are you that this answer is correct?" (1 to 7), after C4 and C5 | Reported; compared with the baseline | usability.md 7.5 |
| Accessibility barriers | Each barrier with its WCAG 2.2 criterion, the technology and browser, and whether it blocked the task | No barrier that blocks a core task | Strategy section 7 |

**Analysis.**

- **Formative:** frequencies only ("4 of 6 P5 participants …"), no rates claimed for the population.
- **Summative:** every rate with an adjusted-Wald interval. With 64 phone participants, **62 of 64** unaided successes
  pass the 90% target and 61 do not; the pooled 95% target needs **at least 497 of 512** attempts (usability.md
  7.6). The 80% subgroup target (P2, P4, P5 and P6, n = 40) is reported with its interval, and any task below 80% is
  a launch blocker. Time and SUS are compared with the baseline by Mann-Whitney U, with effect sizes.
- **Assistive technology:** too few for rates; reported per technology and task, with every barrier.
- Any core task that misses its target goes back for a fix and a retest. It is not averaged away.

## 7. Ethics and consent under the PDPA

The study collects personal data (names, contact details, voice and possibly face recordings) and, for many
participants, data about health or disability, which the Personal Data Protection Act 2010 treats as sensitive
personal data. MAHB's data protection officer and counsel review this section, the notice and the consent form
before recruitment starts. This is not legal advice.

- **Roles.** MAHB is the data controller for the study (the Act's term since the 2024 amendments); the team, any
  recruitment agency and any partner organisation process data for it under written agreements.
- **Notice before consent**, in Bahasa Malaysia and English: the purpose, what is collected, the recording, who sees
  it, how long it is kept, the right to see and correct one's data, how to withdraw, and whom to contact.
- **Separate consents:** taking part; screen and audio recording; face video (optional); clips in a highlights video
  (optional); and **explicit consent** to record information about health or disability.
- **Accessible formats:** large print, easy read, a screen-reader-ready form, and the notice read aloud with verbal
  consent recorded for people who cannot sign. A companion may attend.
- **Minimisation.** Tasks use scenario data. Participants are asked not to enter booking references, passport or
  payment details, and to silence notifications on their own phones. No one under 18 takes part.
- **Storage and retention.** Recordings are stored encrypted in Malaysia, open only to named researchers, and
  deleted when analysis ends, by a date stated in the notice (for example 6 months after the final report
  [proposal]). Reports use participant codes, not names. A recording tool that stores data outside Malaysia is used
  only if it meets the Act's cross-border transfer conditions.
- **Breaches** are reported to MAHB's data protection officer at once, so that MAHB can meet its notification duties
  under the amended Act.
- **Withdrawal** at any time, without giving a reason and without losing the incentive; the participant's recording
  is then deleted.
- **Wellbeing.** P6 participants receive the agenda in advance, a quiet room and breaks; disabled participants an
  accessible venue and paid travel. Moderators give no advice on a participant's real trip; if a real problem comes
  up (for example assistance not yet booked), they point to the airline and MAHB's official channels.
- **Ethics review.** If MAHB's policy or a partner organisation requires one, allow 2 weeks for it.

## 8. Schedule

| Week | Activity | Owner |
|---|---|---|
| −2 to 0 | Approvals: notice and consent forms, DPO and counsel review, incentives; recruitment brief and screeners; staging with HTTPS; Malay script reviewed by a native editor (OOS-14) | MAHB, with the team |
| 0 to 1 | Recruitment (continues through week 5) | MAHB |
| 1 | Pilot: 5 sessions; fix the scripts, key and timings | Team |
| 2 to 3 | Formative: 44 sessions; a daily debrief; the issue list grows as issues are confirmed | Team; MAHB observes |
| 3 to 4 | Fixes, each with a test, and independent verification on a production build | Team |
| 5 to 6 | Summative (88 sessions, plus 8 assistive-technology sessions) and baseline (at least 32); needs the official feed on staging | Team; MAHB recruits |
| 7 | Analysis | Team |
| 8 | Report, decision note for the launch board, MAHB sign-off | Team; MAHB |

About 8 weeks after 2 weeks of set-up, as in usability.md 7.7. The formative round can start on the current build;
the summative round depends on OOS-01. After launch, repeat the study every six months (strategy section 7).

## 9. How results feed the backlog

1. **Issue log.** Every observed problem gets an id (`UT-nn`), the task, the participants affected (n of N, with
   persona, language and technology), the evidence (recording and time), and for assistive-technology barriers the
   WCAG criterion.
2. **Severity and priority**, using the backlog's rules ([`fix-backlog.md`](fix-backlog.md)): critical blocks a
   critical task or is unsafe (a critical error in section 6 is critical); high is major friction or a WCAG A or AA
   failure with real user impact; P0 is critical or high, P1 every other in-repo fix, and P2 or an OOS dependency
   anything that needs MAHB data or partners.
3. **Mapping.** Each issue is linked to what it confirms or reopens: a backlog item (A-01 to E-25), a finding in
   [`usability.md`](usability.md) (`usability-nn`), a re-review item (6.1 or 6.2) or an OOS dependency. New items go
   to the package that owns the files, with an acceptance criterion taken from the task's success criterion.
4. **Content failures** (for example no pick-up point, no Subang parking price) go to MAHB as data requests, with the
   number of participants they stopped, so that MAHB can rank its data work.
5. **Fixes** are verified as in the four fix rounds: a test that fails without the fix, then an independent check on
   a production build. Each fixed issue is retested in the next study round.
6. **Reporting.** The summative results replace "not measurable in a prototype" in the task rows of
   [`qa-report.md`](qa-report.md), section 2, and give the strategy its missing baselines (section 7). Deliverables:
   per-task success and time with intervals, SUS, label comprehension, the issue log (Markdown and JSON, anonymised),
   a highlights video from consenting participants, and a one-page decision note for the launch board.
