import type { ChatAttachment, ChatReplyTarget } from '@/lib/chat-types';

const ATTACHMENT_PREFIX = '__SEUNG_ATTACHMENTS__:';

type EncodedPayload = {
  text: string;
  attachments: ChatAttachment[];
  replyTo: ChatReplyTarget | null;
};

function normalizeAttachment(input: Partial<ChatAttachment>): ChatAttachment | null {
  const name = String(input.name ?? '').trim();
  const type = String(input.type ?? '').trim();
  const dataUrl = String(input.dataUrl ?? '').trim();
  const size = Number(input.size ?? 0);

  if (!name || !dataUrl) return null;
  if (!Number.isFinite(size) || size < 0) return null;

  return {
    name,
    type: type || 'application/octet-stream',
    size,
    dataUrl,
  };
}

function normalizeReplyTarget(input: Partial<ChatReplyTarget> | null | undefined) {
  if (!input) return null;
  const id = String(input.id ?? '').trim();
  const senderName = String(input.senderName ?? '').trim();
  const text = String(input.text ?? '').trim();
  if (!id || !senderName || !text) return null;
  return { id, senderName, text: text.slice(0, 200) };
}

export function encodeMessagePayload(
  text: string,
  attachments: Partial<ChatAttachment>[] = [],
  replyTo?: Partial<ChatReplyTarget> | null
) {
  const normalized = attachments
    .map((attachment) => normalizeAttachment(attachment))
    .filter((attachment): attachment is ChatAttachment => Boolean(attachment));
  const normalizedReply = normalizeReplyTarget(replyTo);

  const cleanText = text.trim();
  if (normalized.length === 0 && !normalizedReply) {
    return cleanText;
  }

  const payload: EncodedPayload = {
    text: cleanText,
    attachments: normalized,
    replyTo: normalizedReply,
  };
  return `${ATTACHMENT_PREFIX}${JSON.stringify(payload)}`;
}

export function decodeMessagePayload(raw: string): EncodedPayload {
  if (!raw.startsWith(ATTACHMENT_PREFIX)) {
    return { text: raw, attachments: [], replyTo: null };
  }

  try {
    const parsed = JSON.parse(raw.slice(ATTACHMENT_PREFIX.length)) as Partial<EncodedPayload>;
    const text = String(parsed.text ?? '').trim();
    const attachments = Array.isArray(parsed.attachments)
      ? parsed.attachments
          .map((attachment) => normalizeAttachment(attachment))
          .filter((attachment): attachment is ChatAttachment => Boolean(attachment))
      : [];
    const replyTo = normalizeReplyTarget(parsed.replyTo);
    return { text, attachments, replyTo };
  } catch {
    return { text: raw, attachments: [], replyTo: null };
  }
}
