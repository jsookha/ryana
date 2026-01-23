/**
 * Ryana Main Application Controller
 * Coordinates between database, UI, search, and import/export modules
 * Version: 1.0.0
 */

const App = {
  // Application state
  state: {
    currentView: 'all',
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
      // Wait for database to be ready
      await this.waitForDatabase();

      // Load settings and apply theme
      await this.loadSettings();

      // Setup event listeners
      this.setupEventListeners();

      // Setup keyboard shortcuts
      this.setupKeyboardShortcuts();

      // Load initial data
      await this.loadInitialData();

      // Hide loading screen, show app
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

    // Search keyboard shortcut (Ctrl+K)
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
      // Only trigger if not typing in input/textarea
      const isTyping = e.target.tagName === 'INPUT' || 
                       e.target.tagName === 'TEXTAREA' ||
                       e.target.isContentEditable;

      // Ctrl+K - Focus search
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        document.getElementById('search-input').focus();
      }

      // Ctrl+N - New snippet (only when not typing)
      if (e.ctrlKey && e.key === 'n' && !isTyping) {
        e.preventDefault();
        UI.showSnippetModal();
      }

      // Ctrl+E - New error log (only when not typing)
      if (e.ctrlKey && e.key === 'e' && !isTyping) {
        e.preventDefault();
        UI.showSnippetModal('error');
      }

      // Ctrl+F - Toggle favorites view (only when not typing)
      if (e.ctrlKey && e.key === 'f' && !isTyping) {
        e.preventDefault();
        this.switchView('favorites');
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
      // Load subjects for filter dropdowns
      await this.populateSubjectFilter();

      // Load language filter options
      await this.populateLanguageFilter();

      // Load initial view (all snippets)
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
      
      // Clear existing options (except "All Subjects")
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
      
      // Clear existing options (except "All Languages")
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

    // Update state
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
        case 'all':
          await this.loadAllSnippets();
          break;
        case 'favorites':
          await this.loadFavorites();
          break;
        case 'errors':
          await this.loadErrors();
          break;
        case 'subjects':
          await this.loadSubjects();
          break;
        case 'import-export':
          // No data to load, just UI
          break;
      }
    } catch (error) {
      console.error('[App] Failed to refresh view:', error);
      this.showError('Failed to load data');
    }
  },

  /**
   * Load all snippets view
   */
  async loadAllSnippets() {
    const filters = {
      type: 'code',
      ...this.state.filters
    };

    let snippets = this.state.searchQuery
      ? await DB.searchSnippets(this.state.searchQuery)
      : await DB.getAllSnippets(filters);

    // Filter by type (code only for "all" view)
    snippets = snippets.filter(s => s.type === 'code');

    // Apply additional filters
    if (filters.language) {
      snippets = snippets.filter(s => s.language === filters.language);
    }
    if (filters.subject) {
      snippets = snippets.filter(s => s.subject === filters.subject);
    }

    // Sort
    snippets = this.sortSnippets(snippets, this.state.filters.sortBy);

    // Update count
    document.getElementById('snippet-count').textContent = snippets.length;

    // Render
    UI.renderSnippets(snippets, 'snippets-grid');
  },

  /**
   * Load favorites view
   */
  async loadFavorites() {
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
    document.getElementById('favorites-count').textContent = snippets.length;

    // Render
    UI.renderSnippets(snippets, 'favorites-grid');
  },

  /**
   * Load errors view
   */
  async loadErrors() {
    let snippets = await DB.getAllSnippets({ type: 'error' });

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
    document.getElementById('errors-count').textContent = snippets.length;

    // Render
    UI.renderSnippets(snippets, 'errors-grid');
  },

  /**
   * Load subjects view
   */
  async loadSubjects() {
    const subjects = await DB.getAllSubjects();
    UI.renderSubjects(subjects);
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

    // Save to settings
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