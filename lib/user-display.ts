export function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || '??';
}

export function avatarColorFromId(id: string) {
  const palette = ['#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#3b82f6', '#737373'];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length]!;
}

export function formatRelativeTime(date: Date) {
  const diff = Date.now() - date.getTime();
  const seconds = Math.max(0, Math.floor(diff / 1000));
  if (seconds < 60) return `${seconds} sec`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} d`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function formatMessageTime(date: Date) {
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
