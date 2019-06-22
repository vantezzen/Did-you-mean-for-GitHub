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
                      ${repo.description ? `
                        <p class="pinned-item-desc text-gray text-small d-block mt-2 mb-3">
                          ${repo.description}
                        </p>
                      ` : ''}
                      
                      <p class="mb-0 f6 text-gray">
                        ${repo.language ? `
                          <span class="d-inline-block mr-3">
                            <span class="repo-language-color" style="background-color: ${repo.language.color}"></span>
                            <span itemprop="programmingLanguage">${repo.language.name}</span>
                          </span>
                        ` : ''}
                          
                        ${repo.stars ? `
                          <a href="/${repo.name}/stargazers" class="pinned-item-meta muted-link ">
                            <svg aria-label="stars" class="octicon octicon-star" viewBox="0 0 14 16" version="1.1" width="14" height="16" role="img"><path fill-rule="evenodd" d="M14 6l-4.9-.64L7 1 4.9 5.36 0 6l3.6 3.26L2.67 14 7 11.67 11.33 14l-.93-4.74L14 6z"></path></svg>
                            ${repo.stars > 999 ? Math.round(repo.stars / 1000) + 'k' : repo.stars}
                          </a>
                        ` : ''}

                        ${repo.technique ? `
                          <span class="d-inline-block ml-3">
                            <svg height="16" class="octicon octicon-light-bulb" viewBox="0 0 12 16" version="1.1" width="14" aria-hidden="true"><path fill-rule="evenodd" d="M6.5 0C3.48 0 1 2.19 1 5c0 .92.55 2.25 1 3 1.34 2.25 1.78 2.78 2 4v1h5v-1c.22-1.22.66-1.75 2-4 .45-.75 1-2.08 1-3 0-2.81-2.48-5-5.5-5zm3.64 7.48c-.25.44-.47.8-.67 1.11-.86 1.41-1.25 2.06-1.45 3.23-.02.05-.02.11-.02.17H5c0-.06 0-.13-.02-.17-.2-1.17-.59-1.83-1.45-3.23-.2-.31-.42-.67-.67-1.11C2.44 6.78 2 5.65 2 5c0-2.2 2.02-4 4.5-4 1.22 0 2.36.42 3.22 1.19C10.55 2.94 11 3.94 11 5c0 .66-.44 1.78-.86 2.48zM4 14h5c-.23 1.14-1.3 2-2.5 2s-2.27-.86-2.5-2z"></path></svg>
                              ${repo.technique}
                          </span>
                        ` : ''}
                        
                      </p>
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