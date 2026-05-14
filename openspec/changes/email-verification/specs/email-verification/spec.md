## ADDED Requirements

### Requirement: Send verification code to email
The system SHALL provide a `POST /auth/send-code` endpoint that accepts an email address, generates a 6-digit numeric verification code, stores it in Redis with a 5-minute TTL, and sends it to the specified email via Alibaba Cloud DirectMail SMTP.

#### Scenario: Successful code send
- **WHEN** a user submits a valid `@smail.nju.edu.cn` email to `POST /auth/send-code`
- **THEN** the system generates a 6-digit code, stores `verify:{email}` in Redis with TTL 300s, sends the code via SMTP, and returns `{ message: "验证码已发送" }`

#### Scenario: Invalid email domain
- **WHEN** a user submits an email that does not end with `@smail.nju.edu.cn`
- **THEN** the system returns 400 with error message `仅支持南大 smail 邮箱注册`

#### Scenario: Resend within TTL
- **WHEN** a user requests a new code for the same email within the 5-minute TTL of a previous code
- **THEN** the system overwrites the existing code in Redis, resets TTL to 300s, and sends a new code

### Requirement: Verify code during registration
The system SHALL require a valid verification code to complete registration. The `POST /auth/register` endpoint SHALL accept a `code` parameter and verify it against the stored Redis value before creating the user.

#### Scenario: Successful registration with valid code
- **WHEN** a user submits `POST /auth/register` with a valid email, nickname, password, and the correct verification code
- **THEN** the system deletes the Redis key `verify:{email}`, creates the user, and returns a JWT token

#### Scenario: Invalid verification code
- **WHEN** a user submits a registration with an incorrect verification code
- **THEN** the system returns 400 with error message `验证码错误或已过期`

#### Scenario: Expired verification code
- **WHEN** a user submits a registration but the Redis key `verify:{email}` does not exist (TTL expired)
- **THEN** the system returns 400 with error message `验证码错误或已过期`

### Requirement: MailService module
The system SHALL provide a `MailService` registered as a global module that handles SMTP connections to Alibaba Cloud DirectMail and exposes a `sendVerificationCode(to, code)` method.

#### Scenario: SMTP connection uses environment variables
- **WHEN** the MailService initializes
- **THEN** it creates a nodemailer transporter using `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` environment variables

#### Scenario: Verification email content
- **WHEN** `sendVerificationCode(to, code)` is called
- **THEN** an email is sent from `SMTP_FROM` address to the recipient with subject `Violet 邮箱验证码` and body containing the 6-digit code

### Requirement: Frontend registration page with verification code step
The registration page SHALL include a verification code input field and a "send code" button. The user flow SHALL be: fill email → click send → receive code → fill code + other fields → submit registration.

#### Scenario: Send code button triggers API call
- **WHEN** user clicks the "发送验证码" button with a valid email filled
- **THEN** the frontend calls `POST /auth/send-code` and shows a countdown timer (60s) on the button

#### Scenario: Countdown timer prevents spam
- **WHEN** the send code button is in countdown state
- **THEN** the button is disabled and displays remaining seconds until it reaches 0

#### Scenario: Registration submits with code
- **WHEN** user fills all fields including verification code and clicks register
- **THEN** the frontend calls `POST /auth/register` with `{ email, nickname, password, code }`
