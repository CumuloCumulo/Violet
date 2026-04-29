## ADDED Requirements

### Requirement: Socket.io client connects via relative path
The frontend chatStore SHALL connect to Socket.io using the same origin (no hardcoded port), relying on Nginx to proxy `/socket.io/` to the backend.

#### Scenario: Socket.io connects without specifying port
- **WHEN** user opens the chat page on `http://121.43.69.144`
- **THEN** Socket.io connects to `http://121.43.69.144/socket.io/` (same origin, no port) and establishes connection

### Requirement: WebSocket Gateway CORS configurable via environment variable
The ChatGateway CORS origin list SHALL be fully driven by the `CORS_ORIGIN` environment variable (comma-separated list). The localhost fallback values SHALL remain for development only.

#### Scenario: Production CORS includes server IP
- **WHEN** `CORS_ORIGIN=http://121.43.69.144` is set in the server environment
- **THEN** WebSocket connections from `http://121.43.69.144` are accepted

#### Scenario: Development CORS fallback works
- **WHEN** `CORS_ORIGIN` is not set
- **THEN** CORS defaults to `http://localhost:5173` and `http://localhost:3000`

### Requirement: Production .env file configured
The server SHALL have a `.env` file with all required production values: `DATABASE_URL`, `REDIS_HOST`, `REDIS_PORT`, `JWT_SECRET`, `CORS_ORIGIN`, and `PORT`.

#### Scenario: Application starts with production environment
- **WHEN** NestJS starts with the production `.env`
- **THEN** it connects to PostgreSQL, Redis, and accepts requests on the configured port

### Requirement: pm2 manages the NestJS process
The NestJS process SHALL be managed by pm2 with the name `violet-api`, auto-restarting on crash and surviving SSH disconnection.

#### Scenario: Process survives SSH disconnect
- **WHEN** SSH session to the server is closed
- **THEN** the `violet-api` process continues running and serving requests

#### Scenario: Process auto-restarts on crash
- **WHEN** the NestJS process crashes unexpectedly
- **THEN** pm2 automatically restarts it within seconds
