import { useMemo, useState } from 'react';
import { loadCurriculum } from './lib/loadContent';
import { useActiveChild } from './lib/progress';
import { bandProgress } from './lib/gating';
import { ChildBar } from './components/ChildBar';
import { JourneyMap } from './components/JourneyMap';
import { LessonView } from './components/LessonView';

export function App() {
  // Content is loaded + validated once at startup. Schema is law: if any file
  // is off-spec it shows up here and is never rendered as a lesson.
  const index = useMemo(() => loadCurriculum(), []);
  const child = useActiveChild();

  const [band, setBand] = useState<string>(index.ageBands[0] ?? '9-10');
  const [openLessonId, setOpenLessonId] = useState<string | null>(null);

  if (index.issues.length > 0) {
    return <ValidationError issues={index.issues.map((i) => `${i.source}: ${i.message}`)} />;
  }

  const bp = bandProgress(index, child, band);

  return (
    <div className="min-h-screen" style={{ background: 'var(--paper)', color: 'var(--ink)' }}>
      <header
        className="sticky top-0 z-10 border-b backdrop-blur"
        style={{ borderColor: 'var(--ink)', background: 'rgba(250,247,242,0.92)' }}
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-baseline gap-3">
              <h1 className="text-lg font-bold tracking-tight">
                Future Founder<span style={{ color: 'var(--accent)' }}>.</span>
              </h1>
              <span className="microlabel hidden sm:inline" style={{ color: 'var(--ink-faint)' }}>
                An interactive learning journey
              </span>
            </div>
            <ChildBar />
          </div>

          {/* Age-band tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {index.ageBands.map((b) => {
              const active = b === band;
              return (
                <button
                  key={b}
                  onClick={() => {
                    setBand(b);
                    setOpenLessonId(null);
                  }}
                  className="microlabel border px-3 py-1.5 transition-colors"
                  style={
                    active
                      ? {
                          background: 'var(--ink)',
                          color: 'var(--paper)',
                          borderColor: 'var(--ink)',
                        }
                      : {
                          background: 'transparent',
                          color: 'var(--ink-soft)',
                          borderColor: 'var(--line)',
                        }
                  }
                >
                  Ages {b}
                </button>
              );
            })}
            <span className="index-num ml-auto text-xs" style={{ color: 'var(--ink-soft)' }}>
              {bp.lessonsDone}/{bp.lessonsTotal} lessons · {bp.projectsDone}/{bp.projectsTotal}{' '}
              projects
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
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
            <div className="mb-10">
              <p className="microlabel mb-2" style={{ color: 'var(--accent)' }}>
                Your journey
              </p>
              <h2 className="text-3xl font-bold tracking-tight">Ages {band}</h2>
              <p className="mt-2 max-w-xl text-sm" style={{ color: 'var(--ink-soft)' }}>
                Each column is a pillar. Finish a quarter&rsquo;s lessons to unlock the next
                milestone.
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

      <footer className="border-t" style={{ borderColor: 'var(--line)' }}>
        <div
          className="microlabel mx-auto max-w-6xl px-4 py-6"
          style={{ color: 'var(--ink-faint)' }}
        >
          Future Founder &amp; Leader — a project-based curriculum for an AI-first world
        </div>
      </footer>
    </div>
  );
}

function ValidationError({ issues }: { issues: string[] }) {
  return (
    <div className="min-h-screen p-8" style={{ background: 'var(--paper)', color: 'var(--ink)' }}>
      <p className="microlabel mb-2" style={{ color: 'var(--accent)' }}>
        Validation failed
      </p>
      <h1 className="text-xl font-bold">Curriculum failed validation</h1>
      <p className="mt-1 text-sm" style={{ color: 'var(--ink-soft)' }}>
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
