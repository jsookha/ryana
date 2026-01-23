# Ryana Setup Guide

## 📋 What You Have Built

You now have a complete offline-first Progressive Web App (PWA) for code snippet management with error logging capabilities, specifically designed for IT students.

---

## 🗂️ File Structure

Your project should have this structure:

```
ryana/
├── index.html
├── manifest.json
├── sw.js
├── css/
│   ├── main.css
│   ├── themes.css
│   └── prism-theme.css (from Prism.js download)
├── js/
│   ├── app.js
│   ├── db.js
│   ├── ui.js
│   ├── search.js
│   └── import-export.js
├── lib/
│   ├── prism.js (from your download)
│   └── prism.css (from your download)
├── assets/
│   └── icons/
│       ├── icon-72x72.png
│       ├── icon-96x96.png
│       ├── icon-128x128.png
│       ├── icon-144x144.png
│       ├── icon-152x152.png
│       ├── icon-192x192.png
│       ├── icon-384x384.png
│       └── icon-512x512.png
├── docs/
│   ├── DB_USAGE.md
│   └── SETUP_GUIDE.md (this file)
├── CHANGELOG.md
└── README.md
```

---

## 🎨 Creating PWA Icons

You need to create icons for your PWA. Here are your options:

### Option 1: Use a PWA Icon Generator
1. Go to https://realfavicongenerator.net/ or https://www.pwabuilder.com/imageGenerator
2. Upload a square image (at least 512x512px) with your Ryana logo/design
3. Download the generated icons
4. Place them in `/assets/icons/`

### Option 2: Create Simple Icons Manually
If you want to start quickly, create simple colored squares:

1. Use any image editor (Paint, GIMP, Photoshop)
2. Create square images with these sizes: 72, 96, 128, 144, 152, 192, 384, 512 pixels
3. Add the letter "R" or "Ryana" text on a colored background
4. Save as PNG files
5. Name them exactly as shown in the manifest.json

---

## 🚀 Running Ryana

### Method 1: Using a Local Server (Recommended)

PWAs require HTTPS or localhost. Use one of these:

#### Python (if installed):
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

#### Node.js (if installed):
```bash
npx http-server -p 8000
```

#### VS Code Live Server Extension:
1. Install "Live Server" extension in VS Code
2. Right-click `index.html`
3. Select "Open with Live Server"

Then open: `http://localhost:8000`

### Method 2: Direct File Access (Limited Features)
You can open `index.html` directly in a browser, but:
- Service Worker won't register
- PWA installation won't be available
- Some features may not work

---

## ✅ Testing Your Setup

### Step 1: Basic Functionality
1. Open the app in your browser
2. You should see the loading screen, then the main app
3. Check the browser console (F12) for any errors

### Step 2: Create a Test Snippet
1. Click "+ New Snippet"
2. Fill in:
   - Title: "Test Snippet"
   - Language: "javascript"
   - Code: `console.log('Hello Ryana!');`
3. Click "Save Snippet"
4. You should see it in the snippets grid

### Step 3: Test Search
1. Type "test" in the search box
2. Your snippet should appear

### Step 4: Test Theme Toggle
1. Click the theme icon (🌙/☀️)
2. The app should switch between light and dark mode

### Step 5: Test Export
1. Go to "Import/Export" view
2. Click "Export All Data"
3. A JSON file should download

### Step 6: PWA Installation (localhost only)
1. Look for an "Install" button in your browser's address bar
2. Click it to install Ryana as a standalone app
3. The app should open in its own window

---

## 🔧 Troubleshooting

### Icons Not Showing
- Check that icon files exist in `/assets/icons/`
- Check file names match exactly what's in `manifest.json`
- Icons must be PNG format

### Service Worker Not Registering
- **HTTPS Required**: Service workers only work on HTTPS or localhost
- Check browser console for errors
- Try clearing cache (Ctrl+Shift+Delete) and reload

### Database Not Working
- Check browser console for IndexedDB errors
- Try a different browser (Chrome, Firefox, Edge all support IndexedDB)
- Clear browser data and try again

### Prism.js Syntax Highlighting Not Working
- Verify `lib/prism.js` and `lib/prism.css` exist
- Check browser console for 404 errors
- Ensure file paths in `index.html` are correct

### Snippets Not Saving
- Open browser DevTools → Application → IndexedDB
- Check if "RyanaDB" database exists
- Check if data is being stored

---

## 📱 Installing as PWA

### Desktop (Chrome/Edge):
1. Open Ryana in browser
2. Click the install icon in address bar
3. Click "Install"
4. App opens in standalone window

### Android:
1. Open Ryana in Chrome
2. Tap menu (⋮) → "Add to Home screen"
3. Ryana icon appears on home screen
4. Tap to open as app

### iOS (Limited PWA Support):
1. Open Ryana in Safari
2. Tap Share button
3. "Add to Home Screen"
4. Note: Some PWA features may be limited on iOS

---

## 🎓 Using Ryana

### Creating Your First Subject
1. Go to "Subjects" view
2. Click "+ Add Subject"
3. Enter subject details (e.g., "Algorithms", Year 1, Semester 1)
4. The subject will now appear in dropdown when creating snippets

### Organizing with Tags
- Use descriptive tags: `sorting`, `loops`, `beginner`, `exam`
- Tags are reusable and auto-suggested
- Multiple tags help with cross-subject discovery

### Logging Errors
1. Click "+ Log Error" button
2. Paste the error-producing code
3. Fill in error message and solution
4. Add reference links (Stack Overflow, documentation)
5. Tag it for easy recall later

### Importing/Exporting
- **At school**: Create snippets during class
- **End of day**: Export all data to JSON file
- **At home**: Import the JSON file
- Data merges automatically (no duplicates)

### Keyboard Shortcuts
- `Ctrl+K` - Focus search
- `Ctrl+N` - New snippet
- `Ctrl+E` - New error log
- `Ctrl+F` - Toggle favorites
- `Esc` - Close modals/clear search

---

## 🔄 Updating Ryana

When you make changes to the code:

1. Update the version number in `sw.js`:
   ```javascript
   const CACHE_NAME = 'ryana-v1.0.1'; // Increment version
   ```

2. Hard refresh browser:
   - Windows/Linux: `Ctrl+Shift+R`
   - Mac: `Cmd+Shift+R`

3. The service worker will update automatically

---

## 💾 Backup Recommendations

### Weekly Backup
1. Export all data every week
2. Save JSON file to cloud storage (Google Drive, Dropbox)
3. Keep last 3 backups

### Before Major Changes
- Export data before updating Ryana
- Export before clearing browser data
- Export before changing devices

---

## 🌐 Future Enhancements (Stages 3-6)

What's coming in future updates:

### Stage 3: Cloud Sync
- GitHub Gist integration
- Google Drive sync
- Automatic backup

### Stage 4: Advanced Search
- Full-text search in code
- Cross-subject discovery
- Visual tag relationships

### Stage 5: Student Features
- Usage context tracking
- Analytics dashboard
- Snippet collections per semester

### Stage 6: Advanced Features
- AI-assisted error explanations
- Snippet recommendations
- IDE extensions

---

## 🐛 Common Issues

### "Failed to register service worker"
**Solution**: Ensure you're running on localhost or HTTPS

### "Database initialization failed"
**Solution**: Check if IndexedDB is enabled in browser settings

### Snippets disappear after browser restart
**Solution**: Check if browser is in private/incognito mode (doesn't persist data)

### Import says "Invalid JSON file"
**Solution**: Ensure you're importing a file exported from Ryana

---

## 📚 Learning Resources

### IndexedDB
- https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API

### Service Workers
- https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API

### PWA Basics
- https://web.dev/progressive-web-apps/

### Prism.js Documentation
- https://prismjs.com/

---

## 🎯 Next Steps

1. ✅ Set up your development environment
2. ✅ Create PWA icons
3. ✅ Run Ryana on localhost
4. ✅ Create your first subject
5. ✅ Add your first snippet
6. ✅ Test export/import with a USB drive
7. ✅ Install as PWA on your devices

---

## ⭐ Tips for Success

1. **Tag consistently**: Use the same tags for similar concepts
2. **Add context**: Fill in the "when/where/how" fields
3. **Document errors immediately**: Don't wait until you forget the solution
4. **Export weekly**: Make backups a habit
5. **Use favorites**: Star snippets you use often
6. **Explore search**: Try searching by tags, subjects, languages

---

Need help? Check the browser console (F12) for error messages and refer to the DB_USAGE.md guide for database operations.