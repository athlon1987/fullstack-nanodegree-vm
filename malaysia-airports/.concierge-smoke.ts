import { buildConciergeKnowledge } from '@/lib/concierge/knowledge.server';
import { answerQuestion } from '@/lib/concierge/engine';
import { flightSourceFromProvider } from '@/lib/concierge/flights';
import { getFlightProvider } from '@/lib/providers';
const k = buildConciergeKnowledge('en');
console.log('pack bytes', JSON.stringify(k).length);
const now = Date.parse('2026-11-17T10:00:00+08:00');
const flights = flightSourceFromProvider(getFlightProvider(now));
const some = getFlightProvider(now).listFlightsSync({ airport: 'kul', direction: 'd', limit: 3 });
console.log('sample flights', some.map(f => f.number + ' ' + f.status).join(', '));
const qs: [string, any][] = [
 ['Is the Aerotrain running?', { airport: 'kul' }],
 ['Di mana surau terdekat?', { airport: 'kul', terminal: 'T2' }],
 ['Where is the toilet?', { airport: 'kul', terminal: 'T2' }],
 [`Where do I check in for ${some[0].number}?`, {}],
 ['what is the meaning of life', {}],
 ['I need wheelchair assistance', {}],
 ['How do I get from Terminal 1 to Terminal 2?', {}],
 ['What is the cheapest way to get to KL Sentral?', {}],
 ['and in Terminal 2?', { airport: 'kul', terminal: 'T1', intent: 'facility' }],
];
const old: [string, any][] = [
 ['Where do I check in for my flight?', {}],
 ['Where do I check in for my flight?', { airport: 'kul' }],
 [`Where do I check in for ${some[0].number}?`, {}],
 ['How do I get from Terminal 1 to Terminal 2?', {}],
 ['What is the cheapest way to get to KL Sentral?', {}],
 ['Where can I eat near my departure gate?', { airport: 'kul', terminal: 'T1' }],
 ['My flight is delayed, what should I do?', {}],
 ['Where is the nearest prayer room?', { airport: 'kul', terminal: 'T1' }],
 ['What can I do during a six-hour layover at KLIA?', {}],
 ['How much does parking cost at Penang airport for 3 hours?', {}],
 ['I lost my phone at KLIA', {}],
 ['I need wheelchair assistance', {}],
 ['Is there free Wi-Fi at KLIA?', {}],
 ['Is the Aerotrain running?', { airport: 'kul' }],
 ['how much is parking at klia', {}],
 ['what is the meaning of life', {}],
 ['Bagaimana saya pergi dari Terminal 1 ke Terminal 2?', {}],
];
for (const [q, ctx] of qs) {
  const a = answerQuestion({ question: q, lang: /^(Di |Bagaimana)/.test(q) ? 'ms' : 'en', context: ctx }, { knowledge: k, now, flights });
  console.log(`\n### ${q} ${JSON.stringify(ctx)} -> ${a.intent} ctx=${JSON.stringify(a.context)}`);
  console.log('TEXT:', a.text);
  for (const s of a.statements) console.log(`  - [${s.provenance}|${s.sourceIds.length}] ${s.title ? s.title + ' :: ' : ''}${s.text.slice(0, 110)}`);
  console.log('  cards:', a.cards.map(c => c.type + ':' + c.id).join(', '));
  console.log('  actions:', a.actions.map(x => x.kind === 'link' ? x.label + '→' + x.href : 'ask:' + x.label).join(' | '));
  if (a.limits.length) console.log('  limits:', a.limits.join(' / '));
  if (a.clarify) console.log('  clarify:', a.clarify.options.map(o => o.label).join(', '));
  if (a.escalation) console.log('  escalation:', a.escalation.reason, a.escalation.contacts.length);
  console.log('  sources:', a.sources.length, 'demo', a.demo);
}
