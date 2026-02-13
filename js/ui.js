/**
 * Ryana UI Module - COMPLETE VERSION
 * Sessions 1-4 Integrated
 */

const UI = {
  /**
   * Render snippets to a container
   */
  async renderSnippets(snippets, containerId) {
    const container = document.getElementById(containerId);
    
    if (snippets.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No snippets found.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    
    for (const snippet of snippets) {
      const card = await this.createSnippetCard(snippet);
      container.appendChild(card);
    }
  },

  /**
   * Create a snippet card element
   */
  async createSnippetCard(snippet) {
    const card = document.createElement('div');
    card.className = `snippet-card ${snippet.type === 'error' ? 'error-card' : ''}`;
    
    // Apply subject color using colorIndex
    if (snippet.subject) {
      try {
        const subjects = await DB.getAllSubjects();
        const subject = subjects.find(s => s.name === snippet.subject);
        if (subject && subject.colorIndex) {
          card.classList.add(`subject-${subject.colorIndex}`);
        } else {
          card.classList.add('subject-1');
        }
      } catch (error) {
        console.error('[UI] Failed to get subject color:', error);
        card.classList.add('subject-1');
      }
    } else {
      card.classList.add('subject-1');
    }

    card.innerHTML = `
      <div class="snippet-header">
        <h3 class="snippet-title">${this.escapeHtml(snippet.title)}</h3>
        <button class="favorite-btn ${snippet.favourite ? 'active' : ''}" 
                data-id="${snippet.id}"
                title="${snippet.favourite ? 'Remove from favourites' : 'Add to favourites'}">
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

    card.addEventListener('click', (e) => {
      if (!e.target.classList.contains('favorite-btn')) {
        this.showSnippetDetail(snippet);
      }
    });

    const favoriteBtn = card.querySelector('.favorite-btn');
    favoriteBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await this.toggleFavorite(snippet.id);
    });

    return card;
  },

  /**
   * Show snippet detail modal
   */
  async showSnippetDetail(snippet) {
    await DB.updateAnalytics(snippet.id, 'view');

    const modal = document.getElementById('snippet-modal');
    const modalTitle = document.getElementById('snippet-modal-title');
    const modalBody = modal.querySelector('.modal-body');

    modalTitle.textContent = snippet.title;

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
        
        ${snippet.type === 'error' && snippet.errors && snippet.errors.length > 0 ? `
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

    Prism.highlightAllUnder(modalBody);
    modal.classList.add('active');
  },

  /**
   * Show snippet editor modal
   */
  async showSnippetModal(type = 'code', snippet = null) {
    const modal = document.getElementById('snippet-modal');
    const modalTitle = document.getElementById('snippet-modal-title');
    const modalBody = modal.querySelector('.modal-body');

    const isEdit = snippet !== null;
    modalTitle.textContent = isEdit 
      ? `Edit ${type === 'error' ? 'Error Log' : 'Snippet'}` 
      : `New ${type === 'error' ? 'Error Log' : 'Snippet'}`;

    const subjects = await DB.getAllSubjects();
    const allTags = await DB.getAllTags();

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
                        placeholder="e.g., IndexError: list index out of range">${snippet && snippet.errors && snippet.errors[0] ? this.escapeHtml(snippet.errors[0].message) : ''}</textarea>
            </div>
            
            <div class="form-group">
              <label for="error-solution">Solution</label>
              <textarea id="error-solution" rows="4" 
                        placeholder="How did you fix this error?">${snippet && snippet.errors && snippet.errors[0] ? this.escapeHtml(snippet.errors[0].solution) : ''}</textarea>
            </div>
            
            <div class="form-group">
              <label for="error-links">Reference Links (one per line)</label>
              <textarea id="error-links" rows="3" 
                        placeholder="https://stackoverflow.com/...">${snippet && snippet.errors && snippet.errors[0] ? snippet.errors[0].links.join('\n') : ''}</textarea>
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
            Add to favourites
          </label>
        </div>
      </form>
    `;

    const saveBtn = modal.querySelector('#save-snippet-btn');
    saveBtn.onclick = () => this.saveSnippet(type, snippet?.id);

    modal.classList.add('active');
  },

  /**
   * Save snippet from form
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

      document.getElementById('snippet-modal').classList.remove('active');

      await App.refreshCurrentView();
      await App.populateLanguageFilter();
      await App.populateSubjectFilter();
    } catch (error) {
      console.error('[UI] Failed to save snippet:', error);
      this.showToast('Failed to save snippet', 'error');
    }
  },

  /**
   * Edit snippet
   */
  async editSnippet(id) {
    const snippet = await DB.getSnippet(id);
    if (snippet) {
      document.getElementById('snippet-modal').classList.remove('active');
      await this.showSnippetModal(snippet.type, snippet);
    }
  },

  /**
   * Delete snippet
   */
  async deleteSnippet(id) {
    if (!confirm('Are you sure you want to delete this snippet? This cannot be undone.')) {
      return;
    }

    try {
      await DB.deleteSnippet(id);
      this.showToast('Snippet deleted', 'success');
      
      document.getElementById('snippet-modal').classList.remove('active');
      
      await App.refreshCurrentView();
    } catch (error) {
      console.error('[UI] Failed to delete snippet:', error);
      this.showToast('Failed to delete snippet', 'error');
    }
  },

  /**
   * Toggle favorite
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
   */
  renderSubjects(subjects) {
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
  },

  /**
   * Create subject card with counts
   */
  createSubjectCardWithCounts(subject) {
    const card = document.createElement('div');
    card.className = `subject-card subject-${subject.colorIndex || 1}`;

    card.innerHTML = `
      <h3 class="subject-name">${this.escapeHtml(subject.name)}</h3>
      ${subject.description ? `<p class="subject-description">${this.escapeHtml(subject.description)}</p>` : ''}
      <div class="subject-stats">
        <span>Year ${subject.year}</span>
        <span>Semester ${subject.semester}</span>
      </div>
      
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

    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('count-snippets') || 
          e.target.classList.contains('count-errors')) {
        return;
      }
      this.editSubject(subject);
    });

    const snippetCount = card.querySelector('.count-snippets');
    snippetCount.addEventListener('click', (e) => {
      e.stopPropagation();
      if (subject.snippetCount > 0) {
        App.state.filters.subject = subject.name;
        document.getElementById('subject-filter').value = subject.name;
        App.switchView('snippets');
      }
    });

    const errorCount = card.querySelector('.count-errors');
    errorCount.addEventListener('click', (e) => {
      e.stopPropagation();
      if (subject.errorCount > 0) {
        App.state.filters.subject = subject.name;
        document.getElementById('subject-filter').value = subject.name;
        App.switchView('errors');
      }
    });

    return card;
  },

  /**
   * Edit subject
   */
  editSubject(subject) {
    this.showSubjectModal(subject);
  },

  /**
   * Show subject modal
   */
  showSubjectModal(subject = null) {
    let modal = document.getElementById('subject-modal');
    if (!modal) {
      modal = this.createSubjectModal();
    }
    
    const modalTitle = modal.querySelector('.modal-header h2');
    const modalBody = modal.querySelector('.modal-body');
    
    const isEdit = subject !== null;
    modalTitle.textContent = isEdit ? 'Edit Subject' : 'Add Subject';

    const colors = [
      { index: 1, name: 'Ink Black', hsl: 'hsl(197, 100%, 5%)' },
      { index: 2, name: 'Dark Teal', hsl: 'hsl(190, 100%, 23%)' },
      { index: 3, name: 'Dark Cyan', hsl: 'hsl(181, 88%, 31%)' },
      { index: 4, name: 'Pearl Aqua', hsl: 'hsl(160, 41%, 70%)' },
      { index: 5, name: 'Vanilla Custard', hsl: 'hsl(45, 60%, 78%)' },
      { index: 6, name: 'Golden Orange', hsl: 'hsl(39, 100%, 47%)' },
      { index: 7, name: 'Burnt Caramel', hsl: 'hsl(30, 98%, 40%)' },
      { index: 8, name: 'Rusty Spice', hsl: 'hsl(19, 97%, 37%)' },
      { index: 9, name: 'Oxidized Iron', hsl: 'hsl(5, 81%, 38%)' },
      { index: 10, name: 'Brown Red', hsl: 'hsl(358, 64%, 37%)' }
    ];

    const selectedColorIndex = subject?.colorIndex || 1;

    modalBody.innerHTML = `
      <form id="subject-form" class="subject-modal-form">
        <div class="form-group">
          <label for="subject-name">Subject Name *</label>
          <input 
            type="text" 
            id="subject-name" 
            required 
            value="${subject ? this.escapeHtml(subject.name) : ''}"
            placeholder="e.g., Introduction to Programming"
          >
        </div>

        <div class="form-group">
          <label for="subject-description">Description</label>
          <textarea 
            id="subject-description" 
            rows="3" 
            placeholder="Brief description of the subject"
          >${subject ? this.escapeHtml(subject.description) : ''}</textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="subject-year">Year</label>
            <select id="subject-year">
              <option value="1" ${subject?.year === 1 ? 'selected' : ''}>Year 1</option>
              <option value="2" ${subject?.year === 2 ? 'selected' : ''}>Year 2</option>
              <option value="3" ${subject?.year === 3 ? 'selected' : ''}>Year 3</option>
              <option value="4" ${subject?.year === 4 ? 'selected' : ''}>Year 4</option>
            </select>
          </div>

          <div class="form-group">
            <label for="subject-semester">Semester</label>
            <select id="subject-semester">
              <option value="1" ${subject?.semester === 1 ? 'selected' : ''}>Semester 1</option>
              <option value="2" ${subject?.semester === 2 ? 'selected' : ''}>Semester 2</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>Colour</label>
          <div class="color-picker-grid">
            ${colors.map(color => `
              <div 
                class="color-swatch ${color.index === selectedColorIndex ? 'selected' : ''}" 
                data-color-index="${color.index}"
                style="background: ${color.hsl}"
                title="${color.name}"
              >
                ${color.index === selectedColorIndex ? '<span class="check-mark">✓</span>' : ''}
              </div>
            `).join('')}
          </div>
          <input type="hidden" id="subject-color-index" value="${selectedColorIndex}">
        </div>

        ${isEdit ? `
          <div class="form-group">
            <button type="button" class="btn btn-danger" id="delete-subject-btn">
              🗑️ Delete Subject
            </button>
          </div>
        ` : ''}
      </form>
    `;

    modal.querySelectorAll('.color-swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        modal.querySelectorAll('.color-swatch').forEach(s => {
          s.classList.remove('selected');
          s.innerHTML = '';
        });
        
        swatch.classList.add('selected');
        swatch.innerHTML = '<span class="check-mark">✓</span>';
        
        document.getElementById('subject-color-index').value = swatch.dataset.colorIndex;
      });
    });

    const saveBtn = modal.querySelector('#save-subject-btn');
    saveBtn.onclick = () => this.saveSubject(subject?.id);

    if (isEdit) {
      const deleteBtn = modal.querySelector('#delete-subject-btn');
      deleteBtn.onclick = () => this.deleteSubjectConfirm(subject.id);
    }

    modal.classList.add('active');
  },

  /**
   * Create subject modal
   */
  createSubjectModal() {
    const modal = document.createElement('div');
    modal.id = 'subject-modal';
    modal.className = 'modal';
    
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Add Subject</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body"></div>
        <div class="modal-footer">
          <button id="save-subject-btn" class="btn btn-primary">Save Subject</button>
          <button class="btn btn-secondary modal-close">Cancel</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.modal-close').addEventListener('click', () => {
      modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });

    return modal;
  },

  /**
   * Save subject
   */
  async saveSubject(editId = null) {
    const form = document.getElementById('subject-form');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const subjectData = {
      name: document.getElementById('subject-name').value.trim(),
      description: document.getElementById('subject-description').value.trim(),
      year: parseInt(document.getElementById('subject-year').value),
      semester: parseInt(document.getElementById('subject-semester').value),
      colorIndex: parseInt(document.getElementById('subject-color-index').value)
    };

    try {
      if (editId) {
        await DB.updateSubject(editId, subjectData);
        this.showToast('Subject updated successfully!', 'success');
      } else {
        await DB.addSubject(subjectData);
        this.showToast('Subject created successfully!', 'success');
      }

      document.getElementById('subject-modal').classList.remove('active');

      await App.loadSubjects();
      await App.populateSubjectFilter();
    } catch (error) {
      console.error('[UI] Failed to save subject:', error);
      this.showToast('Failed to save subject', 'error');
    }
  },

  /**
   * Delete subject
   */
  async deleteSubjectConfirm(subjectId) {
    if (!confirm('Are you sure you want to delete this subject? Snippets will not be deleted, but will lose their subject assignment.')) {
      return;
    }

    try {
      await DB.deleteSubject(subjectId);
      this.showToast('Subject deleted', 'success');
      
      document.getElementById('subject-modal').classList.remove('active');
      
      await App.loadSubjects();
      await App.populateSubjectFilter();
    } catch (error) {
      console.error('[UI] Failed to delete subject:', error);
      this.showToast('Failed to delete subject', 'error');
    }
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
    
    App.state.theme = updates.theme;
    document.documentElement.setAttribute('data-theme', updates.theme);
    App.updateThemeIcon();

    this.showToast('Settings saved!', 'success');
    document.getElementById('settings-modal').classList.remove('active');
  },

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  /**
   * Show toast with action
   */
  showToastWithAction(message, type = 'info', action) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} toast-clickable`;
    toast.style.cursor = 'pointer';
    toast.textContent = message;

    if (action) {
      toast.addEventListener('click', () => {
        action();
        toast.remove();
      });
    }

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 8000);
  },

  /**
   * Show update notification
   */
  showUpdateNotification(updateCallback) {
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
      <div class="update-content">
        <strong>🎉 New version available!</strong>
        <p>Click to update Ryana to the latest version.</p>
        <button class="btn btn-primary btn-small" id="update-now-btn">Update Now</button>
        <button class="btn btn-secondary btn-small" id="update-later-btn">Later</button>
      </div>
    `;

    document.body.appendChild(notification);

    document.getElementById('update-now-btn').addEventListener('click', () => {
      updateCallback();
    });

    document.getElementById('update-later-btn').addEventListener('click', () => {
      notification.remove();
    });
  },

  /**
   * Load SVG icons
   */
  async loadSVGIcons() {
    const icons = {
      'home': './assets/icons/nav/home.svg',
      'snippets': './assets/icons/nav/snippets.svg',
      'favourites': './assets/icons/nav/favourites.svg',
      'errors': './assets/icons/nav/errors.svg',
      'subjects': './assets/icons/nav/subjects.svg',
      'import-export': './assets/icons/nav/import-export.svg'
    };

    for (const [name, path] of Object.entries(icons)) {
      try {
        const response = await fetch(path);
        const svgText = await response.text();
        
        const container = document.createElement('div');
        container.innerHTML = svgText.trim();
        const svg = container.firstChild;
        
        svg.setAttribute('width', '24');
        svg.setAttribute('height', '24');
        svg.classList.add('nav-svg-icon');
        
        const iconElement = document.getElementById(`icon-${name}`);
        if (iconElement) {
          iconElement.innerHTML = '';
          iconElement.appendChild(svg);
        }
      } catch (error) {
        console.error(`[UI] Failed to load icon: ${name}`, error);
      }
    }
  },

  /**
   * Escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * Format date
   */
  formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) {
      const mins = Math.floor(diff / 60000);
      return `${mins} minute${mins > 1 ? 's' : ''} ago`;
    }
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
    
    return date.toLocaleDateString();
  }
};