/**
 * Ryana Import/Export Module
 * Handles JSON import/export and file operations
 * Version: 1.0.0
 */

const ImportExport = {
  /**
   * Export all data as JSON file
   */
  async exportAll() {
    try {
      UI.showToast('Preparing export...', 'info');

      const data = await DB.exportDatabase();
      const filename = `ryana-export-${this.formatDateForFilename(new Date())}.json`;
      
      this.downloadJSON(data, filename);
      
      UI.showToast('Export successful! File downloaded.', 'success');
    } catch (error) {
      console.error('[ImportExport] Export failed:', error);
      UI.showToast('Export failed. Please try again.', 'error');
    }
  },

  /**
   * Export selected snippets
   * @param {Array} snippetIds - Array of snippet IDs to export
   */
  async exportSelected(snippetIds) {
    if (!snippetIds || snippetIds.length === 0) {
      UI.showToast('No snippets selected', 'error');
      return;
    }

    try {
      UI.showToast('Preparing export...', 'info');

      // Get selected snippets
      const snippets = await Promise.all(
        snippetIds.map(id => DB.getSnippet(id))
      );

      // Get related subjects
      const subjectNames = [...new Set(snippets.map(s => s.subject).filter(Boolean))];
      const allSubjects = await DB.getAllSubjects();
      const subjects = allSubjects.filter(sub => subjectNames.includes(sub.name));

      const exportData = {
        version: 1,
        exportedAt: Date.now(),
        exportType: 'selected',
        snippets: snippets.filter(s => s !== null),
        subjects: subjects,
        settings: null,
        tags: null
      };

      const filename = `ryana-selected-${this.formatDateForFilename(new Date())}.json`;
      this.downloadJSON(exportData, filename);

      UI.showToast(`Exported ${snippets.length} snippet(s)`, 'success');
    } catch (error) {
      console.error('[ImportExport] Export failed:', error);
      UI.showToast('Export failed. Please try again.', 'error');
    }
  },

  /**
   * Export snippets by subject
   * @param {string} subjectName - Subject to export
   */
  async exportBySubject(subjectName) {
    try {
      const snippets = await DB.getAllSnippets({ subject: subjectName });
      const subjects = await DB.getAllSubjects();
      const subject = subjects.find(s => s.name === subjectName);

      const exportData = {
        version: 1,
        exportedAt: Date.now(),
        exportType: 'subject',
        subject: subjectName,
        snippets: snippets,
        subjects: subject ? [subject] : [],
        settings: null,
        tags: null
      };

      const filename = `ryana-${subjectName.toLowerCase().replace(/\s+/g, '-')}-${this.formatDateForFilename(new Date())}.json`;
      this.downloadJSON(exportData, filename);

      UI.showToast(`Exported ${snippets.length} snippet(s) from ${subjectName}`, 'success');
    } catch (error) {
      console.error('[ImportExport] Export failed:', error);
      UI.showToast('Export failed. Please try again.', 'error');
    }
  },

  /**
   * Import data from JSON file
   * @param {File} file - JSON file to import
   */
  async importFile(file) {
    if (!file || file.type !== 'application/json') {
      UI.showToast('Please select a valid JSON file', 'error');
      return;
    }

    const statusDiv = document.getElementById('import-status');
    statusDiv.textContent = 'Reading file...';

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate data structure
      if (!this.validateImportData(data)) {
        throw new Error('Invalid file format');
      }

      // Show import options
      this.showImportOptions(data, file.name);
    } catch (error) {
      console.error('[ImportExport] Import failed:', error);
      statusDiv.textContent = '❌ Import failed: Invalid JSON file';
      UI.showToast('Failed to read file. Please check the file format.', 'error');
    }
  },

  /**
   * Validate import data structure
   * @param {Object} data - Import data
   * @returns {boolean}
   */
  validateImportData(data) {
    // Check required fields
    if (!data.version || !data.exportedAt) {
      return false;
    }

    // Check if snippets array exists
    if (!Array.isArray(data.snippets)) {
      return false;
    }

    // Validate snippet structure
    for (const snippet of data.snippets) {
      if (!snippet.id || !snippet.title || !snippet.code) {
        return false;
      }
    }

    return true;
  },

  /**
   * Show import options dialog
   * @param {Object} data - Import data
   * @param {string} filename - Original filename
   */
  showImportOptions(data, filename) {
    const statusDiv = document.getElementById('import-status');
    
    statusDiv.innerHTML = `
      <div class="import-preview">
        <h4>Import Preview</h4>
        <p><strong>File:</strong> ${this.escapeHtml(filename)}</p>
        <p><strong>Exported:</strong> ${new Date(data.exportedAt).toLocaleString()}</p>
        <p><strong>Snippets:</strong> ${data.snippets.length}</p>
        <p><strong>Subjects:</strong> ${data.subjects?.length || 0}</p>
        
        <div class="import-options">
          <h4>Import Mode</h4>
          <label>
            <input type="radio" name="import-mode" value="merge" checked>
            <strong>Merge</strong> - Keep existing data, update if newer
          </label>
          <label>
            <input type="radio" name="import-mode" value="replace">
            <strong>Replace</strong> - Clear all data first (⚠️ Warning: This deletes everything!)
          </label>
          <label>
            <input type="radio" name="import-mode" value="add">
            <strong>Add Only</strong> - Add new snippets, skip duplicates
          </label>
        </div>
        
        <div class="import-actions">
          <button class="btn btn-primary" onclick="ImportExport.executeImport(this.dataset.data)" 
                  data-data='${JSON.stringify(data).replace(/'/g, "&apos;")}'>
            Import Now
          </button>
          <button class="btn btn-secondary" onclick="ImportExport.cancelImport()">
            Cancel
          </button>
        </div>
      </div>
    `;
  },

  /**
   * Execute the import
   * @param {string} dataStr - JSON string of data to import
   */
  async executeImport(dataStr) {
    const data = typeof dataStr === 'string' ? JSON.parse(dataStr) : dataStr;
    const mode = document.querySelector('input[name="import-mode"]:checked').value;
    const statusDiv = document.getElementById('import-status');

    statusDiv.textContent = 'Importing...';

    try {
      let stats;

      if (mode === 'replace') {
        // Confirm replacement
        if (!confirm('⚠️ This will DELETE ALL existing data and cannot be undone. Are you sure?')) {
          statusDiv.textContent = 'Import cancelled';
          return;
        }
        await DB.clearAllData();
        stats = await DB.importDatabase(data, false);
      } else if (mode === 'merge') {
        stats = await DB.importDatabase(data, true);
      } else { // add
        stats = await this.importAddOnly(data);
      }

      // Show success message
      statusDiv.innerHTML = `
        <div class="import-success">
          <h4>✅ Import Successful!</h4>
          <p><strong>Snippets:</strong> ${stats.snippets.added} added, ${stats.snippets.updated} updated, ${stats.snippets.skipped} skipped</p>
          <p><strong>Subjects:</strong> ${stats.subjects.added} added, ${stats.subjects.skipped} skipped</p>
        </div>
      `;

      UI.showToast('Import completed successfully!', 'success');

      // Refresh current view
      await App.refreshCurrentView();
      await App.populateLanguageFilter();
      await App.populateSubjectFilter();

      // Clear file input
      document.getElementById('import-file-input').value = '';
    } catch (error) {
      console.error('[ImportExport] Import execution failed:', error);
      statusDiv.textContent = '❌ Import failed: ' + error.message;
      UI.showToast('Import failed. Please try again.', 'error');
    }
  },

  /**
   * Import with add-only mode (skip duplicates)
   * @param {Object} data - Import data
   * @returns {Promise<Object>} - Import statistics
   */
  async importAddOnly(data) {
    const stats = {
      snippets: { added: 0, updated: 0, skipped: 0 },
      subjects: { added: 0, updated: 0, skipped: 0 }
    };

    // Get existing IDs
    const existing = await DB.getAllSnippets();
    const existingIds = new Set(existing.map(s => s.id));

    // Import snippets
    for (const snippet of data.snippets) {
      if (existingIds.has(snippet.id)) {
        stats.snippets.skipped++;
      } else {
        await DB.addSnippet(snippet);
        stats.snippets.added++;
      }
    }

    // Import subjects
    if (data.subjects) {
      for (const subject of data.subjects) {
        try {
          await DB.addSubject(subject);
          stats.subjects.added++;
        } catch (error) {
          stats.subjects.skipped++;
        }
      }
    }

    return stats;
  },

  /**
   * Cancel import
   */
  cancelImport() {
    const statusDiv = document.getElementById('import-status');
    statusDiv.textContent = '';
    document.getElementById('import-file-input').value = '';
  },

  /**
   * Download JSON data as file
   * @param {Object} data - Data to download
   * @param {string} filename - Filename
   */
  downloadJSON(data, filename) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100);
  },

  /**
   * Export to GitHub Gist (future feature)
   * @param {Object} data - Data to export
   * @returns {Promise<string>} - Gist URL
   */
  async exportToGist(data) {
    // This will be implemented in Stage 3
    throw new Error('GitHub Gist export not yet implemented');
  },

  /**
   * Import from GitHub Gist (future feature)
   * @param {string} gistId - Gist ID to import from
   * @returns {Promise<Object>}
   */
  async importFromGist(gistId) {
    // This will be implemented in Stage 3
    throw new Error('GitHub Gist import not yet implemented');
  },

  /**
   * Format date for filename
   * @param {Date} date - Date object
   * @returns {string}
   */
  formatDateForFilename(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}${month}${day}-${hours}${minutes}`;
  },

  /**
   * Escape HTML
   * @param {string} text - Text to escape
   * @returns {string}
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * Create backup reminder
   */
  setupBackupReminder() {
    const BACKUP_REMINDER_KEY = 'lastBackupReminder';
    const REMINDER_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7 days

    const lastReminder = localStorage.getItem(BACKUP_REMINDER_KEY);
    const now = Date.now();

    if (!lastReminder || (now - parseInt(lastReminder)) > REMINDER_INTERVAL) {
      setTimeout(() => {
        if (confirm('It\'s been a while since your last backup. Would you like to export your snippets now?')) {
          this.exportAll();
        }
        localStorage.setItem(BACKUP_REMINDER_KEY, now.toString());
      }, 5000); // Show after 5 seconds
    }
  }
};

// Setup backup reminder when module loads
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    // Check for backup reminder after 10 seconds
    setTimeout(() => ImportExport.setupBackupReminder(), 10000);
  });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ImportExport;
}