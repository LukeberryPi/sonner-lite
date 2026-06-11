import type { ExternalToast, ToastContent, ToastFunction, ToastT, ToastToDismiss } from './types';

import React from 'react';

let toastsCounter = 1;

type ToastSubscriber = (toast: ToastT | ToastToDismiss) => void;
type ToastCreateInput = ExternalToast & {
  message?: ToastContent;
  jsx?: React.ReactElement;
};

class Observer {
  subscribers: ToastSubscriber[];
  toasts: Array<ToastT | ToastToDismiss>;
  dismissedToasts: Set<string | number>;

  constructor() {
    this.subscribers = [];
    this.toasts = [];
    this.dismissedToasts = new Set();
  }

  // We use arrow functions to maintain the correct `this` reference
  subscribe: (subscriber: ToastSubscriber) => () => void = (subscriber) => {
    this.subscribers.push(subscriber);

    return (): void => {
      const index = this.subscribers.indexOf(subscriber);
      this.subscribers.splice(index, 1);
    };
  };

  publish: (data: ToastT) => void = (data) => {
    this.subscribers.forEach((subscriber) => subscriber(data));
  };

  addToast: (data: ToastT) => void = (data) => {
    this.publish(data);
    this.toasts = [...this.toasts, data];
  };

  create: (data: ToastCreateInput) => number | string = (data) => {
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

  dismiss: (id?: number | string) => number | string | undefined = (id) => {
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

  custom: (jsx: (id: number | string) => React.ReactElement, data?: ExternalToast) => number | string = (jsx, data) => {
    const id = data?.id || toastsCounter++;
    this.create({ jsx: jsx(id), ...data, id });
    return id;
  };
}

export const ToastState: Observer = new Observer();

const toastFunction = (message: ToastContent, data?: ExternalToast) => {
  const id = data?.id || toastsCounter++;

  ToastState.addToast({
    title: message,
    ...data,
    id,
  });
  return id;
};

// We use `Object.assign` to maintain the correct types as we would lose them otherwise
export const toast: ToastFunction = Object.assign(toastFunction, {
  dismiss: ToastState.dismiss,
  custom: ToastState.custom,
});
