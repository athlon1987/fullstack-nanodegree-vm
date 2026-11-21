// The unchanged e2e suite with the browser clock at night (verification round 5). Usage, from the
// malaysia-airports folder, against a server already on :3100:
//   NODE_OPTIONS="--require ./scripts/qa/night-clock.cjs" E2E_NIGHT=2026-11-18T23:30:00+08:00 npx playwright test
// Every context the `context` fixture creates gets an init script that shifts Date to E2E_NIGHT when
// the page starts (time keeps running). Tests that set their own clock with page.clock replace Date
// again, so their pinned instants still apply; contexts a test creates itself with browser.newContext
// keep the real clock. The flight feed answers for the browser's instant, so a board without a pinned
// clock shows the night window (at 23:30 KL: 23:20 to 05:30, no departures). Keep E2E_NIGHT on the
// date the pinned tests use (18 November): a test that installs fake timers (page.clock.install)
// still sees the shifted date in places, so a different date makes its saved flight look days old.
const Module = process.getBuiltinModule('node:module');
const NIGHT = Date.parse(process.env.E2E_NIGHT || '2026-11-18T23:30:00+08:00');
const originalLoad = Module._load;
let wrapped = null;
Module._load = function load(request, ...rest) {
  const loaded = originalLoad.call(this, request, ...rest);
  if (request !== '@playwright/test') return loaded;
  if (!wrapped) {
    const test = loaded.test.extend({
      context: async ({ context }, use) => {
        await context.addInitScript((night) => {
          const RealDate = Date;
          const offset = night - RealDate.now();
          class NightDate extends RealDate {
            constructor(...args) {
              if (args.length === 0) super(RealDate.now() + offset);
              else super(...args);
            }
            static now() {
              return RealDate.now() + offset;
            }
          }
          globalThis.Date = NightDate;
        }, NIGHT);
        await use(context);
      },
    });
    wrapped = new Proxy(loaded, {
      get(target, key) {
        if (key === 'test' || key === 'default') return test;
        return Reflect.get(target, key);
      },
    });
  }
  return wrapped;
};
