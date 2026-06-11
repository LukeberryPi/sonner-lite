# sonner-lite

A trimmed-down fork of [Sonner](https://github.com/emilkowalski/sonner) by Emil Kowalski.

It keeps everything that makes Sonner feel great — all animations, the default stacking behaviour, every position, and swipe gestures — and removes everything else: variants, rich colors, icons, themes, expand mode.

- `packages/sonner-lite` — the `@lukeberrypi/sonner-lite` npm library
- `apps/website` — a minimal demo site (Vite + React + Tailwind)

## Usage

```tsx
import { toast, Toaster } from '@lukeberrypi/sonner-lite';

// Render once, anywhere in your app
<Toaster position="bottom-right" />;

// Then anywhere
toast('Hello', { description: 'Optional description' });
toast.custom((id) => <div>Anything</div>);
toast.dismiss();
```

The toast is unstyled by default (a white box with centered text and a close button on the right). Baseline visuals live in Tailwind's `base` layer and use zero-specificity selectors, so Tailwind v3 and v4 utilities override them cleanly:

```tsx
<Toaster
  toastOptions={{
    classNames: {
      toast: 'bg-neutral-900 text-white rounded-xl',
      title: 'font-semibold',
      description: 'text-neutral-400',
      closeButton: 'hover:bg-neutral-700',
    },
  }}
/>
```

Want a full-width toast? Override the width with a class on the `toast` slot:

```tsx
<Toaster toastOptions={{ classNames: { toast: 'w-[calc(100vw-2rem)]' } }} />
```

## Development

```bash
bun install
bun run build   # build the library
bun run dev     # run the demo website
```

MIT — original work copyright Emil Kowalski (see packages/sonner-lite/LICENSE.md).
