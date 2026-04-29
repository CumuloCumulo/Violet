import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

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

    socket.on('roomJoined', (data: { relationshipId: string; messages: ChatMessage[]; role: string; wingmanMode1?: string | null; wingmanMode2?: string | null; wingmanId1?: string | null; wingmanId2?: string | null }) => {
      set((state) => ({
        activeRoom: data.relationshipId,
        myRole: data.role,
        messages: {
          ...state.messages,
          [data.relationshipId]: data.messages,
        },
        rooms: {
          ...state.rooms,
          [data.relationshipId]: {
            members: state.rooms[data.relationshipId]?.members ?? [],
            wingmanId1: data.wingmanId1 ?? null,
            wingmanId2: data.wingmanId2 ?? null,
            wingmanMode1: data.wingmanMode1 ?? null,
            wingmanMode2: data.wingmanMode2 ?? null,
          },
        },
      }));
    });

    socket.on('newMessage', (message: ChatMessage) => {
      set((state) => {
        const relId = message.relationshipId;
        const existing = state.messages[relId] ?? [];
        // If same ID exists, remove old and append at end (e.g. PENDING → MAIN after confirm)
        if (existing.some((m) => m.id === message.id)) {
          return {
            messages: {
              ...state.messages,
              [relId]: [...existing.filter((m) => m.id !== message.id), message],
            },
          };
        }
        return {
          messages: {
            ...state.messages,
            [relId]: [...existing, message],
          },
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
      set({ roomClosedReason: data.reason });
      if (get().activeRoom === data.relationshipId) {
        set({ activeRoom: null, myRole: null });
      }
    });

    set({ socket, userId });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
    }
    set({ socket: null, connected: false, activeRoom: null, myRole: null });
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
