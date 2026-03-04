# Code Update Workflow - Complete Step-by-Step Guide

## Prerequisites
- Have your project open in VS Code
- Docker containers running (`docker compose up -d`)
- Git repository initialized and connected

## Step-by-Step Workflow

### 1. 📝 EDIT YOUR CODE
```bash
# Make your changes in VS Code to any files (server.js, frontend files, etc.)
# Save all files: Ctrl + S
```

### 2. 🧪 TEST YOUR CHANGES LOCALLY
```powershell
# If you changed backend code (server.js, etc.):
docker compose restart backend

# If you changed frontend code (src/ files):
docker compose restart frontend

# If you changed both or major changes:
docker compose down
docker compose up -d --build

# Test your application:
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
```

### 3. ✅ VERIFY EVERYTHING WORKS
- Test all functionality that you modified
- Check browser console for errors
- Test in different browsers if needed
- Check Docker logs if issues: `docker compose logs backend --tail 20`

### 4. 📋 CHECK WHAT FILES CHANGED
```powershell
git status
```

### 5. 🎯 STAGE YOUR CHANGES
```powershell
# Add specific files:
git add filename.js

# Add multiple specific files:
git add server.js src/pages/ExcelSync.tsx

# Add all modified files (be careful!):
git add .

# Add all files in a directory:
git add src/
```

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
git push origin master:main

# Alternative: Push to master branch if it exists:
git push origin master
```

### 8. ✅ VERIFY PUSH SUCCESS
```powershell
# Check that your commit is now on remote:
git log --oneline -1
# Should show: (HEAD -> master, origin/main)
```

### 9. 🌐 UPDATE OTHER PCs/USERS
**For PCs with Git + Docker:**
```powershell
git pull origin main
docker compose down
docker compose up -d --build
```

**For PCs with just browser access:**
- No action needed! Changes are live immediately
- Just refresh browser or clear cache if needed

## 🔧 Quick Commands Reference

### 🆘 Emergency Commands
```powershell
# Undo last commit (keep changes):
git reset HEAD~1

# Discard all uncommitted changes:
git checkout -- .

# Check repository status:
git status

# View recent commits:
git log --oneline -10

# Check what remote you're connected to:
git remote -v

# Restart all containers:
docker compose restart

# View container logs:
docker compose logs backend --tail 50
```

### 📱 Check Application Status
```powershell
# Check if containers are running:
docker compose ps

# Check backend health:
curl http://localhost:5000/api/health

# Check frontend:
curl http://localhost:3000
```

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