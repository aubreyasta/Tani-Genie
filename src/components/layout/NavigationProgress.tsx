'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export function NavigationProgress() {
  const pathname = usePathname();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!pathname) {
      return;
    }
    setPending(false);
  }, [pathname]);

  useEffect(() => {
    function startNavigation(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      const link = target.closest('a');
      if (!link || link.target === '_blank' || link.hasAttribute('download')) {
        return;
      }

      const destination = new URL(link.href, window.location.href);
      if (
        destination.origin !== window.location.origin ||
        `${destination.pathname}${destination.search}` ===
          `${window.location.pathname}${window.location.search}`
      ) {
        return;
      }
      setPending(true);
    }

    document.addEventListener('click', startNavigation, true);
    return () => document.removeEventListener('click', startNavigation, true);
  }, []);

  if (!pending) {
    return null;
  }

  return (
    <div className="navigation-transition" role="status" aria-live="polite">
      <div className="navigation-transition-card">
        <span className="navigation-transition-mark" aria-hidden="true">
          T
        </span>
        <div>
          <strong>Membuka halaman…</strong>
          <span>Menyiapkan data terbaru untukmu</span>
        </div>
        <span className="navigation-transition-spinner" aria-hidden="true" />
      </div>
      <div className="navigation-transition-bar" aria-hidden="true">
        <span />
      </div>
    </div>
  );
}
