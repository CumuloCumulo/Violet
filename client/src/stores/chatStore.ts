import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { useNotificationStore, type NotificationItem } from './notificationStore';

export interface ChatMessage {
  id: string;
  relationshipId: string;
  senderId: string;
  content: string;
  type: 'MAIN' | 'PRIVATE' | 'PENDING' | 'SYSTEM';
  targetUserId: string | null;
  isSystem: boolean;
  requireConfirm: boolean;
  confirmed: boolean;
  createdAt: string;
  sender?: {
    id: string;
    nickname: string;
    avatar: string | null;
  };
  displaySenderId?: string;
}

export interface RoomMember {
  userId: string;
  role: 'client1' | 'client2' | 'wingman1' | 'wingman2';
  online: boolean;
}

interface RoomState {
  members: RoomMember[];
  client1Id: string | null;
  client2Id: string | null;
  wingmanId1: string | null;
  wingmanId2: string | null;
  wingmanMode1: string | null;
  wingmanMode2: string | null;
}

interface ChatState {
  socket: Socket | null;
  connected: boolean;
  activeRoom: string | null;
  myRole: string | null;
  rooms: Record<string, RoomState>;
  messages: Record<string, ChatMessage[]>;
  userId: string | null;
  roomClosedReason: string | null;
  roomClosedRelId: string | null;
  /** Server marked this room as read-only when joining (e.g. FLIRTING) */
  isReadOnly: boolean;
  flirtingProposal: { relationshipId: string; fromUserId: string } | null;
  /** Contact info received when entering FLIRTING phase */
  exchangedContact: { wechat: string | null; qq: string | null } | null;
  /** Unread message counts per relationship (for notification badges) */
  unreadCounts: Record<string, number>;
  /** Total unread count across all relationships */
  totalUnread: number;

  connect: (userId: string, url?: string) => void;
  disconnect: () => void;
  joinRoom: (relationshipId: string) => void;
  leaveRoom: (relationshipId: string) => void;
  sendMessage: (relationshipId: string, content: string, type?: string, targetUserId?: string) => void;
  draftMessage: (relationshipId: string, content: string) => void;
  confirmMessage: (messageId: string, relationshipId: string) => void;
  rejectMessage: (messageId: string, relationshipId: string) => void;
  forwardMessage: (relationshipId: string, originalMessageId: string, targetUserId: string) => void;
  switchMode: (relationshipId: string, wingmanId: string, mode: string) => void;
  proposeFlirting: (relationshipId: string) => void;
  transitionStatus: (relationshipId: string, newStatus: string) => void;
  clearFlirtingProposal: () => void;
  clearRoom: (relationshipId: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  socket: null,
  connected: false,
  activeRoom: null,
  myRole: null,
  rooms: {},
  messages: {},
  userId: null,
  roomClosedReason: null,
  roomClosedRelId: null,
  isReadOnly: false,
  flirtingProposal: null,
  exchangedContact: null,
  unreadCounts: {},
  totalUnread: 0,

  connect: (userId: string, url: string = window.location.origin) => {
    const existingSocket = get().socket;
    if (existingSocket?.connected) return;

    const socket = io(url, {
      auth: { userId },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      set({ connected: true, userId });
    });

    socket.on('disconnect', () => {
      set({ connected: false });
    });

    socket.on('roomJoined', (data: { relationshipId: string; messages: ChatMessage[]; role: string; client1Id?: string | null; client2Id?: string | null; wingmanMode1?: string | null; wingmanMode2?: string | null; wingmanId1?: string | null; wingmanId2?: string | null; readOnly?: boolean }) => {
      set((state) => {
        const newCounts = { ...state.unreadCounts, [data.relationshipId]: 0 };
        return {
          activeRoom: data.relationshipId,
          myRole: data.role,
          isReadOnly: !!data.readOnly,
          roomClosedReason: null,
          roomClosedRelId: null,
          messages: {
            ...state.messages,
            [data.relationshipId]: data.messages,
          },
          rooms: {
            ...state.rooms,
            [data.relationshipId]: {
              members: state.rooms[data.relationshipId]?.members ?? [],
              client1Id: data.client1Id ?? null,
              client2Id: data.client2Id ?? null,
              wingmanId1: data.wingmanId1 ?? null,
              wingmanId2: data.wingmanId2 ?? null,
              wingmanMode1: data.wingmanMode1 ?? null,
              wingmanMode2: data.wingmanMode2 ?? null,
            },
          },
          unreadCounts: newCounts,
          totalUnread: Object.values(newCounts).reduce((sum, c) => sum + c, 0),
        };
      });
    });

    socket.on('newMessage', (message: ChatMessage) => {
      set((state) => {
        const relId = message.relationshipId;
        const existing = state.messages[relId] ?? [];
        // If same ID exists, remove old and append at end (e.g. PENDING → MAIN after confirm)
        const isDuplicate = existing.some((m) => m.id === message.id);
        const updatedMessages = isDuplicate
          ? [...existing.filter((m) => m.id !== message.id), message]
          : [...existing, message];

        // Increment unread if not in this room
        const notInRoom = state.activeRoom !== relId;
        const currentCount = state.unreadCounts[relId] ?? 0;
        const newUnread = notInRoom && !message.isSystem ? currentCount + 1 : currentCount;
        const newCounts = { ...state.unreadCounts, [relId]: newUnread };

        return {
          messages: { ...state.messages, [relId]: updatedMessages },
          unreadCounts: newCounts,
          totalUnread: Object.values(newCounts).reduce((sum, c) => sum + c, 0),
        };
      });
    });

    socket.on('messageConfirmed', (message: ChatMessage) => {
      set((state) => {
        const relId = message.relationshipId;
        const existing = state.messages[relId] ?? [];
        return {
          messages: {
            ...state.messages,
            [relId]: existing.map((m) =>
              m.id === message.id ? message : m,
            ),
          },
        };
      });
    });

    socket.on('messageRejected', ({ messageId }: { messageId: string }) => {
      set((state) => {
        const newMessages: Record<string, ChatMessage[]> = {};
        for (const [relId, msgs] of Object.entries(state.messages)) {
          newMessages[relId] = msgs.filter((m) => m.id !== messageId);
        }
        return { messages: newMessages };
      });
    });

    socket.on('userJoined', ({ userId: joinedUserId }: { userId: string }) => {
      // Could update member list - for now just log
      console.log(`User ${joinedUserId} joined`);
    });

    socket.on('userOffline', ({ userId: offlineUserId }: { userId: string }) => {
      console.log(`User ${offlineUserId} went offline`);
    });

    socket.on('modeSwitched', ({ wingmanId, mode }: { wingmanId: string; mode: string }) => {
      const activeRoom = get().activeRoom;
      if (!activeRoom) return;
      const room = get().rooms[activeRoom];
      if (!room) return;

      const updatedRoom = { ...room };
      if (wingmanId === room.wingmanId1) {
        updatedRoom.wingmanMode1 = mode;
      } else if (wingmanId === room.wingmanId2) {
        updatedRoom.wingmanMode2 = mode;
      }

      set((state) => ({
        rooms: {
          ...state.rooms,
          [activeRoom]: updatedRoom,
        },
      }));
    });

    socket.on('error', (error: { code: string; message: string }) => {
      console.error('Socket error:', error);
    });

    socket.on('roomClosed', (data: { relationshipId: string; reason: string; message: string }) => {
      set({ roomClosedReason: data.reason, roomClosedRelId: data.relationshipId });
      if (get().activeRoom === data.relationshipId) {
        set({ activeRoom: null, myRole: null });
      }
    });

    socket.on('proposeFlirting', (data: { relationshipId: string; fromUserId: string }) => {
      set({ flirtingProposal: { relationshipId: data.relationshipId, fromUserId: data.fromUserId } });
    });

    socket.on('proposeFlirtingSent', () => {
      // Confirmation that proposal was sent - handled by UI state
    });

    socket.on('wingmanAssigned', (data: { relationshipId: string; wingmanId: string; side: number; mode: string }) => {
      set((state) => {
        const room = state.rooms[data.relationshipId];
        if (!room) return state;

        const updatedRoom = { ...room };
        if (data.side === 1) {
          updatedRoom.wingmanId1 = data.wingmanId;
          updatedRoom.wingmanMode1 = data.mode;
        } else {
          updatedRoom.wingmanId2 = data.wingmanId;
          updatedRoom.wingmanMode2 = data.mode;
        }

        return {
          rooms: {
            ...state.rooms,
            [data.relationshipId]: updatedRoom,
          },
        };
      });
    });

    socket.on('wingmanApproved', (data: { relationshipId: string; side: number; mode: string }) => {
      // Wingman can now navigate to the chat room
      console.log(`Wingman approved for relationship ${data.relationshipId}, side ${data.side}, mode ${data.mode}`);
    });

    socket.on('roomReadOnly', (data: { relationshipId: string; reason: string; message: string }) => {
      set({ roomClosedReason: data.reason, roomClosedRelId: data.relationshipId });
    });

    socket.on('contactExchange', (data: { relationshipId: string; contactExchange: Record<string, { wechat: string | null; qq: string | null }> }) => {
      const myUserId = get().userId;
      if (myUserId && data.contactExchange[myUserId]) {
        set({ exchangedContact: data.contactExchange[myUserId] });
      }
    });

    socket.on('notification', (notification: NotificationItem) => {
      useNotificationStore.getState().handleIncomingNotification(notification);
    });

    set({ socket, userId });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
    }
    set({ socket: null, connected: false, activeRoom: null, myRole: null, isReadOnly: false });
  },

  joinRoom: (relationshipId: string) => {
    const { socket } = get();
    if (!socket) return;
    socket.emit('joinRoom', { relationshipId });
  },

  leaveRoom: (relationshipId: string) => {
    const { socket } = get();
    if (!socket) return;
    // Socket.io doesn't have a built-in leave event in our protocol
    // The server handles cleanup on disconnect
    if (get().activeRoom === relationshipId) {
      set({ activeRoom: null, myRole: null });
    }
  },

  sendMessage: (relationshipId: string, content: string, type: string = 'MAIN', targetUserId?: string) => {
    const { socket } = get();
    if (!socket) return;
    if (!content.trim()) return;
    socket.emit('sendMessage', { relationshipId, content: content.trim(), type, targetUserId });
  },

  draftMessage: (relationshipId: string, content: string) => {
    const { socket } = get();
    if (!socket) return;
    if (!content.trim()) return;
    socket.emit('draftMessage', { relationshipId, content: content.trim() });
  },

  confirmMessage: (messageId: string, relationshipId: string) => {
    const { socket } = get();
    if (!socket) return;
    socket.emit('confirmMessage', { messageId, relationshipId });
  },

  rejectMessage: (messageId: string, relationshipId: string) => {
    const { socket } = get();
    if (!socket) return;
    socket.emit('rejectMessage', { messageId, relationshipId });
  },

  forwardMessage: (relationshipId: string, originalMessageId: string, targetUserId: string) => {
    const { socket } = get();
    if (!socket) return;
    socket.emit('forwardMessage', { relationshipId, originalMessageId, targetUserId });
  },

  switchMode: (relationshipId: string, wingmanId: string, mode: string) => {
    const { socket } = get();
    if (!socket) return;
    socket.emit('switchMode', { relationshipId, wingmanId, mode });
  },

  proposeFlirting: (relationshipId: string) => {
    const { socket } = get();
    if (!socket) return;
    socket.emit('proposeFlirting', { relationshipId });
  },

  transitionStatus: (relationshipId: string, newStatus: string) => {
    const { socket } = get();
    if (!socket) return;
    socket.emit('transitionStatus', { relationshipId, newStatus });
  },

  clearFlirtingProposal: () => {
    set({ flirtingProposal: null });
  },

  clearRoom: (relationshipId: string) => {
    set((state) => {
      const { [relationshipId]: _, ...restMessages } = state.messages;
      const { [relationshipId]: __, ...restRooms } = state.rooms;
      return {
        messages: restMessages,
        rooms: restRooms,
        activeRoom: state.activeRoom === relationshipId ? null : state.activeRoom,
      };
    });
  },
}));
