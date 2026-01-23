# Ryana Database Usage Guide

## Overview
The `db.js` file provides a complete wrapper around IndexedDB with all CRUD operations for Ryana's data.

## Database Structure

### Object Stores (Tables)
1. **snippets** - Code snippets and error logs
2. **subjects** - Course/subject definitions  
3. **settings** - User preferences
4. **tags** - Tag auto-suggestions with usage counts

---

## Usage Examples

### Initialize Database
```javascript
// Database initializes automatically when db.js loads
// But you can manually initialize:
await DB.init();
```

---

## Snippets Operations

### Create a New Snippet
```javascript
const snippetId = await DB.addSnippet({
  title: 'Bubble Sort Algorithm',
  description: 'Basic sorting algorithm for beginners',
  language: 'python',
  subject: 'Algorithms',
  tags: ['sorting', 'beginner', 'arrays'],
  code: `def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n-i-1):
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
    return arr`,
  type: 'code',
  usage: {
    when: 'When you need to sort small arrays',
    where: 'Algorithms class, sorting problems',
    how: 'Pass unsorted array, returns sorted array'
  }
});

console.log('Created snippet:', snippetId);
```

### Create an Error Log
```javascript
const errorId = await DB.addSnippet({
  title: 'IndexError in Python',
  description: 'List index out of range error',
  language: 'python',
  subject: 'Programming Basics',
  tags: ['error', 'debugging', 'python'],
  code: `# Error code that caused the problem
my_list = [1, 2, 3]
print(my_list[5])  # IndexError!`,
  type: 'error',
  errors: [{
    message: 'IndexError: list index out of range',
    solution: 'Always check list length before accessing index. Use len() function or try-except block.',
    links: [
      'https://stackoverflow.com/questions/python-index-error',
      'https://docs.python.org/3/tutorial/errors.html'
    ],
    createdAt: Date.now()
  }]
});
```

### Get All Snippets
```javascript
const allSnippets = await DB.getAllSnippets();
console.log('Total snippets:', allSnippets.length);
```

### Get Filtered Snippets
```javascript
// Get only code snippets (not errors)
const codeSnippets = await DB.getAllSnippets({ type: 'code' });

// Get snippets by subject
const algoSnippets = await DB.getAllSnippets({ subject: 'Algorithms' });

// Get snippets by language
const pythonSnippets = await DB.getAllSnippets({ language: 'python' });

// Get favorite snippets
const favorites = await DB.getAllSnippets({ favourite: true });

// Get snippets with specific tag
const sortingSnippets = await DB.getAllSnippets({ tag: 'sorting' });
```

### Update a Snippet
```javascript
await DB.updateSnippet(snippetId, {
  title: 'Updated Title',
  description: 'New description',
  favourite: true,
  tags: ['sorting', 'beginner', 'arrays', 'optimization']
});
```

### Delete a Snippet
```javascript
await DB.deleteSnippet(snippetId);
```

### Search Snippets
```javascript
// Searches across title, description, code, tags, subject, language, and errors
const results = await DB.searchSnippets('bubble sort');
console.log('Found:', results.length);
```

### Update Analytics
```javascript
// Track when snippet is viewed
await DB.updateAnalytics(snippetId, 'view');

// Track when snippet code is copied
await DB.updateAnalytics(snippetId, 'copy');
```

---

## Subjects Operations

### Create a Subject
```javascript
const subjectId = await DB.addSubject({
  name: 'Algorithms',
  colorCode: 'hsl(200, 70%, 50%)',
  description: 'Introduction to algorithms and data structures',
  year: 1,
  semester: 1
});
```

### Get All Subjects
```javascript
const subjects = await DB.getAllSubjects();
subjects.forEach(subject => {
  console.log(`${subject.name} - ${subject.colorCode}`);
});
```

### Update a Subject
```javascript
await DB.updateSubject(subjectId, {
  colorCode: 'hsl(180, 65%, 55%)',
  description: 'Updated description'
});
```

### Delete a Subject
```javascript
await DB.deleteSubject(subjectId);
```

---

## Settings Operations

### Get Settings
```javascript
const settings = await DB.getSettings();
console.log('Current theme:', settings.theme);
```

### Update Settings
```javascript
await DB.updateSettings({
  theme: 'dark',
  syncEnabled: true,
  syncProvider: 'gist',
  defaultLanguage: 'javascript'
});
```

---

## Tags Operations

### Get All Tags (Sorted by Usage)
```javascript
const tags = await DB.getAllTags();
tags.forEach(tag => {
  console.log(`${tag.name} - used ${tag.count} times`);
});
```

### Get Tag Suggestions
```javascript
// User types "sor"
const suggestions = await DB.getTagSuggestions('sor');
// Returns: ['sorting', 'sort-algorithms', etc.]
```

---

## Import/Export Operations

### Export All Data
```javascript
const exportData = await DB.exportDatabase();

// Convert to JSON and download
const json = JSON.stringify(exportData, null, 2);
const blob = new Blob([json], { type: 'application/json' });
const url = URL.createObjectURL(blob);

const link = document.createElement('a');
link.href = url;
link.download = `ryana-export-${Date.now()}.json`;
link.click();
```

### Import Data (Merge)
```javascript
// Merge with existing data (keeps both, updates if newer)
const stats = await DB.importDatabase(importedData, true);
console.log('Import stats:', stats);
// Output: { snippets: { added: 5, updated: 2, skipped: 3 }, ... }
```

### Import Data (Replace)
```javascript
// Clear existing and import (DANGEROUS!)
await DB.clearAllData();
const stats = await DB.importDatabase(importedData, false);
```

---

## Data Structure Reference

### Snippet Object
```javascript
{
  id: "unique-id",
  title: "string",
  description: "string",
  language: "string",
  subject: "string",
  tags: ["tag1", "tag2"],
  code: "string",
  type: "code" | "error",
  errors: [{
    message: "string",
    solution: "string",
    links: ["url1", "url2"],
    createdAt: timestamp
  }],
  usage: {
    when: "string",
    where: "string",
    how: "string"
  },
  favourite: boolean,
  colorCode: "hsl(...)",
  analytics: {
    timesCopied: number,
    timesViewed: number,
    lastCopied: timestamp,
    lastViewed: timestamp
  },
  versions: [{
    code: "string",
    timestamp: timestamp,
    note: "string"
  }],
  createdAt: timestamp,
  updatedAt: timestamp,
  sync: {
    source: "local" | "gist" | "drive",
    lastSynced: timestamp,
    remoteId: "string"
  }
}
```

### Subject Object
```javascript
{
  id: "unique-id",
  name: "string",
  colorCode: "hsl(...)",
  description: "string",
  year: number,
  semester: number,
  createdAt: timestamp
}
```

### Settings Object
```javascript
{
  id: "user-settings",
  theme: "light" | "dark",
  syncEnabled: boolean,
  syncProvider: "gist" | "drive" | "dropbox" | null,
  authToken: "string" | null,
  defaultLanguage: "string",
  autoSave: boolean,
  keyboardShortcuts: boolean,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Tag Object
```javascript
{
  id: "unique-id",
  name: "string",
  count: number,
  lastUsed: timestamp
}
```

---

## Error Handling

All database operations return Promises, so use try-catch:

```javascript
try {
  const snippet = await DB.getSnippet(snippetId);
  console.log('Snippet:', snippet);
} catch (error) {
  console.error('Database error:', error);
  // Show user-friendly error message
}
```

---

## Performance Tips

1. **Use Indexes**: The database has indexes on commonly queried fields (language, subject, tags, etc.)
2. **Batch Operations**: When importing multiple snippets, the database handles them efficiently
3. **Tag Management**: Tags are automatically managed - counts updated, unused tags deleted
4. **Analytics**: Lightweight - only updates counters, doesn't slow down the app

---

## Next Steps

After understanding the database API, you'll use it in:
- `app.js` - Main application logic
- `ui.js` - UI interactions that trigger database operations
- `search.js` - Search functionality
- `import-export.js` - Import/export features