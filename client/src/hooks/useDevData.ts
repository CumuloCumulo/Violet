import { useEffect, useState } from 'react';

export interface DevUser {
  id: string;
  nickname: string;
  gender: string | null;
  campus: string | null;
  roles: string[];
}

export interface DevAssignment {
  userId: string;
  nickname: string;
  side: number;
  mode: string;
}

export interface DevRelationship {
  id: string;
  status: string;
  user1: { id: string; nickname: string };
  user2: { id: string; nickname: string };
  assignments: DevAssignment[];
}

export function useDevData() {
  const [users, setUsers] = useState<DevUser[]>([]);
  const [relationships, setRelationships] = useState<DevRelationship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [usersRes, relRes] = await Promise.all([
          fetch('/api/dev/users'),
          fetch('/api/dev/relationships'),
        ]);
        if (usersRes.ok) setUsers(await usersRes.json());
        if (relRes.ok) setRelationships(await relRes.json());
      } catch {
        // ignore in dev
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  return { users, relationships, loading };
}
