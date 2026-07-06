import { useState } from 'react';
import { addChild, selectChild, useProgressState } from '../lib/progress';

/**
 * Per-child profile switcher. Progress is stored per child in localStorage, so
 * a family can share one device. Minimal on purpose — this is the MVP shell.
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
      <span className="text-sm font-medium text-slate-500">Explorer:</span>
      {list.map((c) => (
        <button
          key={c.id}
          onClick={() => selectChild(c.id)}
          className={
            'rounded-full px-3 py-1 text-sm font-semibold transition ' +
            (c.id === activeChildId
              ? 'bg-indigo-600 text-white shadow'
              : 'bg-white text-slate-700 ring-1 ring-slate-300 hover:ring-indigo-400')
          }
        >
          {c.name}
        </button>
      ))}
      {adding ? (
        <span className="flex items-center gap-1">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
              if (e.key === 'Escape') setAdding(false);
            }}
            placeholder="Name"
            className="w-28 rounded-full border border-slate-300 px-3 py-1 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <button
            onClick={submit}
            className="rounded-full bg-indigo-600 px-3 py-1 text-sm font-semibold text-white"
          >
            Add
          </button>
        </span>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="rounded-full border border-dashed border-slate-400 px-3 py-1 text-sm font-medium text-slate-600 hover:border-indigo-500 hover:text-indigo-600"
        >
          + Add child
        </button>
      )}
    </div>
  );
}
