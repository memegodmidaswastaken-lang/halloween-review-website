# 🎃 Halloween Candy Map

A Google Maps-style site for rating houses based on candy, reviews, and decorations.

## Features
- Register/login (no email)
- Add houses with candy ratings
- Post reviews
- Upload profile pictures
- Dark mode toggle
- Moderator tools (memegodmidas)
- Persistent database and uploads on Render

## Deploy on Render
1. Create a **Web Service** from this repo.
2. Add a **Persistent Disk**:
   - Name: `data`
   - Mount Path: `/data`
   - Size: `1GB`
3. Build Command: *(leave empty)*
4. Start Command: `node app.js`
5. Deploy
