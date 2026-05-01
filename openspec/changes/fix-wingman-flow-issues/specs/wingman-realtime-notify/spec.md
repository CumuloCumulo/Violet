## ADDED Requirements

### Requirement: WebSocket notification on wingman assignment
When a client approves a wingman application, the system SHALL emit a `wingmanAssigned` WebSocket event to the approving client so the chat UI updates without a page refresh.

#### Scenario: Client approves wingman, chat UI updates immediately
- **WHEN** client approves a wingman application for their relationship
- **THEN** the server emits `wingmanAssigned` event with `{ relationshipId, wingmanId, side, mode }` to the client's socket, and the client's chat page shows the private chat panel without manual refresh

#### Scenario: Wingman whose application was approved receives notification
- **WHEN** a wingman's application is approved
- **THEN** the wingman receives a `wingmanApproved` event with `{ relationshipId, side, mode }` so they can navigate to the chat room

### Requirement: Mode switch notification sent to private chat
When a wingman's intervention mode is switched, the system notification SHALL be sent as a PRIVATE message between the client and their wingman, not as a MAIN message visible to all room members.

#### Scenario: Client switches wingman to SOLO mode
- **WHEN** client switches their wingman's mode to SOLO
- **THEN** a system message is created with type `PRIVATE` and `targetUserId` set to the wingman's ID, visible only to the client and wingman pair

#### Scenario: Other client does not see mode switch notification
- **WHEN** client1 switches their wingman's mode
- **THEN** client2 does not receive any notification about the mode change

### Requirement: Flirting phase preserves chat history as read-only
When a relationship transitions to FLIRTING status, the chat room SHALL become read-only but remain accessible. Both clients SHALL be able to view all past messages. The room SHALL NOT be disconnected.

#### Scenario: Transition to flirting, messages still viewable
- **WHEN** a relationship transitions from ICEBREAKING to FLIRTING
- **THEN** both clients see a congratulatory overlay, but can dismiss it and continue viewing all chat history in read-only mode

#### Scenario: Sending messages in flirting phase blocked
- **WHEN** a user tries to send a message in a FLIRTING-phase room
- **THEN** the server rejects the message with a FORBIDDEN error (existing `canSendToRoom` check already handles this)
