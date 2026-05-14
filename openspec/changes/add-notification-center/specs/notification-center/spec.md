## ADDED Requirements

### Requirement: Notification data model
The system SHALL persist notifications in a `Notification` database table with fields: `id` (cuid), `userId` (recipient), `type` (string enum), `title` (string), `content` (optional string), `data` (optional JSON for related entity IDs), `read` (boolean, default false), `createdAt` (timestamp). The table SHALL have an index on `[userId, createdAt]` for efficient querying.

#### Scenario: Notification record created on match request
- **WHEN** user A sends a match request to user B
- **THEN** a Notification record is created with userId=B, type="MATCH_REQUEST_RECEIVED", title containing sender's nickname, and data containing {matchRequestId, fromUserId}

#### Scenario: Notification record created on match accept
- **WHEN** user B accepts a match request from user A
- **THEN** a Notification record is created with userId=A, type="MATCH_REQUEST_ACCEPTED", and data containing {relationshipId}

#### Scenario: Notification record created on match reject
- **WHEN** user B rejects a match request from user A
- **THEN** a Notification record is created with userId=A, type="MATCH_REQUEST_REJECTED"

### Requirement: Wingman notification creation
The system SHALL create notifications for wingman-related events: application submitted (notify client), application approved (notify wingman), application rejected (notify wingman).

#### Scenario: Wingman applies for task
- **WHEN** a wingman applies for a wingman task
- **THEN** a Notification record is created with userId=clientId, type="WINGMAN_APPLIED", data containing {taskId, wingmanId, wingmanNickname}

#### Scenario: Wingman application approved
- **WHEN** a client approves a wingman's application
- **THEN** a Notification record is created with userId=wingmanId, type="WINGMAN_APPROVED", data containing {relationshipId}

#### Scenario: Wingman application rejected
- **WHEN** a client rejects a wingman's application
- **THEN** a Notification record is created with userId=wingmanId, type="WINGMAN_REJECTED"

### Requirement: Relationship lifecycle notification creation
The system SHALL create notifications when a relationship status transitions to ICEBREAKING, FLIRTING, or ENDED, notifying both client users.

#### Scenario: Relationship enters icebreaking phase
- **WHEN** a match request is accepted and relationship transitions to ICEBREAKING
- **THEN** Notification records are created for both client1Id and client2Id with type="RELATIONSHIP_ICEBREAKING", data containing {relationshipId, otherUserNickname}

#### Scenario: Relationship enters flirting phase
- **WHEN** relationship transitions to FLIRTING
- **THEN** Notification records are created for both clients with type="RELATIONSHIP_FLIRTING", data containing {relationshipId}

#### Scenario: Relationship ends
- **WHEN** relationship transitions to ENDED
- **THEN** Notification records are created for both clients with type="RELATIONSHIP_ENDED"

### Requirement: Notification REST API
The system SHALL expose `GET /notifications` endpoint returning paginated notifications for the authenticated user (via x-user-id header), ordered by createdAt descending. The system SHALL expose `PUT /notifications/:id/read` to mark a single notification as read, and `PUT /notifications/read-all` to mark all as read.

#### Scenario: Fetch notifications
- **WHEN** authenticated user calls GET /notifications with optional `?cursor=xxx&limit=20`
- **THEN** system returns {notifications: Notification[], hasMore: boolean} for that user, newest first

#### Scenario: Mark notification as read
- **WHEN** user calls PUT /notifications/:id/read
- **THEN** the notification's `read` field is set to true

#### Scenario: Mark all as read
- **WHEN** user calls PUT /notifications/read-all
- **THEN** all unread notifications for that user are marked as read

#### Scenario: Unread count endpoint
- **WHEN** user calls GET /notifications/unread-count
- **THEN** system returns {count: number} of unread notifications

### Requirement: WebSocket notification push
The system SHALL push new notifications via WebSocket `notification` event immediately after creation. If the target user is online (has active socket connection), the event SHALL be delivered in real-time.

#### Scenario: Real-time notification delivery
- **WHEN** a notification is created for a user who has an active WebSocket connection
- **THEN** the server emits a `notification` event to that user's socket with the full notification payload

#### Scenario: Offline user receives notifications on reconnect
- **WHEN** a user comes online and opens the notification page
- **THEN** the GET /notifications endpoint returns all notifications including those created while offline

### Requirement: Notification center page
The frontend SHALL provide a `/notifications` route displaying a scrollable list of notifications grouped by date (今天、昨天、更早). Each notification item SHALL display an icon based on type, title text, relative time, and read/unread visual state. Unread notifications SHALL have a distinct visual treatment (e.g., dot indicator or background highlight).

#### Scenario: View notification list
- **WHEN** user navigates to /notifications
- **THEN** system fetches and displays all notifications grouped by date, with unread items visually distinguished

#### Scenario: Click notification to navigate
- **WHEN** user clicks a notification item
- **THEN** system marks it as read and navigates to the relevant page (e.g., /chat/:relationshipId for relationship notifications)

#### Scenario: Mark all as read
- **WHEN** user clicks "全部已读" button
- **THEN** all notifications are marked as read via API call, and the UI updates accordingly

### Requirement: Navigation bar notification entry
The DiscoveryPage top navigation bar SHALL include a "消息" button in the right section, with a badge showing the unread notification count. The badge SHALL be hidden when count is zero.

#### Scenario: Notification badge in nav bar
- **WHEN** user has unread notifications
- **THEN** the "消息" button in the navigation bar displays a badge with the unread count

#### Scenario: Zero unread notifications
- **WHEN** user has no unread notifications
- **THEN** the "消息" button displays without a badge

#### Scenario: Badge updates in real-time
- **WHEN** a new notification is pushed via WebSocket while user is on any page
- **THEN** the badge count increments immediately

### Requirement: Notification frontend state management
The frontend SHALL use a dedicated Zustand store (`notificationStore`) to manage notification list, unread count, and WebSocket event handling. The store SHALL integrate with the existing chatStore's WebSocket connection for receiving `notification` events.

#### Scenario: Store initializes with unread count
- **WHEN** the app loads and WebSocket connects
- **THEN** notificationStore fetches the unread count via GET /notifications/unread-count

#### Scenario: Store handles real-time notification
- **WHEN** a `notification` WebSocket event is received
- **THEN** notificationStore adds the notification to the list (if on notification page) and increments the unread count
