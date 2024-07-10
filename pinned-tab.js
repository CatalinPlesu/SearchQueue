document.addEventListener('DOMContentLoaded', () => {
  // Load saved search queries from local storage
  browser.storage.local.get('searchQueries').then((data) => {
    const searchQueries = data.searchQueries || [];
    renderSearchQueries(searchQueries);
  }).catch((error) => {
    console.error('Error loading search queries:', error);
  });

  // Handle change in ordering options
  const orderingOptions = document.getElementById('orderingOptions');
  orderingOptions.addEventListener('change', () => {
    browser.storage.local.get('searchQueries').then((data) => {
      const searchQueries = data.searchQueries || [];
      renderSearchQueries(searchQueries);
    }).catch((error) => {
      console.error('Error loading search queries:', error);
    });
  });

  function renderSearchQueries(queries) {
    const searchList = document.getElementById('searchList');
    searchList.innerHTML = ''; // Clear existing content

    const ordering = orderingOptions.value; // Get current ordering option

    if (ordering === 'stack') {
      queries = queries.slice().reverse(); // Reverse the array for stack ordering
    }

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
    // Retrieve search queries from storage
    browser.storage.local.get('searchQueries').then((data) => {
      const searchQueries = data.searchQueries || [];

      // Remove query at specified index
      searchQueries.splice(index, 1);

      // Save updated queries back to storage
      browser.storage.local.set({ searchQueries }).then(() => {
        console.log(`Query at index ${index} removed successfully.`);
        renderSearchQueries(searchQueries); // Update UI after removal
      }).catch((error) => {
        console.error('Failed to remove query:', error);
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
            // Remove query from UI if checkbox is checked
            const removeAfterSearchCheckbox = document.getElementById('removeAfterSearch');
            if (removeAfterSearchCheckbox.checked) {
              handleRemove(index); // Remove the query from storage and UI
            }
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
});
