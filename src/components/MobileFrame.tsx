import React, { useEffect } from 'react';

/**
 * Android WebViews often keep 100dvh at the pre-keyboard size.
 * Prefer percentage height (follows adjustResize) and sync visualViewport
 * as a fallback so focused forms stay visible.
 */
export function MobileFrame({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    const vv = window.visualViewport;

    const sync = () => {
      const height = vv?.height ?? window.innerHeight;
      root.style.setProperty('--app-height', `${Math.round(height)}px`);

      const layoutH = window.innerHeight;
      const vvH = vv?.height ?? layoutH;
      const vvOffset = vv?.offsetTop ?? 0;
      const inferredBottom = Math.max(0, Math.round(layoutH - vvH - vvOffset));
      const keyboardOpen = inferredBottom > 80;

      root.toggleAttribute('data-keyboard-open', keyboardOpen);
      root.style.setProperty(
        '--keyboard-inset',
        keyboardOpen ? `${inferredBottom}px` : '0px'
      );

      // When the keyboard is open, bottom padding should clear only the
      // residual system inset — not a fake 24px fallback on top of the keyboard.
      if (keyboardOpen) {
        root.style.setProperty('--sab-fallback', '0px');
      } else {
        root.style.setProperty('--sab-fallback', '4px');
      }

      const cssBottom = Number.parseFloat(
        getComputedStyle(root).getPropertyValue('--safe-area-inset-bottom')
      );
      const envProbe = document.createElement('div');
      envProbe.style.cssText =
        'position:fixed;visibility:hidden;padding-bottom:env(safe-area-inset-bottom,0px)';
      document.body.appendChild(envProbe);
      const envBottom = Number.parseFloat(getComputedStyle(envProbe).paddingBottom);
      document.body.removeChild(envProbe);

      const sab = Math.max(
        Number.isFinite(cssBottom) ? cssBottom : 0,
        Number.isFinite(envBottom) ? envBottom : 0,
        // Only use inferred gap when it looks like a system nav (not keyboard).
        !keyboardOpen && inferredBottom >= 24 && inferredBottom <= 64
          ? inferredBottom
          : 0
      );
      if (sab > 0) {
        root.style.setProperty('--sab', `${sab}px`);
        root.style.setProperty('--safe-area-inset-bottom', `${sab}px`);
      }
    };

    const onFocusIn = (e: FocusEvent) => {
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;
      if (t.tagName !== 'INPUT' && t.tagName !== 'TEXTAREA' && t.tagName !== 'SELECT') {
        return;
      }
      // After keyboard animates, keep the focused field above sticky footers
      // and leave room for labels (block: 'center' can clip tops on short screens).
      window.setTimeout(() => {
        t.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }, 280);
    };

    sync();
    vv?.addEventListener('resize', sync);
    vv?.addEventListener('scroll', sync);
    window.addEventListener('resize', sync);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      vv?.removeEventListener('resize', sync);
      vv?.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
      document.removeEventListener('focusin', onFocusIn);
    };
  }, []);

  return (
    <div className="w-full max-w-none min-w-0 flex flex-col overflow-hidden ui-app-bg h-[var(--app-height,100%)]">
      {children}
    </div>
  );
}
