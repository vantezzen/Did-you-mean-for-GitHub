/**
 * "Did you mean... for GitHub" browser extension
 * Background scripts, checks if API token is provided and handles calls to the GitHub API
 */
// Check if API token is provided
chrome.storage.local.get(["token", "openedSettingsPage"], result => {
  if (!result.token && !result.openedSettingsPage) {
    chrome.runtime.openOptionsPage();

    // Only open settings page once
    chrome.storage.local.set({ openedSettingsPage: true });
  }
});

// Listen for messages from content script
// We cannot do this request in the content script as Firefox will block it
chrome.runtime.onMessage.addListener(
  (request, sender, sendResponse) => {
    if (request.type === 'find corrections') {
      const [ owner, name ] = request.data;

      // Find possible corrections
      window.findPossibleCorrections(owner, name)
        .then(possible => {
          console.debug(`[DYM...?] Found ${possible.length} possible corrections`);

          // Filter repos using GitHub GraphQL API
          window.contactGitHubAPI(possible)
            .then(existing => {
              console.debug(`[DYM...?] Found ${existing.length} existing corrections`);

              // Send data back to content script
              sendResponse(existing);
            })
            .catch(() => {
              console.debug(`[DYM...?] Could not connect to GitHub API`);

              // Could not filter out - send back whole array
              sendResponse(request.possible);
            });
        });
      
      // Return true so sendResponse doesn't get invalid 
      // (https://developer.chrome.com/extensions/runtime#event-onMessage)
      return true;
    } else if (request.type === 'open settings') {
      chrome.runtime.openOptionsPage();
    }
  }
);