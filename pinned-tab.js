document.addEventListener('DOMContentLoaded', () => {
  // Load saved search queries from local storage
  browser.storage.local.get('searchQueries').then((data) => {
    const searchQueries = data.searchQueries || [];
    renderSearchQueries(searchQueries);
  }).catch((error) => {
    console.error('Error loading search queries:', error);
  });

  function renderSearchQueries(queries) {
    const searchList = document.getElementById('searchList');
    searchList.innerHTML = ''; // Clear existing content

    queries.forEach((query, index) => {
      const row = createSearchRow(query, index);
      searchList.appendChild(row);
    });
  }

  function createSearchRow(query, index) {
    const row = document.createElement('tr');
    row.dataset.index = index;

    const timestampCell = document.createElement('td');
    timestampCell.textContent = new Date(query.timestamp).toLocaleString();
    row.appendChild(timestampCell);

    const searchEngineCell = document.createElement('td');
    const searchEngineSelect = document.createElement('select');
    searchEngineSelect.id = `searchEngine${index}`;
    populateSearchEngines(`searchEngine${index}`, query.searchEngine);
    searchEngineSelect.addEventListener('change', () => handleSearchEngineChange(index, searchEngineSelect.value));
    searchEngineCell.appendChild(searchEngineSelect);
    row.appendChild(searchEngineCell);

    const queryCell = document.createElement('td');
    queryCell.classList.add('query-cell');
    queryCell.dataset.index = index;
    queryCell.textContent = query.query;
    row.appendChild(queryCell);

    const editCell = document.createElement('td');
    const editButton = document.createElement('button');
    editButton.classList.add('edit-button');
    editButton.textContent = 'Edit';
    editButton.dataset.index = index;
    editButton.addEventListener('click', () => handleEdit(index));
    editCell.appendChild(editButton);
    row.appendChild(editCell);

    const removeCell = document.createElement('td');
    const removeButton = document.createElement('button');
    removeButton.classList.add('remove-button');
    removeButton.textContent = 'Remove';
    removeButton.dataset.index = index;
    removeButton.addEventListener('click', () => handleRemove(index));
    removeCell.appendChild(removeButton);
    row.appendChild(removeCell);

    const searchCell = document.createElement('td');
    const searchButton = document.createElement('button');
    searchButton.classList.add('search-button');
    searchButton.textContent = 'Search';
    searchButton.dataset.index = index;
    searchButton.addEventListener('click', () => searchQuery(index));
    searchCell.appendChild(searchButton);
    row.appendChild(searchCell);

    return row;
  }

  function populateSearchEngines(selectId, selectedEngine) {
    // Retrieve available search engines
    browser.search.get().then((engines) => {
      const select = document.getElementById(selectId);
      select.innerHTML = ''; // Clear previous options

      engines.forEach((engine) => {
        const option = document.createElement('option');
        option.value = engine.name;
        option.textContent = engine.name;

        if (engine.name === selectedEngine) {
          option.selected = true;
        }

        select.appendChild(option);
      });
    }).catch((error) => {
      console.error('Error retrieving search engines:', error);
    });
  }

  function handleEdit(index) {
    const row = document.querySelector(`tr[data-index="${index}"]`);
    const queryCell = row.querySelector('.query-cell');
    const editButton = row.querySelector('.edit-button');
    const removeButton = row.querySelector('.remove-button');

    // Enter edit mode
    queryCell.contentEditable = 'true';
    queryCell.focus();

    // Change buttons
    editButton.textContent = 'Save';
    editButton.classList.add('save-button');
    editButton.removeEventListener('click', handleEdit);
    editButton.addEventListener('click', () => handleSave(index));

    removeButton.textContent = 'Cancel';
    removeButton.classList.add('cancel-button');
    removeButton.removeEventListener('click', handleRemove);
    removeButton.addEventListener('click', () => handleCancel(index));
  }

  function handleSave(index) {
    const row = document.querySelector(`tr[data-index="${index}"]`);
    const queryCell = row.querySelector('.query-cell');
    const editButton = row.querySelector('.edit-button');
    const removeButton = row.querySelector('.remove-button');

    // Exit edit mode
    queryCell.contentEditable = 'false';

    // Change buttons back to edit/remove
    editButton.textContent = 'Edit';
    editButton.classList.remove('save-button');
    editButton.removeEventListener('click', handleSave);
    editButton.addEventListener('click', () => handleEdit(index));

    removeButton.textContent = 'Remove';
    removeButton.classList.remove('cancel-button');
    removeButton.removeEventListener('click', handleCancel);
    removeButton.addEventListener('click', () => handleRemove(index));

    // Update query in storage
    updateQuery(index, queryCell.textContent.trim());
  }

  function handleCancel(index) {
    const row = document.querySelector(`tr[data-index="${index}"]`);
    const queryCell = row.querySelector('.query-cell');
    const editButton = row.querySelector('.edit-button');
    const removeButton = row.querySelector('.remove-button');

    // Exit edit mode
    queryCell.contentEditable = 'false';

    // Reset query text to original value
    browser.storage.local.get('searchQueries').then((data) => {
      const searchQueries = data.searchQueries || [];
      queryCell.textContent = searchQueries[index].query;
    }).catch((error) => {
      console.error('Error retrieving search queries for cancel edit:', error);
    });

    // Change buttons back to edit/remove
    editButton.textContent = 'Edit';
    editButton.classList.remove('save-button');
    editButton.removeEventListener('click', handleSave);
    editButton.addEventListener('click', () => handleEdit(index));

    removeButton.textContent = 'Remove';
    removeButton.classList.remove('cancel-button');
    removeButton.removeEventListener('click', handleCancel);
    removeButton.addEventListener('click', () => handleRemove(index));
  }

  function handleSearchEngineChange(index, selectedEngine) {
    // Update selected search engine in memory
    browser.storage.local.get('searchQueries').then((data) => {
      const searchQueries = data.searchQueries || [];
      searchQueries[index].searchEngine = selectedEngine;

      // Save updated search engine to storage
      browser.storage.local.set({ searchQueries }).then(() => {
        console.log(`Search engine at index ${index} updated to "${selectedEngine}"`);
      }).catch((error) => {
        console.error('Failed to update search engine:', error);
      });
    }).catch((error) => {
      console.error('Error retrieving search queries for search engine update:', error);
    });
  }

  function handleRemove(index) {
    browser.storage.local.get('searchQueries').then((data) => {
      let searchQueries = data.searchQueries || [];
      searchQueries = searchQueries.filter((_, i) => i !== index);

      // Save updated search queries to storage
      browser.storage.local.set({ searchQueries }).then(() => {
        console.log(`Search query at index ${index} removed.`);
        renderSearchQueries(searchQueries);
      }).catch((error) => {
        console.error('Failed to remove search query:', error);
      });
    }).catch((error) => {
      console.error('Error retrieving search queries for removal:', error);
    });
  }

  function updateQuery(index, newQuery) {
    // Update query in storage
    browser.storage.local.get('searchQueries').then((data) => {
      const searchQueries = data.searchQueries || [];
      searchQueries[index].query = newQuery;

      // Save updated queries back to storage
      browser.storage.local.set({ searchQueries }).then(() => {
        console.log(`Query at index ${index} updated to "${newQuery}"`);
      }).catch((error) => {
        console.error('Failed to update search queries:', error);
      });
    }).catch((error) => {
      console.error('Error retrieving search queries for update:', error);
    });
  }

  function searchQuery(index) {
    console.log('Searching query at index:', index);

    // Retrieve query details
    const row = document.querySelector(`tr[data-index="${index}"]`);
    const queryCell = row.querySelector('.query-cell');
    const query = queryCell.textContent.trim();

    // Retrieve selected search engine name from the dropdown
    const selectElement = document.getElementById(`searchEngine${index}`);
    const searchEngineName = selectElement.value;

    // Retrieve search engine details based on its name
    browser.search.get().then((engines) => {
      for (let engine of engines) {
        if (engine.name === searchEngineName) {
          // Perform search using search.search() API method
          browser.search.search({
            disposition: "NEW_TAB",
            engine: engine.name,
            query: query
          }).then(() => {
            console.log(`Search performed on ${engine.name} for query "${query}"`);
          }).catch((error) => {
            console.error(`Error performing search on ${engine.name} for query "${query}":`, error);
          });
          break;  // Exit the loop after the correct engine is found
        }
      }
    }).catch((error) => {
      console.error('Error retrieving search engines:', error);
    });
  }

  // Settings handling
  const removeAfterSearchCheckbox = document.getElementById('removeAfterSearch');
  const orderingSelect = document.getElementById('orderingOptions'); // Changed from 'ordering' to 'orderingOptions'

  browser.storage.local.get(['removeAfterSearch', 'ordering']).then((data) => {
    const { removeAfterSearch, ordering } = data;
    removeAfterSearchCheckbox.checked = removeAfterSearch || false;
    orderingSelect.value = ordering || 'queue';
  }).catch((error) => {
    console.error('Error retrieving settings:', error);
  });

  removeAfterSearchCheckbox.addEventListener('change', (event) => {
    const isChecked = event.target.checked;
    browser.storage.local.set({ removeAfterSearch: isChecked }).then(() => {
      console.log('Setting removeAfterSearch updated:', isChecked);
    }).catch((error) => {
      console.error('Failed to update setting removeAfterSearch:', error);
    });
  });

  orderingSelect.addEventListener('change', (event) => {
    const value = event.target.value;
    browser.storage.local.set({ ordering: value }).then(() => {
      console.log('Setting ordering updated:', value);
    }).catch((error) => {
      console.error('Failed to update setting ordering:', error);
    });
  });

  // Clear entire search queue
  const clearQueueButton = document.getElementById('clearQueueButton'); // Changed from 'clearQueue' to 'clearQueueButton'
  clearQueueButton.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear the entire search queue?')) {
      browser.storage.local.set({ searchQueries: [] }).then(() => {
        console.log('Search queue cleared.');
        renderSearchQueries([]);
      }).catch((error) => {
        console.error('Failed to clear search queue:', error);
      });
    }
  });
});
