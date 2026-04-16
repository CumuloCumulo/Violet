export enum WingmanMode {
  SOLO = 'SOLO',
  PRIVATE = 'PRIVATE',
  ASSIST = 'ASSIST',
}

export enum MessageTypeDto {
  MAIN = 'MAIN',
  PRIVATE = 'PRIVATE',
  PENDING = 'PENDING',
  SYSTEM = 'SYSTEM',
}

export class JoinRoomDto {
  relationshipId: string;
  userId: string;
}

export class SendMessageDto {
  relationshipId: string;
  content: string;
  type: MessageTypeDto;
  targetUserId?: string;
}

export class DraftMessageDto {
  relationshipId: string;
  content: string;
}

export class ConfirmMessageDto {
  messageId: string;
  relationshipId: string;
}

export class SwitchModeDto {
  relationshipId: string;
  wingmanId: string;
  mode: WingmanMode;
}
