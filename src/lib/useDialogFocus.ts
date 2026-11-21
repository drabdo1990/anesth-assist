import { useEffect, useRef } from 'react';

const FOCUSABLE = 'button:not([disabled]),a[href],input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';
const dialogStack: symbol[] = [];
let bodyLocks = 0;
let previousOverflow = '';

const lockBody = () => {
  if (bodyLocks++ === 0) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
};

const unlockBody = () => {
  if (bodyLocks > 0 && --bodyLocks === 0) document.body.style.overflow = previousOverflow;
};

/** Keep keyboard focus inside a modal and close it with Escape. */
export const useDialogFocus = <T extends HTMLElement>(active: boolean, onClose: () => void) => {
  const ref = useRef<T>(null);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!active) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const node = ref.current;
    const token = Symbol('dialog');
    dialogStack.push(token);
    const focusables = () => [...(node?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])];
    (focusables()[0] ?? node)?.focus(); // focus the dialog's first control
    lockBody();

    const onKeyDown = (event: KeyboardEvent) => {
      if (dialogStack[dialogStack.length - 1] !== token) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) {
        event.preventDefault();
        node?.focus();
        return;
      }
      if (!node?.contains(document.activeElement)) {
        event.preventDefault();
        items[0].focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      const index = dialogStack.lastIndexOf(token);
      if (index >= 0) dialogStack.splice(index, 1);
      unlockBody();
      previous?.focus();
    };
  }, [active]);

  return ref;
};
