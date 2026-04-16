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
    <div className="flex items-center gap-1.5">
      <div className="flex -space-x-1.5">
        {members.slice(0, 4).map((member) => (
          <div
            key={member.userId}
            className="relative w-6 h-6 rounded-full bg-gray-300 ring-2 ring-white"
            title={`${member.nickname ?? member.userId} - ${member.online ? '在线' : '离线'}`}
          >
            <span className="text-[9px] font-medium text-white flex items-center justify-center h-full">
              {(member.nickname ?? '?')[0]}
            </span>
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-1.5 ring-white ${
                member.online ? 'bg-online' : 'bg-offline'
              }`}
            />
          </div>
        ))}
      </div>
      <span className="text-[11px] text-msg-system tabular-nums">
        {onlineCount}人在线
      </span>
    </div>
  );
}
