import { useMemo, useState } from 'react';
import { loadCurriculum } from './lib/loadContent';
import { useActiveChild } from './lib/progress';
import { bandProgress } from './lib/gating';
import { ChildBar } from './components/ChildBar';
import { JourneyMap } from './components/JourneyMap';
import { LessonView } from './components/LessonView';

export function App() {
  // Content is loaded + validated once at startup. Schema is law: if any file is
  // off-spec it shows up here and is never rendered as a lesson.
  const index = useMemo(() => loadCurriculum(), []);
  const child = useActiveChild();

  const [band, setBand] = useState<string>(index.ageBands[0] ?? '9-10');
  const [openLessonId, setOpenLessonId] = useState<string | null>(null);

  if (index.issues.length > 0) {
    return <ValidationError issues={index.issues.map((i) => `${i.source}: ${i.message}`)} />;
  }

  const bp = bandProgress(index, child, band);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🚀</span>
              <h1 className="text-lg font-extrabold tracking-tight">Future Founder</h1>
              <span className="hidden text-sm text-slate-400 sm:inline">
                — an interactive learning journey
              </span>
            </div>
            <ChildBar />
          </div>

          {/* Age-band tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {index.ageBands.map((b) => (
              <button
                key={b}
                onClick={() => {
                  setBand(b);
                  setOpenLessonId(null);
                }}
                className={
                  'rounded-lg px-3 py-1 text-sm font-semibold transition ' +
                  (b === band
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200')
                }
              >
                Ages {b}
              </button>
            ))}
            <span className="ml-auto text-sm font-medium text-slate-500">
              {bp.lessonsDone}/{bp.lessonsTotal} lessons · {bp.projectsDone}/{bp.projectsTotal}{' '}
              projects
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {openLessonId ? (
          <LessonView
            index={index}
            child={child}
            lessonId={openLessonId}
            onBack={() => setOpenLessonId(null)}
            onOpenLesson={(id) => setOpenLessonId(id)}
          />
        ) : (
          <>
            <div className="mb-5">
              <h2 className="text-xl font-bold text-slate-900">Ages {band} — your journey</h2>
              <p className="text-sm text-slate-500">
                Each column is a pillar. Finish a quarter's lessons to light up the next milestone.
              </p>
            </div>
            <JourneyMap
              index={index}
              child={child}
              band={band}
              onOpenLesson={(id) => setOpenLessonId(id)}
            />
          </>
        )}
      </main>
    </div>
  );
}

function ValidationError({ issues }: { issues: string[] }) {
  return (
    <div className="min-h-screen bg-red-50 p-8 text-red-900">
      <h1 className="text-xl font-bold">Curriculum failed validation</h1>
      <p className="mt-1 text-sm">
        Off-spec content was rejected and will not be rendered. Fix these, then reload:
      </p>
      <ul className="mt-4 list-disc space-y-1 pl-6 text-sm">
        {issues.map((issue, i) => (
          <li key={i}>
            <code>{issue}</code>
          </li>
        ))}
      </ul>
    </div>
  );
}
