document.addEventListener('DOMContentLoaded', function() {
    const enableCheckbox = document.getElementById('enableCheckbox');
  
    browser.storage.local.get('enabled').then(function(data) {
      enableCheckbox.checked = data.enabled !== false; // Default to true if not explicitly disabled
    }).catch(function(error) {
      console.error('Error retrieving data from storage:', error);
    });
  
    enableCheckbox.addEventListener('change', function() {
      browser.storage.local.set({ enabled: enableCheckbox.checked }).then(function() {
        console.log('Data successfully saved:', { enabled: enableCheckbox.checked });
      }).catch(function(error) {
        console.error('Error saving data to storage:', error);
      });
    });
  });
  