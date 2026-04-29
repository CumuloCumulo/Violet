## ADDED Requirements

### Requirement: Nginx serves frontend static files
Nginx SHALL serve the React production build from `/home/violet/client/dist/`. All paths not matching `/api/` or `/socket.io/` SHALL fall back to `index.html` for SPA routing.

#### Scenario: Visiting root URL loads the app
- **WHEN** browser requests `http://121.43.69.144/`
- **THEN** Nginx returns `index.html` from `/home/violet/client/dist/`

#### Scenario: SPA client-side routing works
- **WHEN** browser requests `http://121.43.69.144/discovery` (a client-side route)
- **THEN** Nginx returns `index.html` (not 404) so React Router handles the route

### Requirement: Nginx proxies API requests to NestJS
Nginx SHALL reverse-proxy all requests matching `/api/*` to `http://localhost:3000`, forwarding the Host and X-Real-IP headers.

#### Scenario: API request forwarded correctly
- **WHEN** browser requests `http://121.43.69.144/api/discovery`
- **THEN** NestJS receives the request as if directly accessed, with correct client IP in X-Real-IP header

### Requirement: Nginx proxies WebSocket for Socket.io
Nginx SHALL reverse-proxy requests matching `/socket.io/*` to `http://localhost:3000` with HTTP/1.1 and WebSocket upgrade headers (Upgrade, Connection).

#### Scenario: WebSocket connection established through Nginx
- **WHEN** client opens a Socket.io connection to `http://121.43.69.144/socket.io/`
- **THEN** the connection is upgraded to WebSocket and bidirectional communication works

#### Scenario: Socket.io polling transport works
- **WHEN** client uses long-polling transport to `http://121.43.69.144/socket.io/`
- **THEN** HTTP requests are proxied to NestJS and responses are returned correctly
