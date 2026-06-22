import 'server-only';
import os from 'os';
import path from 'path';
import {
  formatWhatsAppMessageBody,
  shouldShowWhatsAppMessage,
} from '@/lib/whatsapp-message-utils';

type BridgeStatus =
  | 'idle'
  | 'initializing'
  | 'qr'
  | 'authenticated'
  | 'ready'
  | 'auth_failure'
  | 'disconnected'
  | 'error';

type BridgeChat = {
  id: string;
  name: string;
  unreadCount: number;
  timestamp: number | null;
  lastMessage: string;
  isGroup: boolean;
  isChannel: boolean;
  isCommunity: boolean;
  pinned: boolean;
  archived: boolean;
  lastMessageFromMe: boolean;
  profilePicUrl: string | null;
};

type BridgeMessage = {
  id: string;
  fromMe: boolean;
  body: string;
  timestamp: number | null;
  author: string | null;
  authorName: string | null;
  authorProfilePicUrl: string | null;
  type: string;
};

type BridgeState = {
  status: BridgeStatus;
  qr: string | null;
  lastError: string | null;
  initialized: boolean;
};

declare global {
  // eslint-disable-next-line no-var
  var __seungWhatsappBridge:
    | {
        state: BridgeState;
        initPromise: Promise<void> | null;
        client: any;
        chatsInFlight: Promise<BridgeChat[]> | null;
        lastChats: BridgeChat[];
        lastChatsAt: number;
        profilePicCache: Map<string, string | null>;
      }
    | undefined;
}

const bridge =
  global.__seungWhatsappBridge ??
  (global.__seungWhatsappBridge = {
    state: {
      status: 'idle',
      qr: null,
      lastError: null,
      initialized: false,
    } as BridgeState,
    initPromise: null as Promise<void> | null,
    client: null as any,
    chatsInFlight: null as Promise<BridgeChat[]> | null,
    lastChats: [] as BridgeChat[],
    lastChatsAt: 0,
    profilePicCache: new Map<string, string | null>(),
  });

function ensureBridgeFields() {
  if (!Array.isArray(bridge.lastChats)) bridge.lastChats = [];
  if (typeof bridge.lastChatsAt !== 'number') bridge.lastChatsAt = 0;
  if (bridge.chatsInFlight === undefined) bridge.chatsInFlight = null;
  if (!(bridge.profilePicCache instanceof Map)) bridge.profilePicCache = new Map();
}

async function getProfilePicUrlCached(contactId: string): Promise<string | null> {
  if (bridge.profilePicCache.has(contactId)) {
    return bridge.profilePicCache.get(contactId) ?? null;
  }
  try {
    const url = await bridge.client.getProfilePicUrl(contactId);
    const value = url || null;
    bridge.profilePicCache.set(contactId, value);
    return value;
  } catch {
    bridge.profilePicCache.set(contactId, null);
    return null;
  }
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) return [];
  const results = new Array<R>(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const current = index++;
      results[current] = await mapper(items[current]!);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

function getSelfContactId(): string | null {
  const wid = bridge.client?.info?.wid;
  if (!wid) return null;
  return typeof wid === 'string' ? wid : (wid._serialized as string | undefined) ?? null;
}

function mapChatEntry(chat: any): BridgeChat {
  const lastMessage = chat.lastMessage;
  const previewBody = lastMessage ? formatWhatsAppMessageBody(lastMessage) : '';
  const parentGroupId =
    chat.groupMetadata?.parentGroupId?._serialized ??
    (typeof chat.groupMetadata?.parentGroupId === 'string'
      ? chat.groupMetadata.parentGroupId
      : null);

  return {
    id: chat.id._serialized as string,
    name: chat.name || chat.formattedTitle || 'Unknown',
    unreadCount: Number(chat.unreadCount ?? 0),
    timestamp: typeof chat.timestamp === 'number' ? chat.timestamp : null,
    lastMessage: previewBody,
    isGroup: Boolean(chat.isGroup),
    isChannel: Boolean(chat.isChannel),
    isCommunity: Boolean(parentGroupId),
    pinned: Boolean(chat.pinned),
    archived: Boolean(chat.archived),
    lastMessageFromMe: Boolean(lastMessage?.fromMe),
    profilePicUrl: null,
  };
}

async function attachChatProfilePics(chats: BridgeChat[]): Promise<BridgeChat[]> {
  return mapPool(chats, 8, async (chat) => {
    const profilePicUrl = await getProfilePicUrlCached(chat.id);
    return { ...chat, profilePicUrl };
  });
}

type AuthorInfo = { name: string; profilePicUrl: string | null };

async function resolveAuthors(authorIds: string[]): Promise<Map<string, AuthorInfo>> {
  const cache = new Map<string, AuthorInfo>();
  const unique = [...new Set(authorIds.filter(Boolean))];

  await mapPool(unique, 8, async (authorId) => {
    try {
      const [contact, profilePicUrl] = await Promise.all([
        bridge.client.getContactById(authorId),
        getProfilePicUrlCached(authorId),
      ]);
      const name =
        contact?.pushname ||
        contact?.name ||
        contact?.verifiedName ||
        authorId.split('@')[0] ||
        'Member';
      cache.set(authorId, { name, profilePicUrl });
    } catch {
      const profilePicUrl = await getProfilePicUrlCached(authorId).catch(() => null);
      cache.set(authorId, {
        name: authorId.split('@')[0] || 'Member',
        profilePicUrl,
      });
    }
  });

  return cache;
}

export function getWhatsAppStatus() {
  ensureBridgeFields();
  const qrImageUrl = bridge.state.qr
    ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(bridge.state.qr)}`
    : null;
  return { ...bridge.state, qrImageUrl };
}

export async function ensureWhatsAppInitialized() {
  ensureBridgeFields();
  if (bridge.state.initialized) return;
  if (bridge.initPromise) {
    await bridge.initPromise;
    return;
  }

  bridge.initPromise = (async () => {
    bridge.state.status = 'initializing';
    try {
      const { Client, LocalAuth } = await import('whatsapp-web.js');
      const defaultChromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
      const authDataPath =
        process.env.WWEBJS_AUTH_PATH || path.join(os.homedir(), '.seung-chat', 'wwebjs_auth');
      const client = new Client({
        authStrategy: new LocalAuth({
          clientId: 'seung-chat-web',
          dataPath: authDataPath,
        }),
        puppeteer: {
          headless: true,
          executablePath: process.env.CHROME_PATH || defaultChromePath,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
      });

      client.on('qr', (qr: string) => {
        bridge.state.status = 'qr';
        bridge.state.qr = qr;
      });
      client.on('authenticated', () => {
        bridge.state.status = 'authenticated';
      });
      client.on('ready', () => {
        bridge.state.status = 'ready';
        bridge.state.qr = null;
      });
      client.on('auth_failure', (msg: string) => {
        bridge.state.status = 'auth_failure';
        bridge.state.lastError = msg;
      });
      client.on('disconnected', (reason: string) => {
        bridge.state.status = 'disconnected';
        bridge.state.lastError = reason;
        bridge.state.initialized = false;
      });

      await client.initialize();
      bridge.client = client;
      bridge.state.initialized = true;
    } catch (error) {
      bridge.state.status = 'error';
      bridge.state.lastError = error instanceof Error ? error.message : 'Unknown WhatsApp error';
    }
  })();

  await bridge.initPromise;
}

export async function getWhatsAppChats(limit = 120): Promise<BridgeChat[]> {
  ensureBridgeFields();
  await ensureWhatsAppInitialized();
  if (!bridge.client || bridge.state.status !== 'ready') return [];
  const now = Date.now();
  const cachedFreshForMs = 15000;
  if (bridge.lastChats.length > 0 && now - bridge.lastChatsAt < cachedFreshForMs) {
    return bridge.lastChats.slice(0, limit);
  }

  if (bridge.chatsInFlight) {
    const current = await bridge.chatsInFlight;
    return current.slice(0, limit);
  }

  bridge.chatsInFlight = (async () => {
    try {
      const timeoutMs = 60000;
      const fetchAll = async () => {
        const [chats, channels] = await Promise.all([
          bridge.client.getChats(),
          bridge.client.getChannels().catch(() => []),
        ]);
        const seen = new Set<string>();
        const merged: any[] = [];
        for (const chat of [...chats, ...channels]) {
          const id = chat?.id?._serialized;
          if (!id || seen.has(id)) continue;
          seen.add(id);
          merged.push(chat);
        }
        return merged;
      };

      const chats = await Promise.race([
        fetchAll(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('WhatsApp chats request timed out')), timeoutMs)
        ),
      ]);

      const mapped = await attachChatProfilePics(
        chats
          .filter((chat: any) => !chat.isStatus)
          .sort((a: any, b: any) => {
            if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
            return (b.timestamp ?? 0) - (a.timestamp ?? 0);
          })
          .slice(0, Math.max(limit, 120))
          .map(mapChatEntry)
      );

      bridge.lastChats = mapped;
      bridge.lastChatsAt = Date.now();
      bridge.state.lastError = null;
      return mapped;
    } catch (error) {
      bridge.state.lastError = error instanceof Error ? error.message : 'Failed to load chats';
      return bridge.lastChats;
    } finally {
      bridge.chatsInFlight = null;
    }
  })();

  const fresh = await bridge.chatsInFlight;
  return fresh.slice(0, limit);
}

export async function resetWhatsAppSession() {
  if (!bridge.client) return;
  await bridge.client.logout().catch(() => undefined);
  await bridge.client.destroy().catch(() => undefined);
  bridge.client = null;
  bridge.state = {
    status: 'idle',
    qr: null,
    lastError: null,
    initialized: false,
  };
  bridge.initPromise = null;
  bridge.chatsInFlight = null;
  bridge.lastChats = [];
  bridge.lastChatsAt = 0;
  bridge.profilePicCache = new Map();
}

export async function getWhatsAppMessages(chatId: string, limit = 60): Promise<BridgeMessage[]> {
  ensureBridgeFields();
  await ensureWhatsAppInitialized();
  if (!bridge.client || bridge.state.status !== 'ready') return [];

  try {
    const chat = await bridge.client.getChatById(chatId);
    if (!chat) return [];
    const messages = await chat.fetchMessages({ limit });
    const visible = messages.filter((msg: any) => shouldShowWhatsAppMessage(msg.type));

    const authorIds = visible
      .filter((msg: any) => !msg.fromMe && msg.author)
      .map((msg: any) => msg.author as string);
    const authors = chat.isGroup ? await resolveAuthors(authorIds) : new Map<string, AuthorInfo>();

    const selfContactId = getSelfContactId();
    const [selfProfilePicUrl, chatProfilePicUrl] = await Promise.all([
      selfContactId ? getProfilePicUrlCached(selfContactId) : Promise.resolve(null),
      getProfilePicUrlCached(chatId),
    ]);

    return visible
      .map((msg: any) => {
        const authorId = typeof msg.author === 'string' ? msg.author : null;
        const authorInfo = authorId ? authors.get(authorId) : undefined;
        let authorProfilePicUrl: string | null = null;

        if (msg.fromMe) {
          authorProfilePicUrl = selfProfilePicUrl;
        } else if (authorId && authorInfo?.profilePicUrl) {
          authorProfilePicUrl = authorInfo.profilePicUrl;
        } else if (!chat.isGroup) {
          authorProfilePicUrl = chatProfilePicUrl;
        } else if (authorId) {
          authorProfilePicUrl = authorInfo?.profilePicUrl ?? null;
        }

        return {
          id: String(msg.id?._serialized ?? `${msg.timestamp ?? Date.now()}-${Math.random()}`),
          fromMe: Boolean(msg.fromMe),
          body: formatWhatsAppMessageBody(msg),
          timestamp: typeof msg.timestamp === 'number' ? msg.timestamp : null,
          author: authorId,
          authorName: authorId ? authorInfo?.name ?? null : msg.fromMe ? 'You' : null,
          authorProfilePicUrl,
          type: msg.type ?? 'chat',
        };
      })
      .filter((msg: BridgeMessage) => msg.body.length > 0)
      .sort((a: BridgeMessage, b: BridgeMessage) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
  } catch (error) {
    bridge.state.lastError = error instanceof Error ? error.message : 'Failed to load messages';
    return [];
  }
}

export async function sendWhatsAppMessage(chatId: string, body: string): Promise<boolean> {
  ensureBridgeFields();
  await ensureWhatsAppInitialized();
  if (!bridge.client || bridge.state.status !== 'ready') return false;
  const text = body.trim();
  if (!text) return false;

  try {
    const chat = await bridge.client.getChatById(chatId);
    if (!chat) return false;
    await chat.sendMessage(text);
    return true;
  } catch (error) {
    bridge.state.lastError = error instanceof Error ? error.message : 'Failed to send message';
    return false;
  }
}
