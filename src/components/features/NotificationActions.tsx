'use client';

import { Button } from '@/components/ui/Button';

export function NotificationActions({ id }: { id: string }) {
  return (
    <div className="actions">
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
