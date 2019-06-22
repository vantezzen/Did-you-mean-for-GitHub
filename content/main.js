/**
 * "Did you mean... for GitHub" browser extension
 * Content script, inserting list into page
 */
(async () => {
  // Check if 404 error
  if (
    document.title === 'Page not found · GitHub' ||
    document.title === 'Page not found · GitHub · GitHub') {
    // Add loading message
    const loadingElementSource = `
      <div id="did-you-mean-loading">
        <div class="text-gray mb-1 f2">
          Did you mean..?
        </div>
        <ol class="pinned-items-list mb-4 js-pinned-items-reorder-list">
          <li class="pinned-item-list-item d-flex  p-3 border border-gray-dark rounded-1 js-pinned-item-list-item public source reorderable sortable-button-item">
            <div class="pinned-item-list-item-content">
              <div class="d-flex width-full flex-items-center position-relative">
                Searching for repositories with similar names...
            </div>
          </li>
        </ol>
      </div>
    `
    // Turn source into html element
    let loadingContainer = document.createElement('div');
    loadingContainer.innerHTML = loadingElementSource;
    const loadingElement = loadingContainer.firstElementChild;

    // Insert loading message into page
    const parent = document.querySelector('div.container-lg.mt-5.px-3');
    parent.insertBefore(
      loadingElement,
      parent.firstElementChild
    )

    // Get repo name from URL
    let repo = /github.com\/[^\/]+\/[^\/]+/.exec(location.href)[0].replace('github.com/', '');

    if (repo) {
      // Split repo name into its components
      const data = repo.split('/');

      // Find corrections using background script
      chrome.runtime.sendMessage({ type: 'find corrections', data }, function(existing) {
        if (existing.length > 0) {
          // Check if API token is provided - used for showing info about adding a token
          chrome.storage.local.get(["token"], result => {
              // Build list
              let elementSource = `<div>
              <div class="text-gray mb-1 f2">
                Did you mean..?
              </div>`;
  
              if (!result.token) {
                elementSource += `<div class="text-gray mb-1 f5">
                  You can get more accurate results by providing a GitHub API token 
                  <a style="cursor:pointer;" id="did-you-mean-open-settings">in the extension settings</a>
                </div>`
              }
  
              elementSource += `<ol class="pinned-items-list mb-4 js-pinned-items-reorder-list">`
  
              for (const repo of existing) {
                elementSource += `
                  <li class="pinned-item-list-item d-flex  p-3 border border-gray-dark rounded-1 js-pinned-item-list-item public source reorderable sortable-button-item">
                    <div class="pinned-item-list-item-content">
                      <div class="d-flex width-full flex-items-center position-relative">
                        <svg class="octicon octicon-repo mr-2 text-gray" viewBox="0 0 12 16" version="1.1" width="12" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M4 9H3V8h1v1zm0-3H3v1h1V6zm0-2H3v1h1V4zm0-2H3v1h1V2zm8-1v12c0 .55-.45 1-1 1H6v2l-1.5-1.5L3 16v-2H1c-.55 0-1-.45-1-1V1c0-.55.45-1 1-1h10c.55 0 1 .45 1 1zm-1 10H1v2h2v-1h3v1h5v-2zm0-10H2v9h9V1z"></path></svg>
                        <a href="/${repo.name}" class="text-bold flex-auto ">
                          <span class="repo js-pinnable-item" title="${repo.name}">
                            ${repo.name}
                          </span>
                        </a>
                      </div>
                      ${repo.details ? `
                        ${repo.details.description ? `
                          <p class="pinned-item-desc text-gray text-small d-block mt-2 mb-3">
                            ${repo.details.description}
                          </p>
                        ` : ''}
                        
                        <p class="mb-0 f6 text-gray">
                          ${repo.details.language ? `
                            <span class="d-inline-block mr-3">
                              <span class="repo-language-color" style="background-color: ${repo.details.language.color}"></span>
                              <span itemprop="programmingLanguage">${repo.details.language.name}</span>
                            </span>
                          ` : ''}
                            
                          ${repo.details.stars ? `
                            <a href="/${repo.name}/stargazers" class="pinned-item-meta muted-link ">
                              <svg aria-label="stars" class="octicon octicon-star" viewBox="0 0 14 16" version="1.1" width="14" height="16" role="img"><path fill-rule="evenodd" d="M14 6l-4.9-.64L7 1 4.9 5.36 0 6l3.6 3.26L2.67 14 7 11.67 11.33 14l-.93-4.74L14 6z"></path></svg>
                              ${repo.details.stars > 999 ? Math.round(repo.details.stars / 1000) + 'k' : repo.details.stars}
                            </a>
                          ` : ''}
                        </p>
                      ` : ''}
                    </div>
                </li>`;
              }
  
              elementSource += `</ol></div>`;
  
              // Turn source into html element
              let container = document.createElement('div');
              container.innerHTML = elementSource;
              const element = container.firstElementChild;

              // Attach listener for settings open link
              if (element.querySelector('#did-you-mean-open-settings')) {
                element.querySelector('#did-you-mean-open-settings').addEventListener('click', () => {
                  chrome.runtime.sendMessage({ type: 'open settings' });
                })
              }
  
              // Remove loading element
              document.getElementById('did-you-mean-loading').remove();
  
              // Insert list into page
              parent.insertBefore(
                element,
                parent.firstElementChild
              )
          });
        } else {
          // No repos with similar names
          document.getElementById('did-you-mean-loading').remove();
        }
      });
    } else {
      // Could not get repo name
      document.getElementById('did-you-mean-loading').remove();
    }
  }
})();