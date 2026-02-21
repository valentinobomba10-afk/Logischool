BIG UPDATE FOLDER

Put upcoming update content in this folder.

Files:
- manifest.json
  - items[]: release notes shown on home when update is live
  - games[]: queued games to auto-activate when timer ends

Game object format in games[]:
{
  "id": "game-id",
  "name": "Game Name",
  "category": "Arcade",
  "description": "Short description",
  "tip": "Quick tip",
  "instructions": ["Step 1", "Step 2"],
  "accent": "#6dd5ff",
  "accent2": "#8b5cff",
  "scoreMode": "high",
  "scoreLabel": "score",
  "embed": "../embeds/your-file.html"
}

Notes:
- This is static hosting, so files are not uploaded by browsers.
- Auto-release means already deployed files in this folder become active when timer reaches zero.
