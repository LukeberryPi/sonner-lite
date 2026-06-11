import React from 'react';

export interface ToastClassnames {
  toast?: string;
  title?: string;
  description?: string;
  closeButton?: string;
}

export interface ToastT {
  id: number | string;
  title?: (() => React.ReactNode) | React.ReactNode;
  jsx?: React.ReactNode;
  dismissible?: boolean;
  description?: (() => React.ReactNode) | React.ReactNode;
  duration?: number;
  delete?: boolean;
  onDismiss?: (toast: ToastT) => void;
  onAutoClose?: (toast: ToastT) => void;
  style?: React.CSSProperties;
  className?: string;
  classNames?: ToastClassnames;
  testId?: string;
}

export type Position = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';

export interface HeightT {
  height: number;
  toastId: number | string;
}

export interface ToastOptions {
  className?: string;
  style?: React.CSSProperties;
  duration?: number;
  classNames?: ToastClassnames;
  closeButtonAriaLabel?: string;
}

export type Offset =
  | {
      top?: string | number;
      right?: string | number;
      bottom?: string | number;
      left?: string | number;
    }
  | string
  | number;

export interface ToasterProps {
  position?: Position;
  hotkey?: string[];
  duration?: number;
  gap?: number;
  visibleToasts?: number;
  toastOptions?: ToastOptions;
  className?: string;
  style?: React.CSSProperties;
  offset?: Offset;
  mobileOffset?: Offset;
  dir?: 'rtl' | 'ltr' | 'auto';
  swipeDirections?: SwipeDirection[];
  customAriaLabel?: string;
  containerAriaLabel?: string;
}

export type SwipeDirection = 'top' | 'right' | 'bottom' | 'left';

export interface ToastProps {
  toast: ToastT;
  toasts: ToastT[];
  index: number;
  swipeDirections?: SwipeDirection[];
  expanded: boolean;
  heights: HeightT[];
  setHeights: React.Dispatch<React.SetStateAction<HeightT[]>>;
  removeToast: (toast: ToastT) => void;
  gap: number;
  position: Position;
  visibleToasts: number;
  interacting: boolean;
  style?: React.CSSProperties;
  duration?: number;
  className?: string;
  classNames?: ToastClassnames;
  closeButtonAriaLabel?: string;
}

export interface ToastToDismiss {
  id: number | string;
  dismiss: boolean;
}

export type ExternalToast = Omit<ToastT, 'id' | 'title' | 'jsx' | 'delete'> & {
  id?: number | string;
};
