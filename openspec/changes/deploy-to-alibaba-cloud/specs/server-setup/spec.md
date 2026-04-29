## ADDED Requirements

### Requirement: Node.js runtime installed
The server SHALL have Node.js >= 18 installed via NodeSource, with pnpm as package manager and pm2 as process manager.

#### Scenario: Node.js available after setup
- **WHEN** setup script completes
- **THEN** `node --version` returns >= 18, `pnpm --version` returns a valid version, and `pm2 --version` returns a valid version

### Requirement: PostgreSQL database running
The server SHALL have PostgreSQL installed and running, with a `violet` database and `violet` user with password authentication.

#### Scenario: Database accessible with connection string
- **WHEN** application connects to `postgresql://violet:<password>@localhost:5432/violet`
- **THEN** connection succeeds and Prisma migrations can be applied

### Requirement: Redis running
The server SHALL have Redis installed and running on default port 6379.

#### Scenario: Redis accepts connections
- **WHEN** application connects to `localhost:6379`
- **THEN** Redis responds to PING with PONG

### Requirement: Nginx installed and running
The server SHALL have Nginx installed and running, listening on port 80.

#### Scenario: Nginx responds on port 80
- **WHEN** HTTP request is sent to `http://121.43.69.144:80`
- **THEN** Nginx returns a response (even if it's the default page before configuration)

### Requirement: Alibaba Cloud security group allows HTTP
The security group `sg-bp17bw7623shtw5l49sr` SHALL have an inbound rule allowing TCP port 80 from 0.0.0.0/0.

#### Scenario: HTTP accessible from external network
- **WHEN** a browser outside the cloud network accesses `http://121.43.69.144`
- **THEN** the request reaches Nginx (not blocked by security group)
