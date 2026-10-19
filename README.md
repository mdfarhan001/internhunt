# InternHunt (Full-stack)

internhunt/
  frontend/  index.html, style.css, app.js   (design + screens)
  backend/   server.js, package.json         (Express API + SQLite + login)

## Chalane ka tarika
1. Node.js 18+ install karo.
2. cd backend
   npm install
   npm start
3. Browser: http://localhost:3000  (backend hi frontend ko serve karta hai)

## Deploy (Render.com)
Root directory: backend | Build: npm install | Start: npm start
Env variable: JWT_SECRET = koi lamba random text

## API
POST /api/signup, /api/login, GET /api/me
GET/POST /api/apps, PUT/DELETE /api/apps/:id  (Bearer token zaroori)
