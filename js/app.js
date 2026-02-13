/**
 * Ryana Main Application Controller - Version 3.0
 * Added: Home view, smart search, cross-view awareness
 */

const App = {
  // Application state
  state: {
    currentView: 'home', // Default to home view
    selectedSnippets: new Set(),
    filters: {
      language: '',
      subject: '',
      sortBy: 'updated'
    },
    searchQuery: '',
    theme: 'light'
  },

  /**
   * Initialize the application
   */
  async init() {
    console.log('[App] Initializing Ryana...');

    try {
      await this.waitForDatabase();
      await this.loadSettings();
      this.setupEventListeners();
      this.setupKeyboardShortcuts();
      await this.loadInitialData();
      this.showApp();

      console.log('[App] Ryana initialized successfully');
    } catch (error) {
      console.error('[App] Initialization failed:', error);
      this.showError('Failed to initialize application. Please refresh the page.');
    }
  },

  /**
   * Wait for database to be ready
   */
  async waitForDatabase() {
    let attempts = 0;
    while (!db && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    if (!db) {
      throw new Error('Database failed to initialize');
    }
  },

  /**
   * Load settings and apply theme
   */
  async loadSettings() {
    try {
      const settings = await DB.getSettings();
      this.state.theme = settings.theme || 'light';
      document.documentElement.setAttribute('data-theme', this.state.theme);
      this.updateThemeIcon();
    } catch (error) {
      console.error('[App] Failed to load settings:', error);
    }
  },

  /**
   * Setup all event listeners
   */
  setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.currentTarget.getAttribute('data-view');
        this.switchView(view);
      });
    });

    // Theme toggle
    document.getElementById('theme-toggle').addEventListener('click', () => {
      this.toggleTheme();
    });

    // Settings button
    document.getElementById('settings-btn').addEventListener('click', () => {
      UI.showSettingsModal();
    });

    // Quick action buttons
    document.getElementById('new-snippet-btn').addEventListener('click', () => {
      UI.showSnippetModal();
    });

    document.getElementById('new-error-btn').addEventListener('click', () => {
      UI.showSnippetModal('error');
    });

    document.getElementById('new-subject-btn').addEventListener('click', () => {
      UI.showSubjectModal();
    });

    // Search
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => {
      this.handleSearch(e.target.value);
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        this.handleSearch('');
      }
    });

    // Clear search button
    document.getElementById('clear-search').addEventListener('click', () => {
      searchInput.value = '';
      this.handleSearch('');
    });

    // Filters
    document.getElementById('language-filter').addEventListener('change', (e) => {
      this.state.filters.language = e.target.value;
      this.refreshCurrentView();
    });

    document.getElementById('subject-filter').addEventListener('change', (e) => {
      this.state.filters.subject = e.target.value;
      this.refreshCurrentView();
    });

    document.getElementById('sort-by').addEventListener('change', (e) => {
      this.state.filters.sortBy = e.target.value;
      this.refreshCurrentView();
    });

    // Import/Export
    document.getElementById('export-all-btn').addEventListener('click', () => {
      ImportExport.exportAll();
    });

    document.getElementById('export-selected-btn').addEventListener('click', () => {
      ImportExport.exportSelected(Array.from(this.state.selectedSnippets));
    });

    document.getElementById('import-btn').addEventListener('click', () => {
      document.getElementById('import-file-input').click();
    });

    document.getElementById('import-file-input').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        ImportExport.importFile(file);
      }
    });

    // Modal close handlers
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        if (modal) {
          modal.classList.remove('active');
        }
      });
    });

    // Close modal on background click
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
    });
  },

  /**
   * Setup keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      const isTyping = e.target.tagName === 'INPUT' || 
                       e.target.tagName === 'TEXTAREA' ||
                       e.target.isContentEditable;

      // Ctrl+K - Focus search
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        document.getElementById('search-input').focus();
      }

      // Ctrl+N - New snippet
      if (e.ctrlKey && e.key === 'n' && !isTyping) {
        e.preventDefault();
        UI.showSnippetModal();
      }

      // Ctrl+E - New error log
      if (e.ctrlKey && e.key === 'e' && !isTyping) {
        e.preventDefault();
        UI.showSnippetModal('error');
      }

      // Ctrl+H - Home view
      if (e.ctrlKey && e.key === 'h' && !isTyping) {
        e.preventDefault();
        this.switchView('home');
      }

      // Ctrl+F - Toggle favourites view
      if (e.ctrlKey && e.key === 'f' && !isTyping) {
        e.preventDefault();
        this.switchView('favourites');
      }

      // Escape - Clear search if search is focused
      if (e.key === 'Escape' && e.target.id === 'search-input') {
        e.target.blur();
      }
    });
  },

  /**
   * Load initial data and populate UI
   */
  async loadInitialData() {
    try {
      await this.populateSubjectFilter();
      await this.populateLanguageFilter();
      await this.refreshCurrentView();
    } catch (error) {
      console.error('[App] Failed to load initial data:', error);
    }
  },

  /**
   * Populate subject filter dropdown
   */
  async populateSubjectFilter() {
    try {
      const subjects = await DB.getAllSubjects();
      const subjectFilter = document.getElementById('subject-filter');
      
      subjectFilter.innerHTML = '<option value="">All Subjects</option>';
      
      subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject.name;
        option.textContent = subject.name;
        subjectFilter.appendChild(option);
      });
    } catch (error) {
      console.error('[App] Failed to populate subject filter:', error);
    }
  },

  /**
   * Populate language filter dropdown
   */
  async populateLanguageFilter() {
    try {
      const snippets = await DB.getAllSnippets();
      const languages = [...new Set(snippets.map(s => s.language))].sort();
      const languageFilter = document.getElementById('language-filter');
      
      languageFilter.innerHTML = '<option value="">All Languages</option>';
      
      languages.forEach(language => {
        const option = document.createElement('option');
        option.value = language;
        option.textContent = language.charAt(0).toUpperCase() + language.slice(1);
        languageFilter.appendChild(option);
      });
    } catch (error) {
      console.error('[App] Failed to populate language filter:', error);
    }
  },

  /**
   * Switch between views
   */
  switchView(viewName) {
    console.log('[App] Switching to view:', viewName);

    this.state.currentView = viewName;

    // Update active nav button
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-view') === viewName) {
        btn.classList.add('active');
      }
    });

    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
      view.classList.remove('active');
    });

    // Show selected view
    const viewElement = document.getElementById(`view-${viewName}`);
    if (viewElement) {
      viewElement.classList.add('active');
    }

    // Clear filters when switching views (except search)
    this.state.filters.language = '';
    this.state.filters.subject = '';
    document.getElementById('language-filter').value = '';
    document.getElementById('subject-filter').value = '';

    // Load data for the view
    this.refreshCurrentView();
  },

  /**
   * Refresh the current view with latest data
   */
  async refreshCurrentView() {
    const view = this.state.currentView;

    try {
      switch (view) {
        case 'home':
          await this.loadHome();
          break;
        case 'snippets':
          await this.loadSnippets();
          break;
        case 'favourites':
          await this.loadFavourites();
          break;
        case 'errors':
          await this.loadErrors();
          break;
        case 'subjects':
          await this.loadSubjects();
          break;
        case 'import-export':
          // No data to load
          break;
      }
    } catch (error) {
      console.error('[App] Failed to refresh view:', error);
      this.showError('Failed to load data');
    }
  },

  /**
   * Load home view (ALL content - snippets + errors)
   */
  async loadHome() {
    let allContent = this.state.searchQuery
      ? await DB.searchSnippets(this.state.searchQuery)
      : await DB.getAllSnippets();

    // Apply filters
    if (this.state.filters.language) {
      allContent = allContent.filter(s => s.language === this.state.filters.language);
    }
    if (this.state.filters.subject) {
      allContent = allContent.filter(s => s.subject === this.state.filters.subject);
    }

    // Sort
    allContent = this.sortSnippets(allContent, this.state.filters.sortBy);

    // Check for cross-view results
    await this.checkCrossViewResults(allContent, 'all');

    // Update count
    document.getElementById('home-count').textContent = allContent.length;

    // Render
    UI.renderSnippets(allContent, 'home-grid');
  },

  /**
   * Load snippets view (CODE only)
   */
  async loadSnippets() {
    let snippets = this.state.searchQuery
      ? await DB.searchSnippets(this.state.searchQuery)
      : await DB.getAllSnippets();

    // Filter to code only
    snippets = snippets.filter(s => s.type === 'code');

    // Apply additional filters
    if (this.state.filters.language) {
      snippets = snippets.filter(s => s.language === this.state.filters.language);
    }
    if (this.state.filters.subject) {
      snippets = snippets.filter(s => s.subject === this.state.filters.subject);
    }

    // Sort
    snippets = this.sortSnippets(snippets, this.state.filters.sortBy);

    // Check for cross-view results
    await this.checkCrossViewResults(snippets, 'code');

    // Update count
    document.getElementById('snippet-count').textContent = snippets.length;

    // Render
    UI.renderSnippets(snippets, 'snippets-grid');
  },

  /**
   * Load favourites view
   */
  async loadFavourites() {
    let snippets = await DB.getAllSnippets({ favourite: true });

    // Apply search if active
    if (this.state.searchQuery) {
      const searchResults = await DB.searchSnippets(this.state.searchQuery);
      const searchIds = new Set(searchResults.map(s => s.id));
      snippets = snippets.filter(s => searchIds.has(s.id));
    }

    // Apply filters
    if (this.state.filters.language) {
      snippets = snippets.filter(s => s.language === this.state.filters.language);
    }
    if (this.state.filters.subject) {
      snippets = snippets.filter(s => s.subject === this.state.filters.subject);
    }

    // Sort
    snippets = this.sortSnippets(snippets, this.state.filters.sortBy);

    // Update count
    document.getElementById('favourites-count').textContent = snippets.length;

    // Render
    UI.renderSnippets(snippets, 'favourites-grid');
  },

  /**
   * Load errors view (ERRORS only)
   */
  async loadErrors() {
    let errors = this.state.searchQuery
      ? await DB.searchSnippets(this.state.searchQuery)
      : await DB.getAllSnippets();

    // Filter to errors only
    errors = errors.filter(s => s.type === 'error');

    // Apply additional filters
    if (this.state.filters.language) {
      errors = errors.filter(s => s.language === this.state.filters.language);
    }
    if (this.state.filters.subject) {
      errors = errors.filter(s => s.subject === this.state.filters.subject);
    }

    // Sort
    errors = this.sortSnippets(errors, this.state.filters.sortBy);

    // Check for cross-view results
    await this.checkCrossViewResults(errors, 'error');

    // Update count
    document.getElementById('errors-count').textContent = errors.length;

    // Render
    UI.renderSnippets(errors, 'errors-grid');
  },

  /**
   * Load subjects view
   */
  async loadSubjects() {
    const subjects = await DB.getAllSubjects();
    const snippets = await DB.getAllSnippets();

    // Count snippets/errors per subject
    const subjectsWithCounts = subjects.map(subject => {
      const subjectSnippets = snippets.filter(s => 
        s.subject === subject.name && s.type === 'code'
      );
      const subjectErrors = snippets.filter(s => 
        s.subject === subject.name && s.type === 'error'
      );

      return {
        ...subject,
        snippetCount: subjectSnippets.length,
        errorCount: subjectErrors.length
      };
    });

    UI.renderSubjects(subjectsWithCounts);
  },

  /**
   * Check for results in other views and notify user
   */
  async checkCrossViewResults(currentResults, currentType) {
    // Only check if we have a search/filter and no results
    if (currentResults.length > 0) return;
    if (!this.state.searchQuery && !this.state.filters.language && !this.state.filters.subject) return;

    // Get all snippets
    const allSnippets = this.state.searchQuery
      ? await DB.searchSnippets(this.state.searchQuery)
      : await DB.getAllSnippets();

    // Apply same filters
    let filtered = allSnippets;
    if (this.state.filters.language) {
      filtered = filtered.filter(s => s.language === this.state.filters.language);
    }
    if (this.state.filters.subject) {
      filtered = filtered.filter(s => s.subject === this.state.filters.subject);
    }

    // Check other types
    if (currentType === 'code') {
      const errorResults = filtered.filter(s => s.type === 'error');
      if (errorResults.length > 0) {
        UI.showToastWithAction(
          `No code snippets found, but ${errorResults.length} error(s) match. Click to view.`,
          'info',
          () => this.switchView('errors')
        );
      }
    } else if (currentType === 'error') {
      const codeResults = filtered.filter(s => s.type === 'code');
      if (codeResults.length > 0) {
        UI.showToastWithAction(
          `No errors found, but ${codeResults.length} snippet(s) match. Click to view.`,
          'info',
          () => this.switchView('snippets')
        );
      }
    }
  },

  /**
   * Sort snippets by criteria
   */
  sortSnippets(snippets, sortBy) {
    const sorted = [...snippets];

    switch (sortBy) {
      case 'updated':
        sorted.sort((a, b) => b.updatedAt - a.updatedAt);
        break;
      case 'created':
        sorted.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'title':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'copied':
        sorted.sort((a, b) => 
          (b.analytics?.timesCopied || 0) - (a.analytics?.timesCopied || 0)
        );
        break;
      case 'viewed':
        sorted.sort((a, b) => 
          (b.analytics?.timesViewed || 0) - (a.analytics?.timesViewed || 0)
        );
        break;
    }

    return sorted;
  },

  /**
   * Handle search input
   */
  handleSearch(query) {
    this.state.searchQuery = query.trim();

    // Show/hide clear button
    const clearBtn = document.getElementById('clear-search');
    if (this.state.searchQuery) {
      clearBtn.style.display = 'block';
    } else {
      clearBtn.style.display = 'none';
    }

    // Refresh current view with search applied
    this.refreshCurrentView();
  },

  /**
   * Toggle theme
   */
  async toggleTheme() {
    this.state.theme = this.state.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', this.state.theme);
    this.updateThemeIcon();

    try {
      await DB.updateSettings({ theme: this.state.theme });
    } catch (error) {
      console.error('[App] Failed to save theme:', error);
    }
  },

  /**
   * Update theme icon
   */
  updateThemeIcon() {
    const icon = document.querySelector('.theme-icon');
    icon.textContent = this.state.theme === 'light' ? '🌙' : '☀️';
  },

  /**
   * Show the application (hide loading screen)
   */
  showApp() {
    const loadingScreen = document.getElementById('loading-screen');
    const appContainer = document.getElementById('app');

    loadingScreen.style.display = 'none';
    appContainer.style.display = 'flex';
  },

  /**
   * Show error message to user
   */
  showError(message) {
    UI.showToast(message, 'error');
  },

  /**
   * Show success message to user
   */
  showSuccess(message) {
    UI.showToast(message, 'success');
  }
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}