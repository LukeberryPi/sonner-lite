import { useState } from 'react';
import { toast, Toaster, type Position } from '@lukeberrypi/sonner-lite';
import '@lukeberrypi/sonner-lite/dist/styles.css';

const positions: Position[] = ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'];

export default function App() {
  const [position, setPosition] = useState<Position>('bottom-right');
  const [fullWidth, setFullWidth] = useState(false);
  const [styled, setStyled] = useState(false);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-8 px-6 py-16 font-sans text-neutral-900">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">sonner-lite</h1>
        <p className="leading-relaxed text-neutral-600">
          A trimmed-down fork of{' '}
          <a className="underline" href="https://sonner.emilkowal.ski" target="_blank" rel="noreferrer">
            Sonner
          </a>{' '}
          by Emil Kowalski. It keeps everything that makes Sonner feel great — the animations, the stacking, the swipe
          gestures, every position — and removes everything else: variants, rich colors, icons, themes. One toast,
          unstyled by default, ready to be styled with Tailwind classes.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <button
          className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
          onClick={() => toast('Hello from sonner-lite', { description: 'This is the unstyled baseline.' })}
        >
          Spawn a toast
        </button>

        <div className="flex flex-wrap gap-2">
          {positions.map((p) => (
            <button
              key={p}
              onClick={() => setPosition(p)}
              className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                position === p ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300 hover:bg-neutral-100'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="flex gap-4 text-sm text-neutral-700">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={fullWidth} onChange={(e) => setFullWidth(e.target.checked)} />
            Full width (via Tailwind class)
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={styled} onChange={(e) => setStyled(e.target.checked)} />
            Tailwind-styled toast
          </label>
        </div>
      </section>

      <Toaster
        position={position}
        toastOptions={{
          classNames: {
            toast: [
              fullWidth ? 'w-[calc(100vw-2rem)]' : '',
              styled ? 'bg-neutral-900 text-white border-neutral-700 rounded-xl' : '',
            ]
              .filter(Boolean)
              .join(' '),
            title: styled ? 'font-semibold' : '',
            description: styled ? 'text-neutral-400' : '',
            closeButton: styled ? 'hover:bg-neutral-700' : '',
          },
        }}
      />
    </main>
  );
}
