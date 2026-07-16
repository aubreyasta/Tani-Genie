'use client';

import { Button } from '@/components/ui/Button';

export function NotificationActions({ id }: { readonly id: string }): React.JSX.Element {
  return (
    <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
      <Button endpoint={`/api/notifications/${id}/read`} method="PATCH" variant="secondary">
        Tandai dibaca
      </Button>
      <Button
        endpoint={`/api/notifications/${id}/deliveries`}
        body={{ channel: 'whatsapp' }}
        variant="secondary"
      >
        Kirim WhatsApp
      </Button>
      <Button
        endpoint={`/api/notifications/${id}/deliveries`}
        body={{ channel: 'sms' }}
        variant="secondary"
      >
        Kirim SMS
      </Button>
      <Button
        endpoint={`/api/notifications/${id}/deliveries`}
        body={{ channel: 'sms', forceFail: true }}
        variant="danger"
      >
        Kirim SMS (Gagal)
      </Button>
    </div>
  );
}
