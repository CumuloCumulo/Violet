---
name: violet-deploy
description: Deploy or update Violet on the Alibaba Cloud ECS server. Supports full deploy, backend-only, frontend-only, and database-migration modes.
---

Deploy and update Violet on the production server.

**Input**: Optionally specify a mode. If omitted, auto-detect based on what changed (compare git diff against the deployed state), or ask the user.

## Server Context

| Item | Value |
|------|-------|
| Host | `121.43.69.144` |
| User | `root` |
| SSH | `ssh root@121.43.69.144` (password auth) |
| OS | Ubuntu 24.04 |
| Backend dir | `/home/violet/server/` |
| Frontend dir | `/home/violet/client/dist/` |
| Nginx config | `/etc/nginx/sites-available/violet` |
| pm2 process | `violet-api` |
| Entry point | `dist/src/main.js` (NOT `dist/main.js`) |

## Prisma CLI Path

The server uses pnpm with strict hoisting. The `prisma` binary is NOT in the global PATH. Use the full resolved path:

```bash
# First, find the exact path on the server:
PRISMA_BIN=$(find /home/violet/server/node_modules/.pnpm -path '*/prisma@*/node_modules/prisma/build/index.js' | head -1)

# Then use it:
node $PRISMA_BIN generate
node $PRISMA_BIN migrate deploy
```

Always resolve `PRISMA_BIN` at runtime rather than hardcoding the path (it includes version numbers that change on `pnpm install`).

## Modes

### `full` — Full update (both frontend and backend)

1. **Detect changes**: Run `git diff --name-only HEAD~1` (or against last deployed commit) to confirm both frontend and backend have changes. If only one side changed, suggest the appropriate single mode.

2. **Build locally**:
   ```bash
   cd <project-root>/server && pnpm build
   cd <project-root>/client && pnpm build
   ```

3. **Package and upload**:
   ```bash
   # Backend archive
   tar czf /tmp/violet-server.tar.gz -C <project-root>/server dist prisma package.json pnpm-lock.yaml
   scp /tmp/violet-server.tar.gz root@121.43.69.144:/home/violet/server/

   # Frontend archive
   tar czf /tmp/violet-client.tar.gz -C <project-root>/client dist
   scp /tmp/violet-client.tar.gz root@121.43.69.144:/home/violet/client/
   ```

4. **SSH and deploy**:
   ```bash
   ssh root@121.43.69.144
   cd /home/violet/server && tar xzf violet-server.tar.gz && rm violet-server.tar.gz
   pnpm install --prod
   PRISMA_BIN=$(find node_modules/.pnpm -path '*/prisma@*/node_modules/prisma/build/index.js' | head -1)
   node $PRISMA_BIN generate
   node $PRISMA_BIN migrate deploy
   pm2 restart violet-api
   cd /home/violet/client && tar xzf violet-client.tar.gz && rm violet-client.tar.gz
   ```

5. **Verify**: `curl -s -o /dev/null -w "%{http_code}" http://121.43.69.144/` and `http://121.43.69.144/api/` both return 200.

6. **Cleanup**: `rm /tmp/violet-server.tar.gz /tmp/violet-client.tar.gz`

### `backend` — Backend only

Same as `full` but only build/upload/deploy the server side. Skip frontend steps.

### `frontend` — Frontend only

Same as `full` but only build/upload the client side. Skip server steps. No restart needed — Nginx serves static files directly.

### `db` — Database migration only

No local build needed. SSH to server and run:
```bash
ssh root@121.43.69.144
cd /home/violet/server
PRISMA_BIN=$(find node_modules/.pnpm -path '*/prisma@*/node_modules/prisma/build/index.js' | head -1)
node $PRISMA_BIN migrate deploy
```

### `status` — Check server health

Run these checks and report results:
```bash
ssh root@121.43.69.144 "pm2 status && curl -s -o /dev/null -w 'Frontend: %{http_code}\n' http://localhost/ && curl -s -o /dev/null -w 'API: %{http_code}\n' http://localhost/api/ && redis-cli ping && psql -U violet -d violet -h localhost -c 'SELECT 1' -t && df -h /"
```

### `rollback` — Emergency rollback

If the new deployment is broken:
```bash
ssh root@121.43.69.144 "pm2 restart violet-api --update-env"
# If still broken, check logs:
ssh root@121.43.69.144 "pm2 logs violet-api --lines 30 --nostream"
```

For frontend rollback, restore the previous `dist/` from backup or re-upload from a known-good commit.

### `logs` — View server logs

```bash
ssh root@121.43.69.144 "pm2 logs violet-api --lines 50 --nostream"
```

## Auto-Detection Logic

If no mode is specified:

1. Check `git status` and `git diff --name-only` to see what changed
2. If only `client/` files changed → suggest `frontend`
3. If only `server/` files changed → suggest `backend`
4. If `server/prisma/` changed → note that `db` migration will be needed
5. If both changed → suggest `full`
6. If nothing changed → suggest `status` to check current state

## SSH Handling

SSH uses password authentication. The tool cannot input passwords interactively through `ssh` directly. Use one of these approaches:

- **expect script**: Create a temporary expect script for automated password entry
- **User manual SSH**: If automated SSH fails, output the exact commands for the user to run manually

Example expect helper (create at `/tmp/violet-ssh.exp`):
```expect
#!/usr/bin/expect -f
set timeout 30
set cmd [lindex $argv 0]
spawn ssh -o StrictHostKeyChecking=no root@121.43.69.144 $cmd
expect "password:" { send "$env(VIOLET_SSH_PASS)\r"; exp_continue }
expect eof
```

## Guardrails

- **Never modify `.env` without user confirmation** — it contains secrets
- **Never run `prisma migrate reset`** on production — it drops all data
- **Always build locally** before uploading — don't install dev dependencies on server
- **Always verify** after deployment (HTTP 200 checks)
- **Show the user what will happen** before executing SSH commands
- **If a step fails, stop and report** — don't continue with partial deployment
- **Don't commit the deploy scripts** to git (they're temporary)
- **Clean up** temporary tar files after deployment
