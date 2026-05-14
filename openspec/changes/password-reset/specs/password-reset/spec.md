## ADDED Requirements

### Requirement: Reset password with verification code
The system SHALL provide a `POST /auth/reset-password` endpoint that accepts an email, verification code, and new password. It SHALL verify the code against Redis, find the user by email, update the password hash, and delete the verification code key.

#### Scenario: Successful password reset
- **WHEN** a user submits `POST /auth/reset-password` with a valid email, correct verification code, and a new password (>= 6 characters)
- **THEN** the system verifies the code, updates the user's password hash, deletes `verify:{email}` from Redis, and returns `{ message: "密码重置成功" }`

#### Scenario: Invalid verification code
- **WHEN** a user submits a reset with an incorrect or expired verification code
- **THEN** the system returns 400 with error `验证码错误或已过期`

#### Scenario: Unregistered email
- **WHEN** a user submits a reset for an email that is not registered
- **THEN** the system returns 404 with error `该邮箱未注册`

#### Scenario: Password too short
- **WHEN** a user submits a new password shorter than 6 characters
- **THEN** the system returns 400 with error `密码至少 6 位`

### Requirement: Reset password page
The system SHALL provide a `/reset-password` page where users can enter their email, request a verification code, and set a new password.

#### Scenario: Complete reset flow
- **WHEN** user navigates to `/reset-password` from the login page "忘记密码" link
- **THEN** the page shows email input (with auto suffix), send code button, verification code input, new password input, and submit button

### Requirement: Email input auto suffix
Login and registration pages SHALL display the `@smail.nju.edu.cn` suffix automatically. Users only need to type the student ID part.

#### Scenario: Auto suffix on register page
- **WHEN** user types their student ID in the email field on the register page
- **THEN** the `@smail.nju.edu.cn` suffix is displayed next to the input and automatically appended when submitting

#### Scenario: Auto suffix on login page
- **WHEN** user types their student ID in the email field on the login page
- **THEN** the `@smail.nju.edu.cn` suffix is displayed next to the input and automatically appended when submitting
