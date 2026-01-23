# Changelog

All notable changes to Ryana will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-01-23

### 🎉 Initial Release

The first complete version of Ryana - your second mind for code!

### Added

#### Core Features
- **Snippet Management**
  - Create, read, update, delete (CRUD) code snippets
  - Support for multiple programming languages
  - Syntax highlighting using Prism.js
  - Markdown support in descriptions
  - Title, description, code, tags, and metadata fields

- **Error Documentation**
  - Log error messages with solutions
  - Add reference links to Stack Overflow, documentation, etc.
  - Search past errors to avoid repeat research
  - Error-specific view for quick access

- **Subject-Based Organization**
  - Create subjects for different courses
  - Color-code subjects using HSL
  - Tags inherit subject colors
  - Filter snippets by subject

- **Search & Discovery**
  - Full-text search across all fields
  - Filter by language, subject, tags
  - Sort by date, title, popularity
  - Search suggestions and autocomplete
  - Related snippets discovery

- **Offline-First PWA**
  - Complete offline functionality
  - IndexedDB for persistent storage
  - Service Worker for asset caching
  - Install as standalone app
  - Works without internet connection

- **Import/Export**
  - Export all data as JSON
  - Export selected snippets
  - Import with merge/replace/add-only modes
  - Transfer data between devices
  - Backup reminder system

#### User Interface
- **Modern Design**
  - Clean, student-friendly interface
  - Responsive layout (mobile, tablet, desktop)
  - Light and dark themes
  - Smooth animations and transitions
  - Toast notifications for feedback

- **Views**
  - All Snippets view
  - Favorites view
  - Error Logs view
  - Subjects view
  - Import/Export view

- **Navigation**
  - Sidebar navigation
  - Quick action buttons
  - Search bar with filters
  - Keyboard shortcuts support

#### Analytics
- Track snippet views
- Track code copies
- Popular snippets sorting
- Recently added snippets
- Usage statistics

#### Developer Features
- Complete database API (DB.js)
- Modular JavaScript architecture
- Comprehensive documentation
- Usage examples
- Error handling throughout

### Technical Details

#### Database Schema
- **snippets** store - Unified code and error storage
- **subjects** store - Course/subject definitions
- **settings** store - User preferences
- **tags** store - Auto-suggestions with usage tracking

#### Indexes
- Title, language, subject, type, favourite
- Multi-entry index for tags
- Created/updated timestamps

#### Storage
- IndexedDB for all data
- No backend required
- Export to JSON for portability
- Service Worker caches for offline assets

### Documentation
- README.md - Project overview
- SETUP_GUIDE.md - Installation and setup
- DB_USAGE.md - Database API documentation
- CHANGELOG.md - Version history (this file)

### Known Limitations
- Cloud sync not yet implemented (planned for v1.1.0)
- GitHub Gist integration not available (planned for v1.1.0)
- No version control for snippet edits (planned for v1.2.0)
- Subject modal uses browser prompts (proper modal planned for v1.1.0)

---

## [Unreleased]

### Planned for v1.1.0 (Stage 3)
- GitHub Gist integration
- Google Drive sync
- Auto-sync when online
- Conflict resolution for imports
- Proper subject modal form
- Settings modal improvements

### Planned for v1.2.0 (Stage 4)
- Advanced full-text search
- Visual tag relationship graph
- Cross-subject discovery tool
- Search filters panel
- Saved search queries

### Planned for v1.3.0 (Stage 5)
- Usage context analytics
- Analytics dashboard
- Snippet collections by semester
- Collaborative export/sharing
- Code comparison tool

### Planned for v2.0.0 (Stage 6)
- AI-assisted error explanations
- Snippet recommendation engine
- VS Code extension
- Desktop app (Electron)
- Multi-device sync with authentication

---

## Version History

### Template for Future Versions

```markdown
## [x.x.x] - YYYY-MM-DD

### Added
- New features

### Changed
- Changes in existing functionality

### Deprecated
- Soon-to-be removed features

### Removed
- Removed features

### Fixed
- Bug fixes

### Security
- Security updates
```

---

## How to Update

When releasing a new version:

1. Update version number in:
   - `sw.js` (CACHE_NAME)
   - `manifest.json`
   - `package.json` (if created)

2. Document changes in this CHANGELOG

3. Create a Git tag:
   ```bash
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin v1.0.0
   ```

4. Update README if needed

---

**Note**: For detailed API changes, see [DB_USAGE.md](docs/DB_USAGE.md)