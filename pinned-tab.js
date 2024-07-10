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
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${new Date(query.timestamp).toLocaleString()}</td>
        <td>
          <select id="searchEngine${index}">
            <!-- Options will be dynamically populated -->
          </select>
        </td>
        <td>${query.query}</td>
        <td><button class="edit-button" data-index="${index}">Edit</button></td>
        <td><button class="remove-button" data-index="${index}">Remove</button></td>
        <td><button class="search-button" data-index="${index}">Search</button></td>
      `;
      searchList.appendChild(row);

      // Populate search engine options
      populateSearchEngines(`searchEngine${index}`, query.searchEngine);
    });

    // Attach event listeners to dynamically added buttons
    searchList.addEventListener('click', (event) => {
      if (event.target.classList.contains('edit-button')) {
        const index = event.target.dataset.index;
        editQuery(index);
      } else if (event.target.classList.contains('remove-button')) {
        const index = event.target.dataset.index;
        removeQuery(index);
      } else if (event.target.classList.contains('search-button')) {
        const index = event.target.dataset.index;
        searchQuery(index);
      }
    });
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

  function editQuery(index) {
    console.log('Editing query at index:', index);

    // Retrieve the query from storage and update the UI for editing
    browser.storage.local.get('searchQueries').then((data) => {
      const searchQueries = data.searchQueries || [];
      const queryToUpdate = searchQueries[index];

      if (queryToUpdate) {
        const newQuery = prompt('Enter the updated query:', queryToUpdate.query);

        if (newQuery !== null) {
          // Update the query in the storage
          queryToUpdate.query = newQuery;
          searchQueries[index] = queryToUpdate;

          // Save updated queries back to storage
          browser.storage.local.set({ searchQueries: searchQueries }).then(() => {
            // Update the UI after successful update
            renderSearchQueries(searchQueries);
          }).catch((error) => {
            console.error('Failed to update search queries:', error);
          });
        }
      }
    }).catch((error) => {
      console.error('Error retrieving search queries for edit:', error);
    });
  }

  function removeQuery(index) {
    console.log('Removing query at index:', index);

    // Retrieve the queries from storage, remove the selected query, and update UI
    browser.storage.local.get('searchQueries').then((data) => {
      const searchQueries = data.searchQueries || [];
      searchQueries.splice(index, 1); // Remove the query at index

      // Save updated queries back to storage
      browser.storage.local.set({ searchQueries: searchQueries }).then(() => {
        // Update the UI after successful removal
        renderSearchQueries(searchQueries);
      }).catch((error) => {
        console.error('Failed to update search queries:', error);
      });
    }).catch((error) => {
      console.error('Error retrieving search queries for removal:', error);
    });
  }

  function searchQuery(index) {
    console.log('Searching query at index:', index);

    // Retrieve query details
    const row = document.querySelectorAll('#searchList tr')[index];
    const query = row.children[2].textContent;

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
});
