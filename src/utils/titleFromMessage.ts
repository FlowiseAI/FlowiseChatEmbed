import type { MessageType } from '@/components/Bot';

const MAX_TITLE_LEN = 40;

export const titleFromMessage = (messages: MessageType[]): string | null => {
  const firstUser = messages.find((m) => m.type === 'userMessage');
  if (!firstUser) return null;

  const stripped = firstUser.message
    .replace(/[`*_~#>[\]()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (stripped.length === 0) return null;

  if (stripped.length <= MAX_TITLE_LEN) return stripped;
  return stripped.slice(0, MAX_TITLE_LEN).trimEnd() + '…';
};
