# After Editing Code — Rebuild & Push Workflow

<<<<<<< HEAD
## Prerequisites

- Have your project open in VS Code
- Docker containers running (`docker compose up -d`)
- Git repository initialized and connected
=======
Follow this workflow every time you edit the source code and want to apply the changes.
>>>>>>> d1cc9cf1af9151e3943874dbb90188b63d904089

---

<<<<<<< HEAD
### 1. 📝 EDIT YOUR CODE

```bash
# Make your changes in VS Code to any files (server.js, frontend files, etc.)
# Save all files: Ctrl + S
```

### 2. 🧪 TEST YOUR CHANGES LOCALLY

=======
## Quick Version

>>>>>>> d1cc9cf1af9151e3943874dbb90188b63d904089
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

<<<<<<< HEAD
### 3. ✅ VERIFY EVERYTHING WORKS

- Test all functionality that you modified
- Check browser console for errors
- Test in different browsers if needed
- Check Docker logs if issues: `docker compose logs backend --tail 20`

### 4. 📋 CHECK WHAT FILES CHANGED

=======
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

>>>>>>> d1cc9cf1af9151e3943874dbb90188b63d904089
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

<<<<<<< HEAD
### 5. 🎯 STAGE YOUR CHANGES

```powershell
# Add specific files:
git add filename.js

# Add multiple specific files:
git add server.js src/pages/ExcelSync.tsx

# Add all modified files (be careful!):
=======
# Stage your changes
>>>>>>> d1cc9cf1af9151e3943874dbb90188b63d904089
git add .

# Or stage specific files only
git add server.js src/pages/newcase.tsx

<<<<<<< HEAD
### 6. 💾 COMMIT YOUR CHANGES

```powershell
# Commit with descriptive message:
git commit -m "Fix: Description of what you fixed or added"

# Examples of good commit messages:
git commit -m "Fix: Excel upload date conversion issue"
git commit -m "Add: New validation for user input"
git commit -m "Update: Improve error handling in API"
```

### 7. 🚀 PUSH TO REMOTE REPOSITORY

```powershell
# Push to the main branch (recommended):
=======
# Commit with a descriptive message
git commit -m "Fix: description of what you changed"

# Push (local master → remote main)
>>>>>>> d1cc9cf1af9151e3943874dbb90188b63d904089
git push origin master:main
```

<<<<<<< HEAD
### 8. ✅ VERIFY PUSH SUCCESS
=======
### Step 6: Verify Push
>>>>>>> d1cc9cf1af9151e3943874dbb90188b63d904089

```powershell
git log --oneline -1
# Should show: (HEAD -> master, origin/main)
```

<<<<<<< HEAD
### 9. 🌐 UPDATE OTHER PCs/USERS

**For PCs with Git + Docker:**
=======
---

## Redeploying on Another Machine

If you need to pull changes onto a different PC that also runs Docker:
>>>>>>> d1cc9cf1af9151e3943874dbb90188b63d904089

```powershell
cd C:\Users\galam\OneDrive\Desktop\deploymenttesting
git pull origin main
docker compose down
docker compose up -d --build
```

<<<<<<< HEAD
**For PCs with just browser access:**

- No action needed! Changes are live immediately
- Just refresh browser or clear cache if needed
=======
For PCs that only access via browser — no action needed. Changes are live as soon as you rebuild on the main PC.
>>>>>>> d1cc9cf1af9151e3943874dbb90188b63d904089

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

<<<<<<< HEAD
### 🆘 Emergency Commands

=======
>>>>>>> d1cc9cf1af9151e3943874dbb90188b63d904089
```powershell
# Undo commit but keep file changes
git reset HEAD~1

# Discard ALL uncommitted changes (careful!)
git checkout -- .
```

<<<<<<< HEAD
### 📱 Check Application Status
=======
---

## Useful Commands
>>>>>>> d1cc9cf1af9151e3943874dbb90188b63d904089

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
<<<<<<< HEAD

## 📝 Commit Message Best Practices

- **Fix:** Bug fixes
- **Add:** New features
- **Update:** Improvements to existing features
- **Remove:** Deleted functionality
- **Refactor:** Code restructuring
- **Docs:** Documentation changes

Example: `git commit -m "Fix: Resolve Excel date parsing for serial numbers"`

## ⚠️ Important Notes

1. **Always test locally before pushing**
2. **Your local branch:** `master`
3. **Remote default branch:** `main`
4. **Use:** `git push origin master:main` (pushes local master to remote main)
5. **Docker rebuilds** may take several minutes
6. **Other PCs** accessing via browser see changes immediately after you rebuild

## 🔄 Complete Example Workflow

```powershell
# 1. Edit files in VS Code
# 2. Save files (Ctrl + S)

# 3. Test changes
docker compose restart backend

# 4. Check status
git status

# 5. Add changes
git add server.js

# 6. Commit
git commit -m "Fix: Excel upload validation"

# 7. Push to remote
git push origin master:main

# 8. Verify
git log --oneline -1
```

**🎉 Done! Your changes are now live and pushed to GitHub!**
=======
>>>>>>> d1cc9cf1af9151e3943874dbb90188b63d904089
