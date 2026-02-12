# Ryana

> Your second mind for code

**Ryana** is an offline-first Progressive Web App (PWA) designed specifically for IT students to manage code snippets and document errors across multiple programming languages and subjects.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)


---

## ◆ Features

### ◉ Smart Snippet Management
‣ Store code snippets with syntax highlighting (Python, Java, C#, JavaScript, Kotlin, TypeScript, HTML/CSS, and more)  
‣ Organize by subject, language, and custom tags  
‣ Add descriptions and usage context (when, where, how)  
‣ Mark favourites for quick access  
‣ Track analytics (views, copies)  

### ◉ Error Documentation
‣ Log errors with solutions and reference links  
‣ Search past mistakes to avoid repeat research  
‣ Build your personal debugging knowledge base  

### ◉ Subject-Based Organization
‣ Create subjects for your courses (Algorithms, Web Dev, Mobile Dev, etc.)  
‣ Color-coded visual system using HSL  
‣ Tags inherit subject colors for easy recognition  

### ◉ Powerful Search
‣ Full-text search across code, descriptions, and errors  
‣ Filter by language, subject, or tags  
‣ Sort by date, title, or popularity  
‣ Cross-subject discovery  

### ◉ Offline-First Design
‣ Works completely offline (PWA)  
‣ IndexedDB storage (no server required)  
‣ Service Worker caching for instant load  
‣ Install as standalone app on any device  

### ◉ Import/Export
‣ Export all data as JSON  
‣ Import from previous exports  
‣ Merge or replace data  
‣ Transfer between devices via USB/email  
‣ Future: GitHub Gist & cloud sync  

### ◉ Modern UI
‣ Light and dark themes  
‣ Responsive design (mobile, tablet, desktop)  
‣ Keyboard shortcuts  
‣ Clean, student-friendly interface  

---

## ◆ Quick Start

### Prerequisites
‣ Modern web browser (Chrome, Firefox, Edge, Safari, Brave, Opera)  
‣ Local web server (for PWA features)  

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/jsookha/ryana.git
   cd ryana
   ```

2. **Add Prism.js files**
   - Download Prism.js preset from [https://prismjs.com/download.html](https://prismjs.com/download.html)  
   - Select "Okaidia" theme and required languages  
   - Add Line Numbers and Copy to Clipboard plugins  
   - Place `prism.js` in `/lib/`  
   - Place `prism.css` in `/lib/`  

3. **Create PWA icons**
   - Generate icons using [https://realfavicongenerator.net/](https://realfavicongenerator.net/)  
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
   ‣ Look for install icon in browser address bar  
   ‣ Click to install as standalone app  

---

## ◆ Usage

### Creating a Snippet
‣ Click "+ New Snippet"  
‣ Fill in title, language, subject  
‣ Add code and description  
‣ Tag for organization  
‣ Optional: Add usage context (when/where/how)  
‣ Save!  

### Logging an Error
‣ Click "+ Log Error"  
‣ Paste the error-producing code  
‣ Add error message  
‣ Document your solution  
‣ Include reference links  
‣ Tag for future recall  

### Organizing with Subjects
‣ Go to "Subjects" view  
‣ Create subjects for your courses  
‣ Assign custom colors  
‣ Snippets automatically inherit subject colors  

### Exporting Your Work
‣ At end of class/day: Go to Import/Export  
‣ Click "Export All Data"  
‣ Save JSON file to USB/email yourself  
‣ At home: Import the file  
‣ Data merges automatically!  

---

## ◆ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Focus search |
| `Ctrl+N` | New snippet |
| `Ctrl+E` | New error log |
| `Ctrl+F` | View favorites |
| `Esc` | Close modal/Clear search |

---

## ◆ Data Structure

Ryana uses IndexedDB with 4 object stores:

1. **snippets** – Code and error entries  
2. **subjects** – Course/subject definitions  
3. **settings** – User preferences  
4. **tags** – Auto-suggestions with usage counts  

See [DB_USAGE.md](docs/DB_USAGE.md) for detailed API documentation.

---

## ◆ Technology Stack

‣ **Frontend**: Vanilla HTML, CSS, JavaScript (no frameworks!)  
‣ **Storage**: IndexedDB (client-side NoSQL database)  
‣ **PWA**: Service Workers, Web App Manifest  
‣ **Syntax Highlighting**: Prism.js  
‣ **Styling**: Custom CSS with CSS Variables (themes)  

---

## ◆ Browser Support

| Browser | Support |
|---------|---------|
| Chrome/Edge (Chromium) | ✓ Full |
| Firefox | ✓ Full |
| Safari | ⚠ Limited (no offline install) |
| Brave/Opera | ✓ Full |
| Mobile Chrome/Firefox | ✓ Full |
| Mobile Safari | ⚠ Limited (no offline install) |

---

## ◆ Roadmap

### ✓ Stage 1: MVP (Current)
☑ CRUD operations  
☑ Offline storage  
☑ Basic search  
☑ Syntax highlighting  

### ✓ Stage 2: Enhanced Learning
☑ Markdown support  
☑ Error documentation  
☑ Favourites  
☑ Color coding  

### ⚑ Stage 3: Sync & Portability (In Progress)
☑ JSON import/export  
☐ GitHub Gist integration  
☐ Google Drive sync  
☐ OneDrive sync  
☐ Conflict resolution  

### ☐ Stage 4: Advanced Search
☐ Full-text code search  
☐ Cross-subject discovery  
☐ Visual tag relationships  
☐ Advanced filters  

### ☐ Stage 5: Student Extensions
☐ Usage context tracking  
☐ Analytics dashboard  
☐ Semester-based collections  
☐ Collaborative sharing  

### ☐ Stage 6: Future Features
☐ AI-assisted error explanations (experimental)  
☐ Snippet recommendations  
☐ VS Code extension  
☐ Multi-device sync with auth  

---

## ⌬ License

This project is licensed under the MIT License – see the LICENSE file for details.

---

## ⌯ Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup
‣ Fork the repository  
‣ Create your feature branch (`git checkout -b feature/AmazingFeature`)  
‣ Commit your changes (`git commit -m 'Add some AmazingFeature'`)  
‣ Push to the branch (`git push origin feature/AmazingFeature`)  
‣ Open a Pull Request  

---

## ☼ Acknowledgments

‣ **Name Origin**: "Ryana" derives from Aramaic, meaning "thought" and "idea"  
‣ **Prism.js**: Syntax highlighting library  
‣ **IndexedDB & MDN Docs**: Storage inspiration  
‣ **Inspiration**: Built for 1st-year IT students learning multiple languages  

---

## ⌾ Contact

Project Link: [https://github.com/jsookha/ryana](https://github.com/jsookha/ryana)  
[Jessel Sookha](https://github.com/jsookha)  

---

## ◆ Screenshots

### Light Theme - All Snippets View
![Light Theme](docs/screenshots/light-theme.png)

### Dark Theme - Error Logs
![Dark Theme](docs/screenshots/dark-theme.png)

### Snippet Detail View
![Snippet Detail](docs/screenshots/snippet-detail.png)

### Import/Export Interface
![Import/Export](docs/screenshots/import-export.png)


---

## ◆ Pro Tips

‣ **Tag Consistently**: Use standard tags like `sorting`, `loops`, `beginner`  
‣ **Document Immediately**: Log errors right after solving them  
‣ **Export Weekly**: Make backups a habit  
‣ **Use Favorites**: Star frequently-used snippets  
‣ **Add Context**: Fill in when/where/how fields for better recall  

---

**Built with ❤️ for IT students everywhere**

---