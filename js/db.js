/**
 * Ryana Database Layer (IndexedDB)
 * Handles all data storage and retrieval operations
 * Version: 1.0.0
 */

const DB_NAME = 'RyanaDB';
const DB_VERSION = 1;

// Database instance (will be initialized)
let db = null;

/**
 * Database Schema Definition
 * Object Stores (like tables in SQL):
 * 1. snippets - code snippets and error logs
 * 2. subjects - course/subject definitions
 * 3. settings - user preferences
 * 4. tags - tag auto-suggestions
 */

const DB = {
  /**
   * Initialize the database
   * Creates object stores and indexes if they don't exist
   * @returns {Promise<IDBDatabase>}
   */
  init() {
    return new Promise((resolve, reject) => {
      console.log('[DB] Initializing database...');

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      // Handle database upgrade (first time or version change)
      request.onupgradeneeded = (event) => {
        console.log('[DB] Upgrading database schema...');
        const db = event.target.result;

        // ==================== SNIPPETS STORE ====================
        if (!db.objectStoreNames.contains('snippets')) {
          const snippetsStore = db.createObjectStore('snippets', { 
            keyPath: 'id' 
          });

          // Create indexes for fast queries
          snippetsStore.createIndex('title', 'title', { unique: false });
          snippetsStore.createIndex('language', 'language', { unique: false });
          snippetsStore.createIndex('subject', 'subject', { unique: false });
          snippetsStore.createIndex('type', 'type', { unique: false });
          snippetsStore.createIndex('favourite', 'favourite', { unique: false });
          snippetsStore.createIndex('createdAt', 'createdAt', { unique: false });
          snippetsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          
          // Multi-entry index for tags (allows searching by any tag)
          snippetsStore.createIndex('tags', 'tags', { 
            unique: false, 
            multiEntry: true 
          });

          console.log('[DB] Created snippets store with indexes');
        }

        // ==================== SUBJECTS STORE ====================
        if (!db.objectStoreNames.contains('subjects')) {
          const subjectsStore = db.createObjectStore('subjects', { 
            keyPath: 'id' 
          });

          subjectsStore.createIndex('name', 'name', { unique: true });
          subjectsStore.createIndex('year', 'year', { unique: false });
          subjectsStore.createIndex('semester', 'semester', { unique: false });

          console.log('[DB] Created subjects store with indexes');
        }

        // ==================== SETTINGS STORE ====================
        if (!db.objectStoreNames.contains('settings')) {
          const settingsStore = db.createObjectStore('settings', { 
            keyPath: 'id' 
          });

          console.log('[DB] Created settings store');

          // Initialize default settings
          const defaultSettings = {
            id: 'user-settings',
            theme: 'light',
            syncEnabled: false,
            syncProvider: null,
            authToken: null,
            defaultLanguage: 'javascript',
            autoSave: true,
            keyboardShortcuts: true,
            createdAt: Date.now(),
            updatedAt: Date.now()
          };

          // Add default settings in transaction
          const transaction = event.target.transaction;
          const store = transaction.objectStore('settings');
          store.add(defaultSettings);
        }

        // ==================== TAGS STORE ====================
        if (!db.objectStoreNames.contains('tags')) {
          const tagsStore = db.createObjectStore('tags', { 
            keyPath: 'id' 
          });

          tagsStore.createIndex('name', 'name', { unique: true });
          tagsStore.createIndex('count', 'count', { unique: false });
          tagsStore.createIndex('lastUsed', 'lastUsed', { unique: false });

          console.log('[DB] Created tags store with indexes');
        }
      };

      request.onsuccess = (event) => {
        db = event.target.result;
        console.log('[DB] Database initialized successfully');
        resolve(db);
      };

      request.onerror = (event) => {
        console.error('[DB] Database initialization failed:', event.target.error);
        reject(event.target.error);
      };

      request.onblocked = () => {
        console.warn('[DB] Database upgrade blocked - close other tabs using Ryana');
      };
    });
  },

  // ==================== SNIPPETS OPERATIONS ====================

  /**
   * Add a new snippet
   * @param {Object} snippet - Snippet data
   * @returns {Promise<string>} - ID of created snippet
   */
  async addSnippet(snippet) {
    const snippetData = {
      id: this.generateId(),
      title: snippet.title || 'Untitled Snippet',
      description: snippet.description || '',
      language: snippet.language || 'plaintext',
      subject: snippet.subject || '',
      tags: snippet.tags || [],
      code: snippet.code || '',
      type: snippet.type || 'code', // 'code' or 'error'
      errors: snippet.errors || [],
      usage: snippet.usage || { when: '', where: '', how: '' },
      favourite: snippet.favourite || false,
      colorCode: snippet.colorCode || '',
      analytics: {
        timesCopied: 0,
        timesViewed: 0,
        lastCopied: null,
        lastViewed: null
      },
      versions: snippet.versions || [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      sync: {
        source: 'local',
        lastSynced: null,
        remoteId: null
      }
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['snippets', 'tags'], 'readwrite');
      const snippetsStore = transaction.objectStore('snippets');
      const tagsStore = transaction.objectStore('tags');

      const request = snippetsStore.add(snippetData);

      request.onsuccess = () => {
        console.log('[DB] Snippet added:', snippetData.id);
        
        // Update tag counts
        this._updateTagCounts(tagsStore, snippetData.tags, 'increment');
        
        resolve(snippetData.id);
      };

      request.onerror = () => {
        console.error('[DB] Failed to add snippet:', request.error);
        reject(request.error);
      };
    });
  },

  /**
   * Get a snippet by ID
   * @param {string} id - Snippet ID
   * @returns {Promise<Object>}
   */
  async getSnippet(id) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['snippets'], 'readonly');
      const store = transaction.objectStore('snippets');
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  },

  /**
   * Get all snippets (with optional filtering)
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>}
   */
  async getAllSnippets(filters = {}) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['snippets'], 'readonly');
      const store = transaction.objectStore('snippets');
      const request = store.getAll();

      request.onsuccess = () => {
        let snippets = request.result;

        // Apply filters
        if (filters.type) {
          snippets = snippets.filter(s => s.type === filters.type);
        }
        if (filters.subject) {
          snippets = snippets.filter(s => s.subject === filters.subject);
        }
        if (filters.language) {
          snippets = snippets.filter(s => s.language === filters.language);
        }
        if (filters.favourite !== undefined) {
          snippets = snippets.filter(s => s.favourite === filters.favourite);
        }
        if (filters.tag) {
          snippets = snippets.filter(s => s.tags.includes(filters.tag));
        }

        resolve(snippets);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  },

  /**
   * Update a snippet
   * @param {string} id - Snippet ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<void>}
   */
  async updateSnippet(id, updates) {
    return new Promise(async (resolve, reject) => {
      const snippet = await this.getSnippet(id);
      if (!snippet) {
        reject(new Error('Snippet not found'));
        return;
      }

      const oldTags = snippet.tags || [];
      const newTags = updates.tags || oldTags;

      const updatedSnippet = {
        ...snippet,
        ...updates,
        updatedAt: Date.now()
      };

      const transaction = db.transaction(['snippets', 'tags'], 'readwrite');
      const snippetsStore = transaction.objectStore('snippets');
      const tagsStore = transaction.objectStore('tags');

      const request = snippetsStore.put(updatedSnippet);

      request.onsuccess = () => {
        console.log('[DB] Snippet updated:', id);

        // Update tag counts if tags changed
        if (JSON.stringify(oldTags) !== JSON.stringify(newTags)) {
          this._updateTagCounts(tagsStore, oldTags, 'decrement');
          this._updateTagCounts(tagsStore, newTags, 'increment');
        }

        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  },

  /**
   * Delete a snippet
   * @param {string} id - Snippet ID
   * @returns {Promise<void>}
   */
  async deleteSnippet(id) {
    return new Promise(async (resolve, reject) => {
      const snippet = await this.getSnippet(id);
      if (!snippet) {
        reject(new Error('Snippet not found'));
        return;
      }

      const transaction = db.transaction(['snippets', 'tags'], 'readwrite');
      const snippetsStore = transaction.objectStore('snippets');
      const tagsStore = transaction.objectStore('tags');

      const request = snippetsStore.delete(id);

      request.onsuccess = () => {
        console.log('[DB] Snippet deleted:', id);
        
        // Decrement tag counts
        this._updateTagCounts(tagsStore, snippet.tags, 'decrement');
        
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  },

  /**
   * Search snippets
   * @param {string} query - Search query
   * @returns {Promise<Array>}
   */
  async searchSnippets(query) {
    const snippets = await this.getAllSnippets();
    const lowerQuery = query.toLowerCase();

    return snippets.filter(snippet => {
      return (
        snippet.title.toLowerCase().includes(lowerQuery) ||
        snippet.description.toLowerCase().includes(lowerQuery) ||
        snippet.code.toLowerCase().includes(lowerQuery) ||
        snippet.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
        snippet.subject.toLowerCase().includes(lowerQuery) ||
        snippet.language.toLowerCase().includes(lowerQuery) ||
        (snippet.errors && snippet.errors.some(e => 
          e.message.toLowerCase().includes(lowerQuery) ||
          e.solution.toLowerCase().includes(lowerQuery)
        ))
      );
    });
  },

  /**
   * Update snippet analytics
   * @param {string} id - Snippet ID
   * @param {string} action - 'view' or 'copy'
   */
  async updateAnalytics(id, action) {
    const snippet = await this.getSnippet(id);
    if (!snippet) return;

    const updates = {
      analytics: { ...snippet.analytics }
    };

    if (action === 'view') {
      updates.analytics.timesViewed = (snippet.analytics.timesViewed || 0) + 1;
      updates.analytics.lastViewed = Date.now();
    } else if (action === 'copy') {
      updates.analytics.timesCopied = (snippet.analytics.timesCopied || 0) + 1;
      updates.analytics.lastCopied = Date.now();
    }

    await this.updateSnippet(id, updates);
  },

  // ==================== SUBJECTS OPERATIONS ====================

  /**
   * REPLACED addSubject FUNCTION in db.js WITH THIS VERSION
   * Adds colorIndex field (1-10) for the new color system
  */

  /**
  * Add a new subject
  * @param {Object} subject - Subject data
  * @returns {Promise<string>}
  */
  async addSubject(subject) {
    const subjectData = {
      id: this.generateId(),
      name: subject.name,
      colorCode: subject.colorCode || this._generateRandomColor(),
      colorIndex: subject.colorIndex || 1, // THIS LINE IS CRITICAL
      description: subject.description || '',
      year: subject.year || 1,
      semester: subject.semester || 1,
      createdAt: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['subjects'], 'readwrite');
      const store = transaction.objectStore('subjects');
      const request = store.add(subjectData);

      request.onsuccess = () => {
        console.log('[DB] Subject added:', subjectData.id);
        resolve(subjectData.id);
      };

      request.onerror = () => {
        console.error('[DB] Failed to add subject:', request.error);
        reject(request.error);
      };
    });
  },

  /**
   * Get all subjects
   * @returns {Promise<Array>}
   */
  async getAllSubjects() {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['subjects'], 'readonly');
      const store = transaction.objectStore('subjects');
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  },

  /**
   * Update a subject
   * @param {string} id - Subject ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<void>}
   */
  async updateSubject(id, updates) {
    return new Promise(async (resolve, reject) => {
      const transaction = db.transaction(['subjects'], 'readwrite');
      const store = transaction.objectStore('subjects');
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const subject = getRequest.result;
        if (!subject) {
          reject(new Error('Subject not found'));
          return;
        }

        const updatedSubject = { ...subject, ...updates };
        const putRequest = store.put(updatedSubject);

        putRequest.onsuccess = () => {
          resolve();
        };

        putRequest.onerror = () => {
          reject(putRequest.error);
        };
      };

      getRequest.onerror = () => {
        reject(getRequest.error);
      };
    });
  },

  /**
   * Delete a subject
   * @param {string} id - Subject ID
   * @returns {Promise<void>}
   */
  async deleteSubject(id) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['subjects'], 'readwrite');
      const store = transaction.objectStore('subjects');
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('[DB] Subject deleted:', id);
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  },

  // ==================== SETTINGS OPERATIONS ====================

  /**
   * Get settings
   * @returns {Promise<Object>}
   */
  async getSettings() {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get('user-settings');

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  },

  /**
   * Update settings
   * @param {Object} updates - Settings to update
   * @returns {Promise<void>}
   */
  async updateSettings(updates) {
    return new Promise(async (resolve, reject) => {
      const settings = await this.getSettings();
      const updatedSettings = {
        ...settings,
        ...updates,
        updatedAt: Date.now()
      };

      const transaction = db.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      const request = store.put(updatedSettings);

      request.onsuccess = () => {
        console.log('[DB] Settings updated');
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  },

  // ==================== TAGS OPERATIONS ====================

  /**
   * Get all tags (sorted by usage)
   * @returns {Promise<Array>}
   */
  async getAllTags() {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['tags'], 'readonly');
      const store = transaction.objectStore('tags');
      const request = store.getAll();

      request.onsuccess = () => {
        const tags = request.result;
        // Sort by count (most used first)
        tags.sort((a, b) => b.count - a.count);
        resolve(tags);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  },

  /**
   * Get tag suggestions based on partial input
   * @param {string} partial - Partial tag name
   * @returns {Promise<Array>}
   */
  async getTagSuggestions(partial) {
    const allTags = await this.getAllTags();
    const lowerPartial = partial.toLowerCase();
    
    return allTags
      .filter(tag => tag.name.toLowerCase().startsWith(lowerPartial))
      .slice(0, 10); // Return top 10 matches
  },

  // ==================== UTILITY METHODS ====================

  /**
   * Generate a unique ID
   * @returns {string}
   */
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Generate a random HSL color
   * @returns {string}
   */
  _generateRandomColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 65%, 55%)`;
  },

  /**
   * Update tag counts
   * @private
   * @param {IDBObjectStore} tagsStore
   * @param {Array} tags
   * @param {string} operation - 'increment' or 'decrement'
   */
  _updateTagCounts(tagsStore, tags, operation) {
    tags.forEach(tagName => {
      const index = tagsStore.index('name');
      const request = index.get(tagName);

      request.onsuccess = () => {
        const tag = request.result;
        
        if (tag) {
          // Tag exists, update count
          tag.count = operation === 'increment' 
            ? tag.count + 1 
            : Math.max(0, tag.count - 1);
          tag.lastUsed = Date.now();
          
          // Delete tag if count reaches 0
          if (tag.count === 0) {
            tagsStore.delete(tag.id);
          } else {
            tagsStore.put(tag);
          }
        } else if (operation === 'increment') {
          // New tag, create it
          const newTag = {
            id: this.generateId(),
            name: tagName,
            count: 1,
            lastUsed: Date.now()
          };
          tagsStore.add(newTag);
        }
      };
    });
  },

  /**
   * Export entire database as JSON
   * @returns {Promise<Object>}
   */
  async exportDatabase() {
    const [snippets, subjects, settings, tags] = await Promise.all([
      this.getAllSnippets(),
      this.getAllSubjects(),
      this.getSettings(),
      this.getAllTags()
    ]);

    return {
      version: DB_VERSION,
      exportedAt: Date.now(),
      snippets,
      subjects,
      settings,
      tags
    };
  },

  /**
   * Import database from JSON
   * @param {Object} data - Exported database data
   * @param {boolean} merge - If true, merge with existing data; if false, replace
   * @returns {Promise<Object>} - Import statistics
   */
  async importDatabase(data, merge = true) {
    const stats = {
      snippets: { added: 0, updated: 0, skipped: 0 },
      subjects: { added: 0, updated: 0, skipped: 0 },
      tags: { added: 0, updated: 0, skipped: 0 }
    };

    try {
      // Import snippets
      if (data.snippets) {
        for (const snippet of data.snippets) {
          if (merge) {
            const existing = await this.getSnippet(snippet.id);
            if (existing) {
              // Update if imported is newer
              if (snippet.updatedAt > existing.updatedAt) {
                await this.updateSnippet(snippet.id, snippet);
                stats.snippets.updated++;
              } else {
                stats.snippets.skipped++;
              }
            } else {
              await this.addSnippet(snippet);
              stats.snippets.added++;
            }
          } else {
            await this.addSnippet(snippet);
            stats.snippets.added++;
          }
        }
      }

      // Import subjects
      if (data.subjects) {
        for (const subject of data.subjects) {
          try {
            await this.addSubject(subject);
            stats.subjects.added++;
          } catch (error) {
            // Subject name might already exist
            stats.subjects.skipped++;
          }
        }
      }

      console.log('[DB] Import completed:', stats);
      return stats;
    } catch (error) {
      console.error('[DB] Import failed:', error);
      throw error;
    }
  },

  /**
   * Clear all data (dangerous!)
   * @returns {Promise<void>}
   */
  async clearAllData() {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(
        ['snippets', 'subjects', 'tags'], 
        'readwrite'
      );

      const snippetsStore = transaction.objectStore('snippets');
      const subjectsStore = transaction.objectStore('subjects');
      const tagsStore = transaction.objectStore('tags');

      snippetsStore.clear();
      subjectsStore.clear();
      tagsStore.clear();

      transaction.oncomplete = () => {
        console.log('[DB] All data cleared');
        resolve();
      };

      transaction.onerror = () => {
        reject(transaction.error);
      };
    });
  }
};

// Initialize database when script loads
DB.init().catch(error => {
  console.error('[DB] Failed to initialize database:', error);
  alert('Failed to initialize database. Please refresh the page.');
});