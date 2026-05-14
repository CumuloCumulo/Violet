import { useEffect, useState, useCallback } from 'react';

interface PresenceMember {
  userId: string;
  nickname?: string;
  online: boolean;
  role?: string;
}

interface PresenceIndicatorProps {
  relationshipId: string;
  userId: string;
}

export function PresenceIndicator({ relationshipId, userId }: PresenceIndicatorProps) {
  const [members, setMembers] = useState<PresenceMember[]>([]);

  const fetchPresence = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat/${relationshipId}/presence`, {
        headers: { 'x-user-id': userId },
      });
      if (res.ok) {
        const data = await res.json();
        setMembers(data.presence ?? data.members ?? []);
      }
    } catch {
      // ignore
    }
  }, [relationshipId, userId]);

  useEffect(() => {
    fetchPresence();
    const interval = setInterval(fetchPresence, 15000);
    return () => clearInterval(interval);
  }, [fetchPresence]);

  // Only show clients (not wingmen) in the online count
  const clientOnline = members.filter((m) => m.online && (!m.role || m.role === 'client1' || m.role === 'client2')).length;

  return (
    <div className="flex items-center gap-1.5" style={{ fontSize: 12, fontWeight: 400, color: '#7a829a' }}>
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{
          background: '#d4eda4',
          boxShadow: '0 0 8px #d4eda4',
        }}
      />
      {clientOnline > 0 ? `${clientOnline}人在线` : '连接中...'}
    </div>
  );
}
