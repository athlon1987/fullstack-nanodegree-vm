import { useState } from 'react';
import { addChild, selectChild, useProgressState } from '../lib/progress';
import { PlusIcon } from './icons';

/**
 * Per-child profile switcher. Progress is stored per child in localStorage, so
 * a family can share one device.
 */
export function ChildBar() {
  const { activeChildId, children } = useProgressState();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  const list = Object.values(children);

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    addChild(trimmed);
    setName('');
    setAdding(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="microlabel" style={{ color: 'var(--ink-faint)' }}>
        Learner
      </span>
      {list.map((c) => {
        const active = c.id === activeChildId;
        return (
          <button
            key={c.id}
            onClick={() => selectChild(c.id)}
            className="border px-3 py-1 text-sm font-semibold transition-colors"
            style={
              active
                ? { background: 'var(--ink)', color: 'var(--paper)', borderColor: 'var(--ink)' }
                : { background: 'transparent', color: 'var(--ink)', borderColor: 'var(--line)' }
            }
          >
            {c.name}
          </button>
        );
      })}
      {adding ? (
        <span className="flex items-center gap-1.5">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
              if (e.key === 'Escape') setAdding(false);
            }}
            placeholder="Name"
            className="w-28 border px-3 py-1 text-sm focus:outline-none"
            style={{ borderColor: 'var(--ink)', background: 'var(--paper-raised)' }}
          />
          <button
            onClick={submit}
            className="border px-3 py-1 text-sm font-semibold"
            style={{ background: 'var(--ink)', color: 'var(--paper)', borderColor: 'var(--ink)' }}
          >
            Add
          </button>
        </span>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 border border-dashed px-3 py-1 text-sm font-medium transition-colors hover:border-solid"
          style={{ borderColor: 'var(--ink-faint)', color: 'var(--ink-soft)' }}
        >
          <PlusIcon size={12} />
          Add learner
        </button>
      )}
    </div>
  );
}
