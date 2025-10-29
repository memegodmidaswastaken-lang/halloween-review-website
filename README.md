# 🎃 Halloween Candy Map

A Google Maps–style site where people rate houses by the candy they give out.

## Features
- Register/login (no email)
- Add houses with candy rating
- Post reviews
- Upload profile pictures
- Dark mode
- Moderator tools (account: **memegodmidas**, password: `Godsatan1342`)
- Persistent data on Render using `/data`

## Deploy on Render
1. Create a new **Web Service** from this repo.
2. Add a **Persistent Disk**:
   - Name: `data`
   - Mount Path: `/data`
   - Size: `1GB`
3. Build command: *(leave blank)*
4. Start command: `node app.js`
