'use client';

import { useEffect, useState } from 'react';

export function OfflineBanner(): React.JSX.Element | null {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    function handleOffline() {
      setIsOffline(true);
    }
    function handleOnline() {
      setIsOffline(false);
    }
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    setIsOffline(!navigator.onLine);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <div
      role="alert"
      style={{
        padding: '12px 16px',
        backgroundColor: 'var(--status-warning)',
        color: 'white',
        textAlign: 'center',
        fontSize: '14px',
        fontWeight: 500,
      }}
    >
      Mode offline — menampilkan data tersimpan. Beberapa fitur tidak tersedia.
    </div>
  );
}
