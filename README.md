# Ryana

> Your second mind for code

**Ryana** is an offline-first Progressive Web App (PWA) designed specifically for IT students to manage code snippets and document errors across multiple programming languages and subjects.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

---

## ✨ Features

### 📚 Smart Snippet Management
- Store code snippets with syntax highlighting (Python, JavaScript, Kotlin, TypeScript, HTML/CSS, and more)
- Organize by subject, language, and custom tags
- Add descriptions and usage context (when, where, how)
- Mark favorites for quick access
- Track analytics (views, copies)

### 🐛 Error Documentation
- Log errors with solutions and reference links
- Search past mistakes to avoid repeat research
- Build your personal debugging knowledge base

### 🎨 Subject-Based Organization
- Create subjects for your courses (Algorithms, Web Dev, Mobile Dev, etc.)
- Color-coded visual system using HSL
- Tags inherit subject colors for easy recognition

### 🔍 Powerful Search
- Full-text search across code, descriptions, and errors
- Filter by language, subject, or tags
- Sort by date, title, or popularity
- Cross-subject discovery

### 💾 Offline-First Design
- Works completely offline (PWA)
- IndexedDB storage (no server required)
- Service Worker caching for instant load
- Install as standalone app on any device

### 📤 Import/Export
- Export all data as JSON
- Import from previous exports
- Merge or replace data
- Transfer between devices via USB/email
- Future: GitHub Gist & cloud sync

### 🌓 Modern UI
- Light and dark themes
- Responsive design (mobile, tablet, desktop)
- Keyboard shortcuts
- Clean, student-friendly interface

---

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome, Firefox, Edge, Safari)
- Local web server (for PWA features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ryana.git
   cd ryana
   ```

2. **Add Prism.js files**
   - Download Prism.js from https://prismjs.com/download.html
   - Select "Okaidia" theme
   - Select all languages you need
   - Add Line Numbers and Copy to Clipboard plugins
   - Place `prism.js` in `/lib/`
   - Place `prism.css` in `/lib/`

3. **Create PWA icons**
   - Generate icons using https://realfavicongenerator.net/
   - Place in `/assets/icons/` with sizes: 72, 96, 128, 144, 152, 192, 384, 512px

4. **Run a local server**
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx http-server -p 8000
   
   # Or use VS Code Live Server extension
   ```

5. **Open in browser**
   ```
   http://localhost:8000
   ```

6. **Install as PWA** (optional)
   - Look for install icon in browser address bar
   - Click to install as standalone app

---

## 📖 Usage

### Creating a Snippet
1. Click "+ New Snippet"
2. Fill in title, language, subject
3. Add code and description
4. Tag for organization
5. Optional: Add usage context (when/where/how)
6. Save!

### Logging an Error
1. Click "+ Log Error"
2. Paste the error-producing code
3. Add error message
4. Document your solution
5. Include reference links
6. Tag for future recall

### Organizing with Subjects
1. Go to "Subjects" view
2. Create subjects for your courses
3. Assign custom colors
4. Snippets automatically inherit subject colors

### Exporting Your Work
1. At end of class/day: Go to Import/Export
2. Click "Export All Data"
3. Save JSON file to USB/email yourself
4. At home: Import the file
5. Data merges automatically!

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Focus search |
| `Ctrl+N` | New snippet |
| `Ctrl+E` | New error log |
| `Ctrl+F` | View favorites |
| `Esc` | Close modal/Clear search |

---

## 🗂️ Data Structure

Ryana uses IndexedDB with 4 object stores:

1. **snippets** - Code and error entries
2. **subjects** - Course/subject definitions
3. **settings** - User preferences
4. **tags** - Auto-suggestions with usage counts

See [DB_USAGE.md](docs/DB_USAGE.md) for detailed API documentation.

---

## 🛠️ Technology Stack

- **Frontend**: Vanilla HTML, CSS, JavaScript (no frameworks!)
- **Storage**: IndexedDB (client-side NoSQL database)
- **PWA**: Service Workers, Web App Manifest
- **Syntax Highlighting**: Prism.js
- **Styling**: Custom CSS with CSS Variables (themes)

---

## 📱 Browser Support

| Browser | Support |
|---------|---------|
| Chrome/Edge (Chromium) | ✅ Full |
| Firefox | ✅ Full |
| Safari | ⚠️ PWA features limited |
| Mobile Chrome/Firefox | ✅ Full |
| Mobile Safari | ⚠️ PWA features limited |

---

## 🗺️ Roadmap

### ✅ Stage 1: MVP (Current)
- [x] CRUD operations
- [x] Offline storage
- [x] Basic search
- [x] Syntax highlighting

### ✅ Stage 2: Enhanced Learning
- [x] Markdown support
- [x] Error documentation
- [x] Favourites
- [x] Color coding

### 🚧 Stage 3: Sync & Portability (In Progress)
- [x] JSON import/export
- [ ] GitHub Gist integration
- [ ] Google Drive sync
- [ ] Conflict resolution

### 📋 Stage 4: Advanced Search
- [ ] Full-text code search
- [ ] Cross-subject discovery
- [ ] Visual tag relationships
- [ ] Advanced filters

### 📋 Stage 5: Student Extensions
- [ ] Usage context tracking
- [ ] Analytics dashboard
- [ ] Semester-based collections
- [ ] Collaborative sharing

### 📋 Stage 6: Future Features
- [ ] AI-assisted error explanations
- [ ] Snippet recommendations
- [ ] VS Code extension
- [ ] Multi-device sync with auth

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- **Name Origin**: "Ryana" derives from Aramaic, meaning "thought" and "idea"
- **Prism.js**: Syntax highlighting library
- **Inspiration**: Built for 1st-year IT students learning multiple languages

---

## 📧 Contact

Project Link: [https://github.com/yourusername/ryana](https://github.com/yourusername/ryana)

---

## 📸 Screenshots

### Light Theme - All Snippets View
![Light Theme](docs/screenshots/light-theme.png)

### Dark Theme - Error Logs
![Dark Theme](docs/screenshots/dark-theme.png)

### Snippet Detail View
![Snippet Detail](docs/screenshots/snippet-detail.png)

### Import/Export Interface
![Import/Export](docs/screenshots/import-export.png)

---

## 💡 Pro Tips

1. **Tag Consistently**: Use standard tags like `sorting`, `loops`, `beginner`
2. **Document Immediately**: Log errors right after solving them
3. **Export Weekly**: Make backups a habit
4. **Use Favorites**: Star frequently-used snippets
5. **Add Context**: Fill in when/where/how fields for better recall

---

**Built with ❤️ for IT students everywhere**