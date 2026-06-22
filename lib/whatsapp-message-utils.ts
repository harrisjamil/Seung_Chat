const SKIPPED_MESSAGE_TYPES = new Set([
  'notification',
  'gp2',
  'e2e_notification',
  'protocol',
  'group_notification',
  'ciphertext',
  'revoked',
]);

const TYPE_LABELS: Record<string, string> = {
  image: 'Photo',
  video: 'Video',
  audio: 'Audio',
  ptt: 'Voice message',
  document: 'Document',
  sticker: 'Sticker',
  location: 'Location',
  vcard: 'Contact',
  multi_vcard: 'Contacts',
  poll_creation: 'Poll',
  order: 'Order',
  product: 'Product',
  album: 'Album',
  call_log: 'Call',
};

type MessageLike = {
  body?: string;
  type?: string;
  hasMedia?: boolean;
  _data?: { filename?: string };
};

export function shouldShowWhatsAppMessage(type?: string): boolean {
  if (!type) return true;
  return !SKIPPED_MESSAGE_TYPES.has(type);
}

export function formatWhatsAppMessageBody(message: MessageLike): string {
  const body = typeof message.body === 'string' ? message.body.trim() : '';
  if (body) return body;

  if (message.type === 'document' && message._data?.filename) {
    return message._data.filename;
  }

  if (message.type && TYPE_LABELS[message.type]) {
    return TYPE_LABELS[message.type]!;
  }

  if (message.hasMedia) return 'Media';
  if (message.type) return `[${message.type}]`;
  return '';
}

export function formatWhatsAppListTime(timestamp: number | null): string {
  if (!timestamp) return '';

  const date = new Date(timestamp * 1000);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  if (date >= startOfToday) {
    return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }
  if (date >= startOfYesterday) return 'Yesterday';

  const weekAgo = new Date(startOfToday);
  weekAgo.setDate(weekAgo.getDate() - 6);
  if (date >= weekAgo) {
    return date.toLocaleDateString(undefined, { weekday: 'short' });
  }

  return date.toLocaleDateString(undefined, {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatWhatsAppMessageTime(timestamp: number | null): string {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
