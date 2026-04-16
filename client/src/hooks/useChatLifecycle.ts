import { useEffect, useRef } from 'react';
import { useChatStore } from '../stores/chatStore';

/**
 * Manages the Socket.io connection lifecycle:
 * - Connects on mount with the given userId
 * - Reconnects and rejoins rooms on disconnect
 * - Leaves rooms on unmount (keeps socket alive for presence)
 */
export function useChatLifecycle(userId: string, url?: string) {
  const connect = useChatStore((s) => s.connect);
  const connected = useChatStore((s) => s.connected);
  const activeRoom = useChatStore((s) => s.activeRoom);
  const joinRoom = useChatStore((s) => s.joinRoom);
  const socket = useChatStore((s) => s.socket);
  const hasConnectedRef = useRef(false);

  // Initial connection
  useEffect(() => {
    if (userId && !hasConnectedRef.current) {
      connect(userId, url);
      hasConnectedRef.current = true;
    }
  }, [userId, url, connect]);

  // Rejoin room on reconnect
  useEffect(() => {
    if (!socket) return;

    const handleReconnect = () => {
      if (activeRoom) {
        joinRoom(activeRoom);
      }
    };

    socket.on('connect', handleReconnect);
    return () => {
      socket.off('connect', handleReconnect);
    };
  }, [socket, activeRoom, joinRoom]);

  return { connected };
}
