import { useEffect, useState, useCallback } from 'react';

interface PresenceMember {
  userId: string;
  nickname?: string;
  online: boolean;
  role?: string;
}

interface PresenceIndicatorProps {
  relationshipId: string;
}

export function PresenceIndicator({ relationshipId }: PresenceIndicatorProps) {
  const [members, setMembers] = useState<PresenceMember[]>([]);

  const fetchPresence = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat/${relationshipId}/presence`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members ?? []);
      }
    } catch {
      // ignore
    }
  }, [relationshipId]);

  useEffect(() => {
    fetchPresence();
    const interval = setInterval(fetchPresence, 15000);
    return () => clearInterval(interval);
  }, [fetchPresence]);

  const onlineCount = members.filter((m) => m.online).length;

  return (
    <div className="flex items-center gap-1.5" style={{ fontSize: 12, fontWeight: 400, color: '#7a829a' }}>
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{
          background: '#d4eda4',
          boxShadow: '0 0 8px #d4eda4',
        }}
      />
      {onlineCount > 0 ? `${onlineCount}人在线` : '连接中...'}
    </div>
  );
}
