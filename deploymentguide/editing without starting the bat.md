
if editing

# On YOUR PC

git add .
git commit -m "your message"
git push origin main

# On YOUR SERVER

git pull origin main
docker-compose down
docker-compose up -d --build
