## ADDED Requirements

### Requirement: User can edit WeChat ID and QQ number in profile
The system SHALL allow users to edit their WeChat ID (`wechat`) and QQ number (`qq`) in a dedicated "交换信息" collapsible section in the profile center. Changes SHALL be auto-saved with debounce.

#### Scenario: User enters WeChat ID
- **WHEN** user types in the WeChat ID input field
- **THEN** the system auto-saves after 800ms debounce via PATCH /user/profile with { wechat: value }

#### Scenario: User enters QQ number
- **WHEN** user types in the QQ number input field
- **THEN** the system auto-saves after 800ms debounce via PATCH /user/profile with { qq: value }

#### Scenario: Both fields empty
- **WHEN** user has not filled in either WeChat ID or QQ number
- **THEN** the system displays a warning "请至少填写一项，否则进入暧昧期时无法交换"

### Requirement: User can edit phone number in account security section
The system SHALL allow users to edit their phone number (`phone`) in the "账号安全" collapsible section. This field is private and SHALL NOT be exchanged during the flirting transition.

#### Scenario: User enters phone number
- **WHEN** user types in the phone number input field in account security section
- **THEN** the system auto-saves after 800ms debounce via PATCH /user/profile with { phone: value }

#### Scenario: Phone number not visible to others
- **WHEN** any public or anonymous profile view is requested
- **THEN** the phone number field is not included in the response

### Requirement: Phone field in database
The system SHALL have a `phone String?` field on the User model in Prisma schema.

#### Scenario: Migration applied
- **WHEN** the database migration is executed
- **THEN** the User table has a nullable `phone` column of type TEXT

### Requirement: Backend accepts wechat, qq, phone in profile update
The `PATCH /user/profile` endpoint SHALL accept `wechat`, `qq`, and `phone` as optional string fields in the request body.

#### Scenario: Update wechat via profile API
- **WHEN** client sends PATCH /user/profile with { wechat: "wx_test123" }
- **THEN** the user's wechat field is updated and the updated user (without password) is returned

#### Scenario: Update phone via profile API
- **WHEN** client sends PATCH /user/profile with { phone: "13800138000" }
- **THEN** the user's phone field is updated and the updated user (without password) is returned

### Requirement: Contact fields hidden from public views
The fields `wechat`, `qq`, and `phone` SHALL NOT appear in getPublicProfile, getAnonymousProfile, or DiscoveryService.listUsers responses.

#### Scenario: Public profile does not expose contacts
- **WHEN** GET /user/:id is called
- **THEN** response contains only id, nickname, avatar — no wechat/qq/phone

#### Scenario: Discovery listing does not expose contacts
- **WHEN** GET /discovery/users is called
- **THEN** no user object in the response contains wechat/qq/phone fields

### Requirement: Automatic contact exchange on flirting transition
When relationship status transitions from ICEBREAKING to FLIRTING, the system SHALL automatically exchange the WeChat ID and QQ number of both parties.

#### Scenario: Both users have contact info filled
- **WHEN** relationship transitions to FLIRTING and both users have wechat/qq set
- **THEN** the system queries both users' wechat and qq, creates a system message containing both parties' contact info, and emits a `contactExchange` socket event to both users with structured data

#### Scenario: One user has missing contact info
- **WHEN** relationship transitions to FLIRTING and user A has wechat set but user B does not
- **THEN** the system message and socket event show user A's wechat and display "对方未设置" for user B's missing fields

#### Scenario: System message content format
- **WHEN** contact exchange system message is created
- **THEN** the message content includes lines like "🎉 联系方式已交换" followed by each party's wechat and qq values

### Requirement: Frontend displays exchanged contacts in flirting overlay
When the flirting transition occurs, the frontend SHALL display the other party's WeChat ID and QQ number in the existing flirting overlay, with copy-to-clipboard buttons.

#### Scenario: User sees exchanged contacts
- **WHEN** the flirting overlay appears after status transition
- **THEN** the overlay shows the other party's wechat and qq (or "对方未设置" if empty) with copy buttons

#### Scenario: User copies contact to clipboard
- **WHEN** user clicks the copy button next to a contact field
- **THEN** the value is copied to clipboard and a brief "已复制" toast is shown

### Requirement: AuthUser type includes new fields
The frontend AuthUser interface SHALL include `wechat: string | null`, `qq: string | null`, and `phone: string | null`.

#### Scenario: Profile data includes new fields
- **WHEN** user fetches their profile via /auth/me or /user/profile
- **THEN** the response includes wechat, qq, and phone fields
