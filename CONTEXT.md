# sonner-lite

A trimmed-down fork of Sonner: one toast variant, unstyled-by-default, Tailwind-friendly. The library and its demo website live in this repo as a two-package monorepo.

## Language

**Toast**:
A single notification rendered by the Toaster. There is exactly one kind — no variants, no icons, no action or cancel buttons.
_Avoid_: notification, snackbar, alert

**Toaster**:
The single mount point that renders all toasts. An app has exactly one; there is no id-based routing to multiple Toasters and no theme. Text direction (ltr/rtl/auto) is supported.

**Invocation surface**:
The public functions for creating and removing toasts: `toast()`, `toast.dismiss()`, and `toast.custom()`. Upstream variant methods (`success`, `error`, `info`, `warning`, `loading`, `promise`) do not exist.

**Baseline**:
The minimal default look of a toast: white box, border, centered text, close button vertically centered on the right. Any consumer-supplied class overrides it without a specificity fight.
_Avoid_: theme, default styles

**Structural CSS**:
The non-negotiable stylesheet rules that make toasts work at all: positioning, stacking transforms, enter/exit animations, swipe gestures. Always shipped, never overridable.

**Slot**:
A named part of the toast that accepts consumer classes: `toast`, `title`, `description`, `closeButton`. Settable globally on the Toaster and per-toast; width and border are styled through the `toast` slot.

**Stacking**:
The default Sonner layout where toasts overlap in a collapsed pile and spread apart on hover or via the keyboard hotkey. Always on; there is no expand option.
_Avoid_: expand

**Position**:
Where the toast stack anchors in the viewport. All six values survive (top/bottom crossed with left/center/right), decided once on the Toaster — individual toasts cannot override it.

**Full width**:
Not a library feature. Toasts have a reasonable default width; consumers who want viewport-spanning toasts pass a width class on the `toast` slot (e.g. `w-[calc(100vw-2rem)]`), which overrides the baseline width.

**Close button**:
The X rendered on every toast. Not configurable via a prop; `dismissible: false` is the only way to remove it, and that also disables swipe-to-dismiss for that toast.
_Avoid_: closeButton prop

**Dismissible**:
A per-toast flag (default true). When false, the toast has no close button and cannot be swiped away; it leaves only by timeout or `toast.dismiss()`.
