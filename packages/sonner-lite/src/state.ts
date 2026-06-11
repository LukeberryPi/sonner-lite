import type { ExternalToast, ToastT, ToastToDismiss } from './types';

import React from 'react';

let toastsCounter = 1;

type titleT = (() => React.ReactNode) | React.ReactNode;

class Observer {
  subscribers: Array<(toast: ExternalToast | ToastToDismiss) => void>;
  toasts: Array<ToastT | ToastToDismiss>;
  dismissedToasts: Set<string | number>;

  constructor() {
    this.subscribers = [];
    this.toasts = [];
    this.dismissedToasts = new Set();
  }

  // We use arrow functions to maintain the correct `this` reference
  subscribe = (subscriber: (toast: ToastT | ToastToDismiss) => void) => {
    this.subscribers.push(subscriber);

    return () => {
      const index = this.subscribers.indexOf(subscriber);
      this.subscribers.splice(index, 1);
    };
  };

  publish = (data: ToastT) => {
    this.subscribers.forEach((subscriber) => subscriber(data));
  };

  addToast = (data: ToastT) => {
    this.publish(data);
    this.toasts = [...this.toasts, data];
  };

  create = (
    data: ExternalToast & {
      message?: titleT;
      jsx?: React.ReactElement;
    },
  ) => {
    const { message, ...rest } = data;
    const id = typeof data?.id === 'number' || data.id?.length > 0 ? data.id : toastsCounter++;
    const alreadyExists = this.toasts.find((toast) => {
      return toast.id === id;
    });
    const dismissible = data.dismissible === undefined ? true : data.dismissible;

    if (this.dismissedToasts.has(id)) {
      this.dismissedToasts.delete(id);
    }

    if (alreadyExists) {
      this.toasts = this.toasts.map((toast) => {
        if (toast.id === id) {
          this.publish({ ...toast, ...data, id, title: message });
          return {
            ...toast,
            ...data,
            id,
            dismissible,
            title: message,
          };
        }

        return toast;
      });
    } else {
      this.addToast({ title: message, ...rest, dismissible, id });
    }

    return id;
  };

  dismiss = (id?: number | string) => {
    if (id) {
      this.dismissedToasts.add(id);
      requestAnimationFrame(() => this.subscribers.forEach((subscriber) => subscriber({ id, dismiss: true })));
    } else {
      this.toasts.forEach((toast) => {
        this.subscribers.forEach((subscriber) => subscriber({ id: toast.id, dismiss: true }));
      });
    }

    return id;
  };

  custom = (jsx: (id: number | string) => React.ReactElement, data?: ExternalToast) => {
    const id = data?.id || toastsCounter++;
    this.create({ jsx: jsx(id), ...data, id });
    return id;
  };
}

export const ToastState = new Observer();

const toastFunction = (message: titleT, data?: ExternalToast) => {
  const id = data?.id || toastsCounter++;

  ToastState.addToast({
    title: message,
    ...data,
    id,
  });
  return id;
};

interface ToastFunction {
  (message: titleT, data?: ExternalToast): number | string;
  dismiss: (id?: number | string) => number | string | undefined;
  custom: (jsx: (id: number | string) => React.ReactElement, data?: ExternalToast) => number | string;
}

// We use `Object.assign` to maintain the correct types as we would lose them otherwise
export const toast: ToastFunction = Object.assign(toastFunction, {
  dismiss: ToastState.dismiss,
  custom: ToastState.custom,
});
