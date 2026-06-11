'use client';

import React from 'react';
import ReactDOM from 'react-dom';

import { useIsDocumentHidden } from './hooks';
import { toast, ToastState } from './state';
import './styles.css';
import {
  SwipeDirection,
  type ExternalToast,
  type HeightT,
  type Position,
  type ToasterProps,
  type ToastProps,
  type ToastT,
  type ToastToDismiss,
} from './types';

// Visible toasts amount
const VISIBLE_TOASTS_AMOUNT = 3;

// Viewport padding
const VIEWPORT_OFFSET = '24px';

// Mobile viewport padding
const MOBILE_VIEWPORT_OFFSET = '16px';

// Default lifetime of a toasts (in ms)
const TOAST_LIFETIME = 4000;

// Default toast width
const TOAST_WIDTH = 356;

// Default gap between toasts
const GAP = 14;

// Threshold to dismiss a toast
const SWIPE_THRESHOLD = 45;

// Equal to exit animation duration
const TIME_BEFORE_UNMOUNT = 200;

const CloseIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

function getDefaultSwipeDirections(position: string): Array<SwipeDirection> {
  const [y, x] = position.split('-');
  const directions: Array<SwipeDirection> = [];

  if (y) {
    directions.push(y as SwipeDirection);
  }

  if (x) {
    directions.push(x as SwipeDirection);
  }

  return directions;
}

const Toast = (props: ToastProps) => {
  const {
    toast,
    interacting,
    setHeights,
    visibleToasts,
    heights,
    index,
    toasts,
    expanded,
    removeToast,
    style,
    className = '',
    duration: durationFromToaster,
    position,
    gap,
    classNames,
    closeButtonAriaLabel = 'Close toast',
  } = props;
  const [swipeDirection, setSwipeDirection] = React.useState<'x' | 'y' | null>(null);
  const [swipeOutDirection, setSwipeOutDirection] = React.useState<'left' | 'right' | 'up' | 'down' | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const [removed, setRemoved] = React.useState(false);
  const [swiping, setSwiping] = React.useState(false);
  const [swipeOut, setSwipeOut] = React.useState(false);
  const [isSwiped, setIsSwiped] = React.useState(false);
  const [offsetBeforeRemove, setOffsetBeforeRemove] = React.useState(0);
  const [initialHeight, setInitialHeight] = React.useState(0);
  const remainingTime = React.useRef(toast.duration || durationFromToaster || TOAST_LIFETIME);
  const dragStartTime = React.useRef<Date | null>(null);
  const toastRef = React.useRef<HTMLLIElement>(null);
  const isFront = index === 0;
  const isVisible = index + 1 <= visibleToasts;
  const dismissible = toast.dismissible !== false;
  const toastClassname = toast.className || '';
  // Height index is used to calculate the offset as it gets updated before the toast array, which means we can calculate the new layout faster.
  const heightIndex = React.useMemo(
    () => heights.findIndex((height) => height.toastId === toast.id) || 0,
    [heights, toast.id],
  );
  const duration = React.useMemo(
    () => toast.duration || durationFromToaster || TOAST_LIFETIME,
    [toast.duration, durationFromToaster],
  );
  const closeTimerStartTimeRef = React.useRef(0);
  const offset = React.useRef(0);
  const lastCloseTimerStartTimeRef = React.useRef(0);
  const pointerStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const [y, x] = position.split('-');
  const toastsHeightBefore = React.useMemo(() => {
    return heights.reduce((prev, curr, reducerIndex) => {
      // Calculate offset up until current toast
      if (reducerIndex >= heightIndex) {
        return prev;
      }

      return prev + curr.height;
    }, 0);
  }, [heights, heightIndex]);
  const isDocumentHidden = useIsDocumentHidden();

  offset.current = React.useMemo(() => heightIndex * gap + toastsHeightBefore, [heightIndex, toastsHeightBefore]);

  React.useEffect(() => {
    remainingTime.current = duration;
  }, [duration]);

  React.useEffect(() => {
    // Trigger enter animation without using CSS animation
    setMounted(true);
  }, []);

  React.useEffect(() => {
    const toastNode = toastRef.current;
    if (toastNode) {
      const height = toastNode.getBoundingClientRect().height;
      // Add toast height to heights array after the toast is mounted
      setInitialHeight(height);
      setHeights((h) => [{ toastId: toast.id, height }, ...h]);
      return () => setHeights((h) => h.filter((height) => height.toastId !== toast.id));
    }
  }, [setHeights, toast.id]);

  React.useLayoutEffect(() => {
    // Keep height up to date with the content in case it updates
    if (!mounted) return;
    const toastNode = toastRef.current;
    const originalHeight = toastNode.style.height;
    toastNode.style.height = 'auto';
    const newHeight = toastNode.getBoundingClientRect().height;
    toastNode.style.height = originalHeight;

    setInitialHeight(newHeight);

    setHeights((heights) => {
      const alreadyExists = heights.find((height) => height.toastId === toast.id);
      if (!alreadyExists) {
        return [{ toastId: toast.id, height: newHeight }, ...heights];
      } else {
        return heights.map((height) => (height.toastId === toast.id ? { ...height, height: newHeight } : height));
      }
    });
  }, [mounted, toast.title, toast.description, setHeights, toast.id, toast.jsx]);

  const deleteToast = React.useCallback(() => {
    // Save the offset for the exit swipe animation
    setRemoved(true);
    setOffsetBeforeRemove(offset.current);
    setHeights((h) => h.filter((height) => height.toastId !== toast.id));

    setTimeout(() => {
      removeToast(toast);
    }, TIME_BEFORE_UNMOUNT);
  }, [toast, removeToast, setHeights, offset]);

  React.useEffect(() => {
    if (toast.duration === Infinity) return;
    let timeoutId: NodeJS.Timeout;

    // Pause the timer on each hover
    const pauseTimer = () => {
      if (lastCloseTimerStartTimeRef.current < closeTimerStartTimeRef.current) {
        // Get the elapsed time since the timer started
        const elapsedTime = new Date().getTime() - closeTimerStartTimeRef.current;

        remainingTime.current = remainingTime.current - elapsedTime;
      }

      lastCloseTimerStartTimeRef.current = new Date().getTime();
    };

    const startTimer = () => {
      // setTimeout(, Infinity) behaves as if the delay is 0.
      // As a result, the toast would be closed immediately, giving the appearance that it was never rendered.
      // See: https://github.com/denysdovhan/wtfjs?tab=readme-ov-file#an-infinite-timeout
      if (remainingTime.current === Infinity) return;

      closeTimerStartTimeRef.current = new Date().getTime();

      // Let the toast know it has started
      timeoutId = setTimeout(() => {
        toast.onAutoClose?.(toast);
        deleteToast();
      }, remainingTime.current);
    };

    if (expanded || interacting || isDocumentHidden) {
      pauseTimer();
    } else {
      startTimer();
    }

    return () => clearTimeout(timeoutId);
  }, [expanded, interacting, toast, isDocumentHidden, deleteToast]);

  React.useEffect(() => {
    if (toast.delete) {
      deleteToast();
      toast.onDismiss?.(toast);
    }
  }, [deleteToast, toast.delete]);

  return (
    <li
      tabIndex={0}
      ref={toastRef}
      className={cn(className, toastClassname, classNames?.toast, toast?.classNames?.toast)}
      data-sonner-toast=""
      data-mounted={mounted}
      data-swiped={isSwiped}
      data-removed={removed}
      data-visible={isVisible}
      data-y-position={y}
      data-x-position={x}
      data-index={index}
      data-front={isFront}
      data-swiping={swiping}
      data-dismissible={dismissible}
      data-swipe-out={swipeOut}
      data-swipe-direction={swipeOutDirection}
      data-expanded={Boolean(expanded)}
      data-testid={toast.testId}
      style={
        {
          '--index': index,
          '--toasts-before': index,
          '--z-index': toasts.length - index,
          '--offset': `${removed ? offsetBeforeRemove : offset.current}px`,
          '--initial-height': `${initialHeight}px`,
          ...style,
          ...toast.style,
        } as React.CSSProperties
      }
      onDragEnd={() => {
        setSwiping(false);
        setSwipeDirection(null);
        pointerStartRef.current = null;
      }}
      onPointerDown={(event) => {
        if (event.button === 2) return; // Return early on right click
        if (!dismissible) return;
        dragStartTime.current = new Date();
        setOffsetBeforeRemove(offset.current);
        // Ensure we maintain correct pointer capture even when going outside of the toast (e.g. when swiping)
        (event.target as HTMLElement).setPointerCapture(event.pointerId);
        if ((event.target as HTMLElement).tagName === 'BUTTON') return;
        setSwiping(true);
        pointerStartRef.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerUp={() => {
        if (swipeOut || !dismissible) return;

        pointerStartRef.current = null;
        const swipeAmountX = Number(
          toastRef.current?.style.getPropertyValue('--swipe-amount-x').replace('px', '') || 0,
        );
        const swipeAmountY = Number(
          toastRef.current?.style.getPropertyValue('--swipe-amount-y').replace('px', '') || 0,
        );
        const timeTaken = new Date().getTime() - dragStartTime.current?.getTime();

        const swipeAmount = swipeDirection === 'x' ? swipeAmountX : swipeAmountY;
        const velocity = Math.abs(swipeAmount) / timeTaken;

        if (Math.abs(swipeAmount) >= SWIPE_THRESHOLD || velocity > 0.11) {
          setOffsetBeforeRemove(offset.current);

          toast.onDismiss?.(toast);

          if (swipeDirection === 'x') {
            setSwipeOutDirection(swipeAmountX > 0 ? 'right' : 'left');
          } else {
            setSwipeOutDirection(swipeAmountY > 0 ? 'down' : 'up');
          }

          deleteToast();
          setSwipeOut(true);

          return;
        } else {
          toastRef.current?.style.setProperty('--swipe-amount-x', `0px`);
          toastRef.current?.style.setProperty('--swipe-amount-y', `0px`);
        }
        setIsSwiped(false);
        setSwiping(false);
        setSwipeDirection(null);
      }}
      onPointerMove={(event) => {
        if (!pointerStartRef.current || !dismissible) return;

        const isHighlighted = window.getSelection()?.toString().length > 0;
        if (isHighlighted) return;

        const yDelta = event.clientY - pointerStartRef.current.y;
        const xDelta = event.clientX - pointerStartRef.current.x;

        const swipeDirections = props.swipeDirections ?? getDefaultSwipeDirections(position);

        // Determine swipe direction if not already locked
        if (!swipeDirection && (Math.abs(xDelta) > 1 || Math.abs(yDelta) > 1)) {
          setSwipeDirection(Math.abs(xDelta) > Math.abs(yDelta) ? 'x' : 'y');
        }

        let swipeAmount = { x: 0, y: 0 };

        const getDampening = (delta: number) => {
          const factor = Math.abs(delta) / 20;

          return 1 / (1.5 + factor);
        };

        // Only apply swipe in the locked direction
        if (swipeDirection === 'y') {
          // Handle vertical swipes
          if (swipeDirections.includes('top') || swipeDirections.includes('bottom')) {
            if ((swipeDirections.includes('top') && yDelta < 0) || (swipeDirections.includes('bottom') && yDelta > 0)) {
              swipeAmount.y = yDelta;
            } else {
              // Smoothly transition to dampened movement
              const dampenedDelta = yDelta * getDampening(yDelta);
              // Ensure we don't jump when transitioning to dampened movement
              swipeAmount.y = Math.abs(dampenedDelta) < Math.abs(yDelta) ? dampenedDelta : yDelta;
            }
          }
        } else if (swipeDirection === 'x') {
          // Handle horizontal swipes
          if (swipeDirections.includes('left') || swipeDirections.includes('right')) {
            if ((swipeDirections.includes('left') && xDelta < 0) || (swipeDirections.includes('right') && xDelta > 0)) {
              swipeAmount.x = xDelta;
            } else {
              // Smoothly transition to dampened movement
              const dampenedDelta = xDelta * getDampening(xDelta);
              // Ensure we don't jump when transitioning to dampened movement
              swipeAmount.x = Math.abs(dampenedDelta) < Math.abs(xDelta) ? dampenedDelta : xDelta;
            }
          }
        }

        if (Math.abs(swipeAmount.x) > 0 || Math.abs(swipeAmount.y) > 0) {
          setIsSwiped(true);
        }

        // Apply transform using both x and y values
        toastRef.current?.style.setProperty('--swipe-amount-x', `${swipeAmount.x}px`);
        toastRef.current?.style.setProperty('--swipe-amount-y', `${swipeAmount.y}px`);
      }}
    >
      <div data-content="">
        <div data-title="" className={cn(classNames?.title, toast?.classNames?.title)}>
          {toast.jsx ? toast.jsx : typeof toast.title === 'function' ? toast.title() : toast.title}
        </div>
        {toast.description ? (
          <div data-description="" className={cn(classNames?.description, toast?.classNames?.description)}>
            {typeof toast.description === 'function' ? toast.description() : toast.description}
          </div>
        ) : null}
      </div>
      {dismissible && !toast.jsx ? (
        <button
          aria-label={closeButtonAriaLabel}
          data-close-button
          onClick={() => {
            deleteToast();
            toast.onDismiss?.(toast);
          }}
          className={cn(classNames?.closeButton, toast?.classNames?.closeButton)}
        >
          {CloseIcon}
        </button>
      ) : null}
    </li>
  );
};

function getDocumentDirection(): ToasterProps['dir'] {
  if (typeof window === 'undefined') return 'ltr';
  if (typeof document === 'undefined') return 'ltr'; // For Fresh purpose

  const dirAttribute = document.documentElement.getAttribute('dir');

  if (dirAttribute === 'auto' || !dirAttribute) {
    return window.getComputedStyle(document.documentElement).direction as ToasterProps['dir'];
  }

  return dirAttribute as ToasterProps['dir'];
}

function assignOffset(defaultOffset: ToasterProps['offset'], mobileOffset: ToasterProps['mobileOffset']) {
  const styles = {} as React.CSSProperties;

  [defaultOffset, mobileOffset].forEach((offset, index) => {
    const isMobile = index === 1;
    const prefix = isMobile ? '--mobile-offset' : '--offset';
    const defaultValue = isMobile ? MOBILE_VIEWPORT_OFFSET : VIEWPORT_OFFSET;

    function assignAll(offset: string | number) {
      ['top', 'right', 'bottom', 'left'].forEach((key) => {
        styles[`${prefix}-${key}`] = typeof offset === 'number' ? `${offset}px` : offset;
      });
    }

    if (typeof offset === 'number' || typeof offset === 'string') {
      assignAll(offset);
    } else if (typeof offset === 'object') {
      ['top', 'right', 'bottom', 'left'].forEach((key) => {
        if (offset[key] === undefined) {
          styles[`${prefix}-${key}`] = defaultValue;
        } else {
          styles[`${prefix}-${key}`] = typeof offset[key] === 'number' ? `${offset[key]}px` : offset[key];
        }
      });
    } else {
      assignAll(defaultValue);
    }
  });

  return styles;
}

const Toaster: React.ForwardRefExoticComponent<ToasterProps & React.RefAttributes<HTMLElement>> = React.forwardRef<
  HTMLElement,
  ToasterProps
>(function Toaster(props, ref) {
  const {
    position = 'bottom-right',
    hotkey = ['altKey', 'KeyT'],
    className,
    offset,
    mobileOffset,
    duration,
    style,
    visibleToasts = VISIBLE_TOASTS_AMOUNT,
    toastOptions,
    gap = GAP,
    dir = getDocumentDirection(),
    customAriaLabel,
    containerAriaLabel = 'Notifications',
  } = props;
  const [toasts, setToasts] = React.useState<ToastT[]>([]);
  const [heights, setHeights] = React.useState<HeightT[]>([]);
  const [expanded, setExpanded] = React.useState(false);
  const [interacting, setInteracting] = React.useState(false);

  const listRef = React.useRef<HTMLOListElement>(null);
  const hotkeyLabel = hotkey.join('+').replace(/Key/g, '').replace(/Digit/g, '');
  const lastFocusedElementRef = React.useRef<HTMLElement>(null);
  const isFocusWithinRef = React.useRef(false);

  const [y, x] = position.split('-');

  const removeToast = React.useCallback((toastToRemove: ToastT) => {
    setToasts((toasts) => {
      if (!toasts.find((toast) => toast.id === toastToRemove.id)?.delete) {
        ToastState.dismiss(toastToRemove.id);
      }

      return toasts.filter(({ id }) => id !== toastToRemove.id);
    });
  }, []);

  React.useEffect(() => {
    return ToastState.subscribe((toast) => {
      if ((toast as ToastToDismiss).dismiss) {
        // Prevent batching of other state updates
        requestAnimationFrame(() => {
          setToasts((toasts) => toasts.map((t) => (t.id === toast.id ? { ...t, delete: true } : t)));
        });
        return;
      }

      // Prevent batching, temp solution.
      setTimeout(() => {
        ReactDOM.flushSync(() => {
          setToasts((toasts) => {
            const indexOfExistingToast = toasts.findIndex((t) => t.id === toast.id);

            // Update the toast if it already exists
            if (indexOfExistingToast !== -1) {
              return [
                ...toasts.slice(0, indexOfExistingToast),
                { ...toasts[indexOfExistingToast], ...toast },
                ...toasts.slice(indexOfExistingToast + 1),
              ];
            }

            return [toast, ...toasts];
          });
        });
      });
    });
  }, []);

  React.useEffect(() => {
    // Ensure expanded is always false when no toasts are present / only one left
    if (toasts.length <= 1) {
      setExpanded(false);
    }
  }, [toasts]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isHotkeyPressed = hotkey.length > 0 && hotkey.every((key) => (event as any)[key] || event.code === key);

      if (isHotkeyPressed) {
        setExpanded(true);
        listRef.current?.focus();
      }

      if (
        event.code === 'Escape' &&
        (document.activeElement === listRef.current || listRef.current?.contains(document.activeElement))
      ) {
        setExpanded(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [hotkey]);

  React.useEffect(() => {
    if (listRef.current) {
      return () => {
        if (lastFocusedElementRef.current) {
          lastFocusedElementRef.current.focus({ preventScroll: true });
          lastFocusedElementRef.current = null;
          isFocusWithinRef.current = false;
        }
      };
    }
  }, [listRef.current]);

  return (
    // Remove item from normal navigation flow, only available via hotkey
    <section
      ref={ref}
      aria-label={customAriaLabel ?? `${containerAriaLabel} ${hotkeyLabel}`}
      tabIndex={-1}
      aria-live="polite"
      aria-relevant="additions text"
      aria-atomic="false"
      suppressHydrationWarning
      data-react-aria-top-layer
    >
      {toasts.length ? (
      <ol
        dir={dir === 'auto' ? getDocumentDirection() : dir}
        tabIndex={-1}
        ref={listRef}
        className={className}
        data-sonner-toaster
        data-y-position={y}
        data-x-position={x}
        style={
          {
            '--front-toast-height': `${heights[0]?.height || 0}px`,
            '--width': `${TOAST_WIDTH}px`,
            '--gap': `${gap}px`,
            ...style,
            ...assignOffset(offset, mobileOffset),
          } as React.CSSProperties
        }
        onBlur={(event) => {
          if (isFocusWithinRef.current && !event.currentTarget.contains(event.relatedTarget)) {
            isFocusWithinRef.current = false;
            if (lastFocusedElementRef.current) {
              lastFocusedElementRef.current.focus({ preventScroll: true });
              lastFocusedElementRef.current = null;
            }
          }
        }}
        onFocus={(event) => {
          const isNotDismissible = event.target instanceof HTMLElement && event.target.dataset.dismissible === 'false';

          if (isNotDismissible) return;

          if (!isFocusWithinRef.current) {
            isFocusWithinRef.current = true;
            lastFocusedElementRef.current = event.relatedTarget as HTMLElement;
          }
        }}
        onMouseEnter={() => setExpanded(true)}
        onMouseMove={() => setExpanded(true)}
        onMouseLeave={() => {
          // Avoid setting expanded to false when interacting with a toast, e.g. swiping
          if (!interacting) {
            setExpanded(false);
          }
        }}
        onDragEnd={() => setExpanded(false)}
        onPointerDown={(event) => {
          const isNotDismissible = event.target instanceof HTMLElement && event.target.dataset.dismissible === 'false';

          if (isNotDismissible) return;
          setInteracting(true);
        }}
        onPointerUp={() => setInteracting(false)}
      >
        {toasts.map((toast, index) => (
          <Toast
            key={toast.id}
            index={index}
            toast={toast}
            duration={toastOptions?.duration ?? duration}
            className={toastOptions?.className}
            visibleToasts={visibleToasts}
            interacting={interacting}
            position={position}
            style={toastOptions?.style}
            classNames={toastOptions?.classNames}
            closeButtonAriaLabel={toastOptions?.closeButtonAriaLabel}
            removeToast={removeToast}
            toasts={toasts}
            heights={heights}
            setHeights={setHeights}
            gap={gap}
            expanded={expanded}
            swipeDirections={props.swipeDirections}
          />
        ))}
      </ol>
      ) : null}
    </section>
  );
});

export { toast, Toaster };
export type {
  ExternalToast,
  Position,
  SwipeDirection,
  ToastClassnames,
  ToasterProps,
  ToastT,
  ToastToDismiss,
} from './types';
