// Listen for changes in extension enabled status
browser.storage.local.get('enabled').then((data) => {
  const isEnabled = data.enabled !== false; // Default to true if not explicitly disabled

  if (isEnabled) {
    // Listen to navigation events
    browser.webNavigation.onCommitted.addListener(handleCommittedNavigation);
  } else {
    // Remove listener if disabled
    browser.webNavigation.onCommitted.removeListener(handleCommittedNavigation);
  }
});

// When the extension is installed or updated, open or activate the pinned tab
browser.runtime.onInstalled.addListener(async () => {
  let isEnabled = true;
  try {
    const data = await browser.storage.local.get('enabled');
    isEnabled = data.enabled !== false;
  } catch (error) {
    console.error('Error fetching enabled status:', error);
  }

  if (isEnabled) {
    let pinnedTab = await findPinnedTab();
    if (!pinnedTab) {
      // Pin the tab if it's not already pinned
      browser.tabs.create({
        url: browser.extension.getURL('pinned-tab.html'),
        pinned: true
      }).then((tab) => {
        console.log('Pinned tab created:', tab);
      }).catch((error) => {
        console.error('Error creating pinned tab:', error);
      });
    } else {
      // Activate the existing pinned tab if found
      browser.tabs.update(pinnedTab.id, { active: true }).then(() => {
        console.log('Pinned tab activated:', pinnedTab);
      }).catch((error) => {
        console.error('Error activating pinned tab:', error);
      });
    }
  }
});

async function findPinnedTab() {
  let tabs = await browser.tabs.query({ url: browser.extension.getURL('pinned-tab.html') });
  return tabs.find(tab => tab.pinned);
}

function handleCommittedNavigation(details) {
  console.log('Committed navigation:', details);

  // Check if the extension is enabled
  browser.storage.local.get('enabled').then((data) => {
    const isEnabled = data.enabled !== false; // Default to true if not explicitly disabled

    if (isEnabled && details.transitionType === 'generated') {
      const url = new URL(details.url);
      const searchParams = new URLSearchParams(url.search);
      console.log(`url: ${url}`);
      console.log(`searchParams: ${searchParams}`);
      if (searchParams.has('q')) {
        const query = searchParams.get('q');
        const hostname = url.hostname;

        // Initialize searchEngine variable
        let searchEngine = hostname;

        // Retrieve available search engines
        browser.search.get().then((engines) => {
          engines.forEach((engine) => {
            const firstWordOfName = engine.name.split(' ')[0].toLowerCase();

            if (hostname.includes(firstWordOfName)) {
              searchEngine = engine.name;
              console.log(`Intercepted search query: ${query} from ${searchEngine}`);
              // Save the search query and engine to local storage with timestamp
              saveSearchQuery(query, searchEngine);
            }
          });
        });

        // Inject content script to stop navigation
        injectContentScript(details.tabId, 'window.stop();');

        // Cancel the original navigation
        return { cancel: true };
      }
    }
  }).catch((error) => {
    console.error('Error checking enabled status:', error);
  });
}

function saveSearchQuery(query, searchEngine) {
  // Retrieve existing queries or initialize empty array
  browser.storage.local.get('searchQueries').then((data) => {
    const searchQueries = data.searchQueries || [];
    searchQueries.push({ query: query, searchEngine: searchEngine, timestamp: Date.now() });

    // Save updated queries back to local storage
    browser.storage.local.set({ searchQueries: searchQueries }).then(() => {
      console.log('Search query saved successfully:', query, searchEngine);
      // Update pinned tab UI if it's open
    }).catch((error) => {
      console.error('Failed to save search query:', error);
    });
  }).catch((error) => {
    console.error('Error retrieving search queries:', error);
  });
}

function injectContentScript(tabId, code) {
  browser.tabs.executeScript(tabId, {
    code: code,
    runAt: 'document_start'  // Ensure it executes as soon as possible
  }).then(() => {
    console.log('Content script injected successfully');
  }).catch((error) => {
    console.error('Failed to inject content script:', error);
  });
}
