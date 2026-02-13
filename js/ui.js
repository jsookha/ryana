/**
 * Ryana UI Module
 * Handles all UI rendering and user interactions
 * Version: 1.0.0
 */

const UI = {
  /**
   * Render snippets to a container
   * @param {Array} snippets - Array of snippet objects
   * @param {string} containerId - ID of container element
   */
  renderSnippets(snippets, containerId) {
    const container = document.getElementById(containerId);
    
    if (snippets.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No snippets found. Create your first one!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    snippets.forEach(snippet => {
      const card = this.createSnippetCard(snippet);
      container.appendChild(card);
    });
  },

  /**
   * Create a snippet card element
   * @param {Object} snippet - Snippet object
   * @returns {HTMLElement}
   */
  createSnippetCard(snippet) {
    const card = document.createElement('div');
    card.className = `snippet-card ${snippet.type === 'error' ? 'error-card' : ''}`;
    
    // Apply subject color if available
    if (snippet.subject) {
      const subjectClass = this.getSubjectClass(snippet.subject);
      card.classList.add(subjectClass);
    }

    // Create card content
    card.innerHTML = `
      <div class="snippet-header">
        <h3 class="snippet-title">${this.escapeHtml(snippet.title)}</h3>
        <button class="favorite-btn ${snippet.favourite ? 'active' : ''}" 
                data-id="${snippet.id}"
                title="${snippet.favourite ? 'Remove from favorites' : 'Add to favorites'}">
          ${snippet.favourite ? '⭐' : '☆'}
        </button>
      </div>
      
      <div class="snippet-meta">
        <span class="snippet-language">${this.escapeHtml(snippet.language)}</span>
        ${snippet.subject ? `<span class="snippet-subject">${this.escapeHtml(snippet.subject)}</span>` : ''}
      </div>
      
      ${snippet.description ? `
        <p class="snippet-description">${this.escapeHtml(snippet.description)}</p>
      ` : ''}
      
      ${snippet.tags.length > 0 ? `
        <div class="snippet-tags">
          ${snippet.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
        </div>
      ` : ''}
      
      <div class="snippet-footer">
        <span>${this.formatDate(snippet.updatedAt)}</span>
        <span>
          👁️ ${snippet.analytics?.timesViewed || 0} • 
          📋 ${snippet.analytics?.timesCopied || 0}
        </span>
      </div>
    `;

    // Add click handlers
    card.addEventListener('click', (e) => {
      if (!e.target.classList.contains('favorite-btn')) {
        this.showSnippetDetail(snippet);
      }
    });

    // Favorite button handler
    const favoriteBtn = card.querySelector('.favorite-btn');
    favoriteBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await this.toggleFavorite(snippet.id);
    });

    return card;
  },

  /**
   * Show snippet detail modal
   * @param {Object} snippet - Snippet object
   */
  async showSnippetDetail(snippet) {
    // Track view
    await DB.updateAnalytics(snippet.id, 'view');

    const modal = document.getElementById('snippet-modal');
    const modalTitle = document.getElementById('snippet-modal-title');
    const modalBody = modal.querySelector('.modal-body');

    modalTitle.textContent = snippet.title;

    // Create detail view
    modalBody.innerHTML = `
      <div class="snippet-detail">
        <div class="detail-meta">
          <span class="snippet-language">${this.escapeHtml(snippet.language)}</span>
          ${snippet.subject ? `<span class="snippet-subject">${this.escapeHtml(snippet.subject)}</span>` : ''}
          ${snippet.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
        </div>
        
        ${snippet.description ? `
          <div class="detail-description">
            <h4>Description</h4>
            <p>${this.escapeHtml(snippet.description)}</p>
          </div>
        ` : ''}
        
        <div class="detail-code">
          <div class="code-header">
            <h4>Code</h4>
            <button class="btn btn-small" onclick="UI.copyCode('${snippet.id}')">
              📋 Copy Code
            </button>
          </div>
          <pre><code class="language-${snippet.language}">${this.escapeHtml(snippet.code)}</code></pre>
        </div>
        
        ${snippet.type === 'error' && snippet.errors.length > 0 ? `
          <div class="detail-errors">
            <h4>Error Information</h4>
            ${snippet.errors.map(error => `
              <div class="error-info">
                <div class="error-message">${this.escapeHtml(error.message)}</div>
                ${error.solution ? `
                  <div class="error-solution">
                    <strong>Solution:</strong> ${this.escapeHtml(error.solution)}
                  </div>
                ` : ''}
                ${error.links && error.links.length > 0 ? `
                  <div class="error-links">
                    <strong>References:</strong>
                    <ul>
                      ${error.links.map(link => `<li><a href="${link}" target="_blank">${link}</a></li>`).join('')}
                    </ul>
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        ${snippet.usage && (snippet.usage.when || snippet.usage.where || snippet.usage.how) ? `
          <div class="detail-usage">
            <h4>Usage Information</h4>
            ${snippet.usage.when ? `<p><strong>When:</strong> ${this.escapeHtml(snippet.usage.when)}</p>` : ''}
            ${snippet.usage.where ? `<p><strong>Where:</strong> ${this.escapeHtml(snippet.usage.where)}</p>` : ''}
            ${snippet.usage.how ? `<p><strong>How:</strong> ${this.escapeHtml(snippet.usage.how)}</p>` : ''}
          </div>
        ` : ''}
        
        <div class="detail-actions">
          <button class="btn btn-primary" onclick="UI.editSnippet('${snippet.id}')">✏️ Edit</button>
          <button class="btn btn-secondary" onclick="UI.deleteSnippet('${snippet.id}')">🗑️ Delete</button>
        </div>
      </div>
    `;

    // Highlight code
    Prism.highlightAllUnder(modalBody);

    // Show modal
    modal.classList.add('active');
  },

  /**
   * Show snippet editor modal
   * @param {string} type - 'code' or 'error'
   * @param {Object} snippet - Existing snippet to edit (optional)
   */
  async showSnippetModal(type = 'code', snippet = null) {
    const modal = document.getElementById('snippet-modal');
    const modalTitle = document.getElementById('snippet-modal-title');
    const modalBody = modal.querySelector('.modal-body');

    const isEdit = snippet !== null;
    modalTitle.textContent = isEdit 
      ? `Edit ${type === 'error' ? 'Error Log' : 'Snippet'}` 
      : `New ${type === 'error' ? 'Error Log' : 'Snippet'}`;

    // Get subjects and tags for dropdowns
    const subjects = await DB.getAllSubjects();
    const allTags = await DB.getAllTags();

    // Create form
    modalBody.innerHTML = `
      <form id="snippet-form" class="snippet-form">
        <div class="form-group">
          <label for="snippet-title">Title *</label>
          <input type="text" id="snippet-title" required 
                 value="${snippet ? this.escapeHtml(snippet.title) : ''}"
                 placeholder="e.g., Bubble Sort Algorithm">
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="snippet-language">Language *</label>
            <input type="text" id="snippet-language" required 
                   value="${snippet ? this.escapeHtml(snippet.language) : ''}"
                   placeholder="e.g., python, javascript">
          </div>
          
          <div class="form-group">
            <label for="snippet-subject">Subject</label>
            <select id="snippet-subject">
              <option value="">Select subject...</option>
              ${subjects.map(s => `
                <option value="${s.name}" ${snippet && snippet.subject === s.name ? 'selected' : ''}>
                  ${this.escapeHtml(s.name)}
                </option>
              `).join('')}
            </select>
          </div>
        </div>
        
        <div class="form-group">
          <label for="snippet-description">Description</label>
          <textarea id="snippet-description" rows="3" 
                    placeholder="What does this code do?">${snippet ? this.escapeHtml(snippet.description) : ''}</textarea>
        </div>
        
        <div class="form-group">
          <label for="snippet-tags">Tags (comma-separated)</label>
          <input type="text" id="snippet-tags" 
                 value="${snippet ? snippet.tags.join(', ') : ''}"
                 placeholder="e.g., sorting, beginner, arrays">
          <small>Suggestions: ${allTags.slice(0, 5).map(t => t.name).join(', ')}</small>
        </div>
        
        <div class="form-group">
          <label for="snippet-code">Code *</label>
          <textarea id="snippet-code" rows="10" required 
                    placeholder="Paste your code here...">${snippet ? this.escapeHtml(snippet.code) : ''}</textarea>
        </div>
        
        ${type === 'error' ? `
          <div class="error-fields">
            <h4>Error Information</h4>
            
            <div class="form-group">
              <label for="error-message">Error Message</label>
              <textarea id="error-message" rows="3" 
                        placeholder="e.g., IndexError: list index out of range">${snippet && snippet.errors[0] ? this.escapeHtml(snippet.errors[0].message) : ''}</textarea>
            </div>
            
            <div class="form-group">
              <label for="error-solution">Solution</label>
              <textarea id="error-solution" rows="4" 
                        placeholder="How did you fix this error?">${snippet && snippet.errors[0] ? this.escapeHtml(snippet.errors[0].solution) : ''}</textarea>
            </div>
            
            <div class="form-group">
              <label for="error-links">Reference Links (one per line)</label>
              <textarea id="error-links" rows="3" 
                        placeholder="https://stackoverflow.com/...">${snippet && snippet.errors[0] ? snippet.errors[0].links.join('\n') : ''}</textarea>
            </div>
          </div>
        ` : ''}
        
        <details class="usage-section">
          <summary>Usage Information (Optional)</summary>
          <div class="form-group">
            <label for="usage-when">When to use this?</label>
            <input type="text" id="usage-when" 
                   value="${snippet?.usage?.when || ''}"
                   placeholder="e.g., When sorting small arrays">
          </div>
          <div class="form-group">
            <label for="usage-where">Where does it apply?</label>
            <input type="text" id="usage-where" 
                   value="${snippet?.usage?.where || ''}"
                   placeholder="e.g., Algorithms class, sorting problems">
          </div>
          <div class="form-group">
            <label for="usage-how">How to implement?</label>
            <input type="text" id="usage-how" 
                   value="${snippet?.usage?.how || ''}"
                   placeholder="e.g., Pass unsorted array, returns sorted">
          </div>
        </details>
        
        <div class="form-group">
          <label>
            <input type="checkbox" id="snippet-favorite" 
                   ${snippet?.favourite ? 'checked' : ''}>
            Add to favorites
          </label>
        </div>
      </form>
    `;

    // Setup save button
    const saveBtn = modal.querySelector('#save-snippet-btn');
    saveBtn.onclick = () => this.saveSnippet(type, snippet?.id);

    modal.classList.add('active');
  },

  /**
   * Save snippet from form
   * @param {string} type - 'code' or 'error'
   * @param {string} editId - ID if editing existing snippet
   */
  async saveSnippet(type, editId = null) {
    const form = document.getElementById('snippet-form');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const snippetData = {
      title: document.getElementById('snippet-title').value.trim(),
      language: document.getElementById('snippet-language').value.trim().toLowerCase(),
      subject: document.getElementById('snippet-subject').value,
      description: document.getElementById('snippet-description').value.trim(),
      tags: document.getElementById('snippet-tags').value
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0),
      code: document.getElementById('snippet-code').value.trim(),
      type: type,
      favourite: document.getElementById('snippet-favorite').checked,
      usage: {
        when: document.getElementById('usage-when')?.value.trim() || '',
        where: document.getElementById('usage-where')?.value.trim() || '',
        how: document.getElementById('usage-how')?.value.trim() || ''
      }
    };

    if (type === 'error') {
      const errorMessage = document.getElementById('error-message')?.value.trim();
      const errorSolution = document.getElementById('error-solution')?.value.trim();
      const errorLinks = document.getElementById('error-links')?.value
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0);

      snippetData.errors = [{
        message: errorMessage || '',
        solution: errorSolution || '',
        links: errorLinks,
        createdAt: Date.now()
      }];
    }

    try {
      if (editId) {
        await DB.updateSnippet(editId, snippetData);
        this.showToast('Snippet updated successfully!', 'success');
      } else {
        await DB.addSnippet(snippetData);
        this.showToast('Snippet created successfully!', 'success');
      }

      // Close modal
      document.getElementById('snippet-modal').classList.remove('active');

      // Refresh view
      await App.refreshCurrentView();
      
      // Update filters
      await App.populateLanguageFilter();
      await App.populateSubjectFilter();
    } catch (error) {
      console.error('[UI] Failed to save snippet:', error);
      this.showToast('Failed to save snippet', 'error');
    }
  },

  /**
   * Edit snippet
   * @param {string} id - Snippet ID
   */
  async editSnippet(id) {
    const snippet = await DB.getSnippet(id);
    if (snippet) {
      document.getElementById('snippet-modal').classList.remove('active');
      await this.showSnippetModal(snippet.type, snippet);
    }
  },

  /**
   * Delete snippet with confirmation
   * @param {string} id - Snippet ID
   */
  async deleteSnippet(id) {
    if (!confirm('Are you sure you want to delete this snippet? This cannot be undone.')) {
      return;
    }

    try {
      await DB.deleteSnippet(id);
      this.showToast('Snippet deleted', 'success');
      
      // Close modal
      document.getElementById('snippet-modal').classList.remove('active');
      
      // Refresh view
      await App.refreshCurrentView();
    } catch (error) {
      console.error('[UI] Failed to delete snippet:', error);
      this.showToast('Failed to delete snippet', 'error');
    }
  },

  /**
   * Toggle favorite status
   * @param {string} id - Snippet ID
   */
  async toggleFavorite(id) {
    try {
      const snippet = await DB.getSnippet(id);
      await DB.updateSnippet(id, { favourite: !snippet.favourite });
      await App.refreshCurrentView();
    } catch (error) {
      console.error('[UI] Failed to toggle favorite:', error);
    }
  },

  /**
   * Copy code to clipboard
   * @param {string} id - Snippet ID
   */
  async copyCode(id) {
    try {
      const snippet = await DB.getSnippet(id);
      await navigator.clipboard.writeText(snippet.code);
      await DB.updateAnalytics(id, 'copy');
      this.showToast('Code copied to clipboard!', 'success');
    } catch (error) {
      console.error('[UI] Failed to copy code:', error);
      this.showToast('Failed to copy code', 'error');
    }
  },

  /**
   * Render subjects
   * @param {Array} subjects - Array of subject objects
   */
  renderSubjects(subjects) {
    const container = document.getElementById('subjects-grid');
    
    if (subjects.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No subjects created. Add your courses to organize snippets!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    subjects.forEach(subject => {
      const card = this.createSubjectCard(subject);
      container.appendChild(card);
    });
  },

  /**
   * Create subject card
   * @param {Object} subject - Subject object
   * @returns {HTMLElement}
   */
  createSubjectCard(subject) {
    const card = document.createElement('div');
    card.className = `subject-card ${this.getSubjectClass(subject.name)}`;

    card.innerHTML = `
      <h3 class="subject-name">${this.escapeHtml(subject.name)}</h3>
      ${subject.description ? `<p class="subject-description">${this.escapeHtml(subject.description)}</p>` : ''}
      <div class="subject-stats">
        <span>Year ${subject.year}</span>
        <span>Semester ${subject.semester}</span>
      </div>
      <div class="subject-color-preview"></div>
    `;

    card.addEventListener('click', () => this.editSubject(subject));

    return card;
  },

  /**
   * Show subject modal
   * @param {Object} subject - Existing subject to edit (optional)
   */
  showSubjectModal(subject = null) {
    // Implementation similar to snippet modal
    // For now, show a simple prompt
    const name = prompt('Subject name:', subject?.name || '');
    if (!name) return;

    const description = prompt('Description (optional):', subject?.description || '');
    const year = parseInt(prompt('Year:', subject?.year || '1'));
    const semester = parseInt(prompt('Semester:', subject?.semester || '1'));

    const subjectData = {
      name,
      description,
      year,
      semester
    };

    if (subject) {
      DB.updateSubject(subject.id, subjectData)
        .then(() => {
          this.showToast('Subject updated!', 'success');
          App.loadSubjects();
        });
    } else {
      DB.addSubject(subjectData)
        .then(() => {
          this.showToast('Subject created!', 'success');
          App.loadSubjects();
          App.populateSubjectFilter();
        });
    }
  },

  /**
   * Edit subject
   * @param {Object} subject - Subject object
   */
  editSubject(subject) {
    this.showSubjectModal(subject);
  },

  /**
   * Show settings modal
   */
  async showSettingsModal() {
    const modal = document.getElementById('settings-modal');
    const modalBody = modal.querySelector('.modal-body');
    const settings = await DB.getSettings();

    modalBody.innerHTML = `
      <div class="settings-form">
        <h3>Appearance</h3>
        <div class="form-group">
          <label>
            <input type="checkbox" id="setting-dark-theme" ${settings.theme === 'dark' ? 'checked' : ''}>
            Dark Theme
          </label>
        </div>
        
        <h3>Editor</h3>
        <div class="form-group">
          <label for="setting-default-language">Default Language</label>
          <input type="text" id="setting-default-language" value="${settings.defaultLanguage}">
        </div>
        
        <div class="form-group">
          <label>
            <input type="checkbox" id="setting-auto-save" ${settings.autoSave ? 'checked' : ''}>
            Auto-save snippets
          </label>
        </div>
        
        <div class="form-group">
          <label>
            <input type="checkbox" id="setting-shortcuts" ${settings.keyboardShortcuts ? 'checked' : ''}>
            Enable keyboard shortcuts
          </label>
        </div>
        
        <button class="btn btn-primary" onclick="UI.saveSettings()">Save Settings</button>
      </div>
    `;

    modal.classList.add('active');
  },

  /**
   * Save settings
   */
  async saveSettings() {
    const updates = {
      theme: document.getElementById('setting-dark-theme').checked ? 'dark' : 'light',
      defaultLanguage: document.getElementById('setting-default-language').value,
      autoSave: document.getElementById('setting-auto-save').checked,
      keyboardShortcuts: document.getElementById('setting-shortcuts').checked
    };

    await DB.updateSettings(updates);
    
    // Apply theme immediately
    App.state.theme = updates.theme;
    document.documentElement.setAttribute('data-theme', updates.theme);
    App.updateThemeIcon();

    this.showToast('Settings saved!', 'success');
    document.getElementById('settings-modal').classList.remove('active');
  },

  /**
   * Show toast notification
   * @param {string} message - Message to show
   * @param {string} type - 'success', 'error', 'info'
   */
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  /**
   * Get subject CSS class from subject name
   * @param {string} subjectName - Subject name
   * @returns {string}
   */
  getSubjectClass(subjectName) {
    return 'subject-' + subjectName.toLowerCase().replace(/\s+/g, '-');
  },

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string}
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * Format timestamp to readable date
   * @param {number} timestamp - Unix timestamp
   * @returns {string}
   */
  formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    // Less than 1 minute
    if (diff < 60000) return 'Just now';
    
    // Less than 1 hour
    if (diff < 3600000) {
      const mins = Math.floor(diff / 60000);
      return `${mins} minute${mins > 1 ? 's' : ''} ago`;
    }
    
    // Less than 1 day
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    
    // Less than 1 week
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
    
    // Format as date
    return date.toLocaleDateString();
  }
};

/**
 * ADD THESE FUNCTIONS TO YOUR EXISTING ui.js FILE
 * These enhance the UI with new capabilities
 */

// ==========================================================================
// ADD THIS FUNCTION - Toast with Action Button
// ==========================================================================

/**
 * Show toast notification with clickable action
 * @param {string} message - Message to show
 * @param {string} type - 'success', 'error', 'info'
 * @param {Function} action - Function to call when clicked
 */
UI.showToastWithAction = function(message, type = 'info', action) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type} toast-clickable`;
  toast.style.cursor = 'pointer';
  toast.textContent = message;

  // Add click handler
  if (action) {
    toast.addEventListener('click', () => {
      action();
      toast.remove();
    });
  }

  container.appendChild(toast);

  // Auto-remove after 8 seconds (longer than normal toasts)
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 8000);
};

// ==========================================================================
// REPLACE YOUR renderSubjects FUNCTION WITH THIS UPDATED VERSION
// ==========================================================================

/**
 * Render subjects with snippet/error counts
 * @param {Array} subjects - Array of subject objects with counts
 */
UI.renderSubjects = function(subjects) {
  const container = document.getElementById('subjects-grid');
  
  if (subjects.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No subjects created. Add your courses to organise snippets!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  subjects.forEach(subject => {
    const card = this.createSubjectCardWithCounts(subject);
    container.appendChild(card);
  });
};

/**
 * Create subject card with snippet/error counts
 * @param {Object} subject - Subject object with counts
 * @returns {HTMLElement}
 */
UI.createSubjectCardWithCounts = function(subject) {
  const card = document.createElement('div');
  card.className = `subject-card subject-${subject.colorIndex || 1}`;

  card.innerHTML = `
    <h3 class="subject-name">${this.escapeHtml(subject.name)}</h3>
    ${subject.description ? `<p class="subject-description">${this.escapeHtml(subject.description)}</p>` : ''}
    <div class="subject-stats">
      <span>Year ${subject.year}</span>
      <span>Semester ${subject.semester}</span>
    </div>
    
    <!-- NEW: Snippet/Error counts -->
    <div class="subject-snippet-count">
      <span class="count-snippets" data-subject="${this.escapeHtml(subject.name)}">
        📝 ${subject.snippetCount || 0} Snippet${subject.snippetCount !== 1 ? 's' : ''}
      </span>
      <span class="count-errors" data-subject="${this.escapeHtml(subject.name)}">
        🐛 ${subject.errorCount || 0} Error${subject.errorCount !== 1 ? 's' : ''}
      </span>
    </div>
    
    <div class="subject-color-preview"></div>
  `;

  // Click card to edit
  card.addEventListener('click', (e) => {
    // Don't trigger if clicking on counts
    if (e.target.classList.contains('count-snippets') || 
        e.target.classList.contains('count-errors')) {
      return;
    }
    this.editSubject(subject);
  });

  // Click snippet count to filter
  const snippetCount = card.querySelector('.count-snippets');
  snippetCount.addEventListener('click', (e) => {
    e.stopPropagation();
    if (subject.snippetCount > 0) {
      // Switch to snippets view with subject filter
      App.state.filters.subject = subject.name;
      document.getElementById('subject-filter').value = subject.name;
      App.switchView('snippets');
    }
  });

  // Click error count to filter
  const errorCount = card.querySelector('.count-errors');
  errorCount.addEventListener('click', (e) => {
    e.stopPropagation();
    if (subject.errorCount > 0) {
      // Switch to errors view with subject filter
      App.state.filters.subject = subject.name;
      document.getElementById('subject-filter').value = subject.name;
      App.switchView('errors');
    }
  });

  return card;
};

