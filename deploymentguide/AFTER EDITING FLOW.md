# After Editing Code — Rebuild & Push Workflow

Follow this workflow every time you edit the source code and want to apply the changes.

---

## Quick Version

```powershell
# 1. Rebuild containers with your changes
docker compose down
docker compose up -d --build

# 2. Test in browser
#    Main PC:   http://localhost
#    Other PCs: http://192.168.1.15

# 3. Push to GitHub
git add .
git commit -m "Fix: description of what you changed"
git push origin master:main
```

---

## Detailed Steps

### Step 1: Make Your Changes

Edit files in VS Code, then save (Ctrl + S).

### Step 2: Rebuild the Containers

What you changed determines what to rebuild:

| What you changed | Command |
|-----------------|---------|
| **Backend code** (server.js, middleware/, handlers/, schemas/, utils/) | `docker restart ocp_backend_api` |
| **Frontend code** (src/, public/) | `docker compose down; docker compose up -d --build` |
| **docker-compose.yml or Dockerfiles** | `docker compose down; docker compose up -d --build` |
| **whitelist.json only** | `docker restart ocp_backend_api` |
| **nginx.conf** | `docker restart ocp_nginx_proxy` |
| **Not sure / multiple files** | `docker compose down; docker compose up -d --build` |

> **Why frontend needs full rebuild:** The React app is compiled during `docker compose build`. A simple restart won't pick up source changes.

### Step 3: Verify Your Changes Work

1. Open `http://localhost` on the main PC
2. Test the specific feature you changed
3. Check the browser console (F12) for errors
4. If something is wrong, check logs:

```powershell
# Backend logs
docker compose logs backend --tail 30

# Frontend logs
docker compose logs frontend --tail 30

# All logs
docker compose logs --tail 30
```

### Step 4: Test from Another PC (if applicable)

On the other PC, open `http://192.168.1.15` and verify the change works there too.

### Step 5: Push to GitHub

```powershell
# See what changed
git status

# Stage your changes
git add .

# Or stage specific files only
git add server.js src/pages/newcase.tsx

# Commit with a descriptive message
git commit -m "Fix: description of what you changed"

# Push (local master → remote main)
git push origin master:main
```

### Step 6: Verify Push

```powershell
git log --oneline -1
# Should show: (HEAD -> master, origin/main)
```

---

## Redeploying on Another Machine

If you need to pull changes onto a different PC that also runs Docker:

```powershell
cd C:\Users\galam\OneDrive\Desktop\deploymenttesting
git pull origin main
docker compose down
docker compose up -d --build
```

For PCs that only access via browser — no action needed. Changes are live as soon as you rebuild on the main PC.

---

## Commit Message Examples

| Prefix | Use When | Example |
|--------|----------|---------|
| `Fix:` | Bug fix | `Fix: Excel date parsing error` |
| `Add:` | New feature | `Add: clearance PDF export` |
| `Update:` | Improvement | `Update: improve search performance` |
| `Remove:` | Removed something | `Remove: unused Settings page` |
| `Docs:` | Documentation | `Docs: update deployment guide` |

---

## Emergency: Undo Last Commit

```powershell
# Undo commit but keep file changes
git reset HEAD~1

# Discard ALL uncommitted changes (careful!)
git checkout -- .
```

---

## Useful Commands

```powershell
# Check container status
docker compose ps

# Check which remote you're pushing to
git remote -v

# View recent commits
git log --oneline -5

# Rebuild without cache (if build seems stuck)
docker compose build --no-cache
docker compose up -d
```
