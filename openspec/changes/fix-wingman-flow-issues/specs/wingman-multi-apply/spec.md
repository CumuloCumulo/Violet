## ADDED Requirements

### Requirement: Multiple wingmen can apply for the same task
The system SHALL allow multiple wingmen to submit applications for the same OPEN wingman task simultaneously. Each task SHALL remain visible in the Wingman Hall until the owning client approves one applicant or cancels the task.

#### Scenario: First wingman applies, task remains OPEN
- **WHEN** wingman A applies for an OPEN task
- **THEN** a `WingmanApplication` record with status `PENDING` is created, the task status remains `OPEN`, and the task is still visible to other wingmen in the hall

#### Scenario: Second wingman applies after first
- **WHEN** wingman B applies for a task that already has wingman A's PENDING application
- **THEN** a second `WingmanApplication` record is created, the task status remains `OPEN`

#### Scenario: Duplicate application prevented
- **WHEN** a wingman tries to apply for a task they already applied to
- **THEN** the system rejects the application with a conflict error

### Requirement: Client sees only their own task applications
The system SHALL filter wingman task applications so that each client only sees tasks and applications for their own side. Client1 SHALL NOT see applications for client2's wingman tasks, and vice versa.

#### Scenario: Client1 views relationship tasks
- **WHEN** client1 calls `GET /wingman-task/by-relationship?relationshipId=X`
- **THEN** only tasks where `clientId === client1.id` are returned

#### Scenario: Client2 views same relationship tasks
- **WHEN** client2 calls `GET /wingman-task/by-relationship?relationshipId=X`
- **THEN** only tasks where `clientId === client2.id` are returned

### Requirement: Client selects one wingman from multiple applicants
The owning client SHALL be able to view all pending applications for their task and approve exactly one. Upon approval, all other pending applications for the same task SHALL be automatically rejected.

#### Scenario: Client approves one of multiple applicants
- **WHEN** client approves wingman A's application for a task that also has wingman B's PENDING application
- **THEN** wingman A's application status becomes APPROVED, a `WingmanAssignment` is created, wingman B's application status becomes REJECTED, and the task status becomes ASSIGNED

#### Scenario: Client rejects an applicant
- **WHEN** client rejects wingman A's application
- **THEN** wingman A's application status becomes REJECTED, the task remains OPEN with other PENDING applications still active

### Requirement: Wingman hall shows OPEN tasks only
The Wingman Hall page SHALL only display tasks with status `OPEN`. Tasks that have been assigned or cancelled SHALL NOT appear.

#### Scenario: Task with pending applications visible in hall
- **WHEN** a task has 3 PENDING applications but no approval yet
- **THEN** the task is still visible in the Wingman Hall as OPEN
