/**
 * Ryana Search Module
 * Advanced search and filtering capabilities
 * Version: 1.0.0
 */

const Search = {
  /**
   * Debounce timer for search input
   */
  searchTimeout: null,

  /**
   * Perform advanced search with multiple criteria
   * @param {Object} criteria - Search criteria
   * @returns {Promise<Array>}
   */
  async advancedSearch(criteria) {
    let results = await DB.getAllSnippets();

    // Text search
    if (criteria.query) {
      results = this.searchByText(results, criteria.query);
    }

    // Filter by type
    if (criteria.type) {
      results = results.filter(s => s.type === criteria.type);
    }

    // Filter by language
    if (criteria.language) {
      results = results.filter(s => 
        s.language.toLowerCase() === criteria.language.toLowerCase()
      );
    }

    // Filter by subject
    if (criteria.subject) {
      results = results.filter(s => s.subject === criteria.subject);
    }

    // Filter by tags (any match)
    if (criteria.tags && criteria.tags.length > 0) {
      results = results.filter(s =>
        criteria.tags.some(tag => s.tags.includes(tag))
      );
    }

    // Filter by favorite
    if (criteria.favourite !== undefined) {
      results = results.filter(s => s.favourite === criteria.favourite);
    }

    // Date range filter
    if (criteria.dateFrom) {
      results = results.filter(s => s.createdAt >= criteria.dateFrom);
    }
    if (criteria.dateTo) {
      results = results.filter(s => s.createdAt <= criteria.dateTo);
    }

    return results;
  },

  /**
   * Search snippets by text query
   * @param {Array} snippets - Snippets to search
   * @param {string} query - Search query
   * @returns {Array}
   */
  searchByText(snippets, query) {
    const lowerQuery = query.toLowerCase();
    const terms = lowerQuery.split(/\s+/).filter(t => t.length > 0);

    return snippets.filter(snippet => {
      const searchableText = [
        snippet.title,
        snippet.description,
        snippet.code,
        snippet.language,
        snippet.subject,
        ...snippet.tags,
        ...(snippet.errors?.map(e => `${e.message} ${e.solution}`) || [])
      ].join(' ').toLowerCase();

      // All terms must be found
      return terms.every(term => searchableText.includes(term));
    }).map(snippet => {
      // Calculate relevance score
      const score = this.calculateRelevance(snippet, terms);
      return { ...snippet, _relevance: score };
    }).sort((a, b) => b._relevance - a._relevance);
  },

  /**
   * Calculate relevance score for search results
   * @param {Object} snippet - Snippet object
   * @param {Array} terms - Search terms
   * @returns {number}
   */
  calculateRelevance(snippet, terms) {
    let score = 0;

    terms.forEach(term => {
      // Title matches are most important
      if (snippet.title.toLowerCase().includes(term)) {
        score += 10;
      }

      // Tags are second most important
      if (snippet.tags.some(tag => tag.toLowerCase().includes(term))) {
        score += 5;
      }

      // Subject matches
      if (snippet.subject.toLowerCase().includes(term)) {
        score += 3;
      }

      // Description matches
      if (snippet.description.toLowerCase().includes(term)) {
        score += 2;
      }

      // Code matches
      if (snippet.code.toLowerCase().includes(term)) {
        score += 1;
      }
    });

    // Boost for favorites
    if (snippet.favourite) {
      score += 2;
    }

    // Boost for recently updated
    const daysSinceUpdate = (Date.now() - snippet.updatedAt) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate < 7) {
      score += 3;
    } else if (daysSinceUpdate < 30) {
      score += 1;
    }

    return score;
  },

  /**
   * Get search suggestions based on partial query
   * @param {string} partial - Partial search query
   * @returns {Promise<Object>}
   */
  async getSearchSuggestions(partial) {
    const lowerPartial = partial.toLowerCase();
    const suggestions = {
      snippets: [],
      tags: [],
      subjects: [],
      languages: []
    };

    // Get all data
    const [snippets, tags, subjects] = await Promise.all([
      DB.getAllSnippets(),
      DB.getAllTags(),
      DB.getAllSubjects()
    ]);

    // Snippet title suggestions
    suggestions.snippets = snippets
      .filter(s => s.title.toLowerCase().includes(lowerPartial))
      .slice(0, 5)
      .map(s => ({ id: s.id, title: s.title, type: 'snippet' }));

    // Tag suggestions
    suggestions.tags = tags
      .filter(t => t.name.toLowerCase().includes(lowerPartial))
      .slice(0, 5)
      .map(t => ({ name: t.name, type: 'tag' }));

    // Subject suggestions
    suggestions.subjects = subjects
      .filter(s => s.name.toLowerCase().includes(lowerPartial))
      .slice(0, 5)
      .map(s => ({ name: s.name, type: 'subject' }));

    // Language suggestions
    const languages = [...new Set(snippets.map(s => s.language))];
    suggestions.languages = languages
      .filter(l => l.toLowerCase().includes(lowerPartial))
      .slice(0, 5)
      .map(l => ({ name: l, type: 'language' }));

    return suggestions;
  },

  /**
   * Find related snippets based on similarity
   * @param {string} snippetId - ID of snippet to find related snippets for
   * @param {number} limit - Maximum number of related snippets to return
   * @returns {Promise<Array>}
   */
  async findRelatedSnippets(snippetId, limit = 5) {
    const snippet = await DB.getSnippet(snippetId);
    if (!snippet) return [];

    const allSnippets = await DB.getAllSnippets();
    const relatedScores = allSnippets
      .filter(s => s.id !== snippetId)
      .map(s => ({
        snippet: s,
        score: this.calculateSimilarity(snippet, s)
      }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return relatedScores.map(item => item.snippet);
  },

  /**
   * Calculate similarity score between two snippets
   * @param {Object} snippet1 - First snippet
   * @param {Object} snippet2 - Second snippet
   * @returns {number}
   */
  calculateSimilarity(snippet1, snippet2) {
    let score = 0;

    // Same subject
    if (snippet1.subject && snippet1.subject === snippet2.subject) {
      score += 10;
    }

    // Same language
    if (snippet1.language === snippet2.language) {
      score += 5;
    }

    // Common tags
    const commonTags = snippet1.tags.filter(tag => 
      snippet2.tags.includes(tag)
    );
    score += commonTags.length * 3;

    // Similar title words
    const words1 = snippet1.title.toLowerCase().split(/\s+/);
    const words2 = snippet2.title.toLowerCase().split(/\s+/);
    const commonWords = words1.filter(word => 
      words2.includes(word) && word.length > 3
    );
    score += commonWords.length * 2;

    return score;
  },

  /**
   * Get snippets by category (cross-subject discovery)
   * @param {string} category - Category to search (e.g., "sorting", "loops")
   * @returns {Promise<Array>}
   */
  async getByCategory(category) {
    const snippets = await DB.getAllSnippets();
    const lowerCategory = category.toLowerCase();

    return snippets.filter(snippet => {
      const searchText = [
        snippet.title,
        snippet.description,
        ...snippet.tags
      ].join(' ').toLowerCase();

      return searchText.includes(lowerCategory);
    });
  },

  /**
   * Get most popular snippets
   * @param {number} limit - Number of snippets to return
   * @returns {Promise<Array>}
   */
  async getMostPopular(limit = 10) {
    const snippets = await DB.getAllSnippets();
    
    return snippets
      .sort((a, b) => {
        const scoreA = (a.analytics?.timesCopied || 0) * 2 + 
                      (a.analytics?.timesViewed || 0);
        const scoreB = (b.analytics?.timesCopied || 0) * 2 + 
                      (b.analytics?.timesViewed || 0);
        return scoreB - scoreA;
      })
      .slice(0, limit);
  },

  /**
   * Get recently added snippets
   * @param {number} days - Number of days to look back
   * @param {number} limit - Maximum number of snippets
   * @returns {Promise<Array>}
   */
  async getRecentlyAdded(days = 7, limit = 10) {
    const snippets = await DB.getAllSnippets();
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);

    return snippets
      .filter(s => s.createdAt >= cutoff)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  },

  /**
   * Get frequently accessed errors
   * @param {number} limit - Number of errors to return
   * @returns {Promise<Array>}
   */
  async getFrequentErrors(limit = 10) {
    const errors = await DB.getAllSnippets({ type: 'error' });
    
    return errors
      .sort((a, b) => {
        const scoreA = (a.analytics?.timesViewed || 0);
        const scoreB = (b.analytics?.timesViewed || 0);
        return scoreB - scoreA;
      })
      .slice(0, limit);
  },

  /**
   * Search with autocomplete/suggestions
   * @param {string} query - Partial query
   * @param {Function} callback - Callback function for suggestions
   */
  searchWithAutocomplete(query, callback) {
    // Clear existing timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    // Debounce search
    this.searchTimeout = setTimeout(async () => {
      if (query.length < 2) {
        callback([]);
        return;
      }

      const suggestions = await this.getSearchSuggestions(query);
      callback(suggestions);
    }, 300); // 300ms debounce
  },

  /**
   * Get statistics about snippets
   * @returns {Promise<Object>}
   */
  async getStatistics() {
    const snippets = await DB.getAllSnippets();
    const subjects = await DB.getAllSubjects();
    const tags = await DB.getAllTags();

    const codeSnippets = snippets.filter(s => s.type === 'code');
    const errorLogs = snippets.filter(s => s.type === 'error');

    const stats = {
      total: snippets.length,
      code: codeSnippets.length,
      errors: errorLogs.length,
      favorites: snippets.filter(s => s.favourite).length,
      subjects: subjects.length,
      uniqueTags: tags.length,
      languages: [...new Set(snippets.map(s => s.language))].length,
      
      // Most used language
      mostUsedLanguage: this.getMostCommon(snippets.map(s => s.language)),
      
      // Most used subject
      mostUsedSubject: this.getMostCommon(snippets.map(s => s.subject)),
      
      // Most used tags
      topTags: tags.slice(0, 5).map(t => ({ name: t.name, count: t.count })),
      
      // Total views and copies
      totalViews: snippets.reduce((sum, s) => sum + (s.analytics?.timesViewed || 0), 0),
      totalCopies: snippets.reduce((sum, s) => sum + (s.analytics?.timesCopied || 0), 0),
      
      // Created this week
      createdThisWeek: snippets.filter(s => {
        const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        return s.createdAt >= weekAgo;
      }).length
    };

    return stats;
  },

  /**
   * Get most common value in array
   * @param {Array} arr - Array of values
   * @returns {string}
   */
  getMostCommon(arr) {
    const counts = {};
    arr.forEach(item => {
      if (item) counts[item] = (counts[item] || 0) + 1;
    });

    let maxCount = 0;
    let mostCommon = '';
    Object.entries(counts).forEach(([item, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = item;
      }
    });

    return mostCommon || 'None';
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Search;
}