/**
 * "Did you mean... for GitHub" browser extension
 * Query GitHub API about if given repositories exist
 */
// Translation needed for building and parsing GraphQL query
const translation = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

const buildRepoExistsQuery = (repos) => {
  let query = `query {`;

  // Add search query for each repository
  for(const position in repos) {
    const repo = repos[position];

    query += `
      ${translation[position]} : search(query: "repo:${repo.name}" type:REPOSITORY) {
        repositoryCount
      }
    `
  }

  query += `}`;

  return query;
}

// Remove all repos that GitHub didn't find a result
const filterUnknownRepos = (result, repos) => {
  let filtered = [];

  for (const position in result) {
    const index = translation.indexOf(position);

    if (result[position].repositoryCount > 0) {
      filtered.push(repos[index]);
    }
  }

  return filtered;
}

window.onlyExistingRepos = (repos) => {
  return new Promise(async (resolve, reject) => {
    // Get API token
    chrome.storage.local.get(["token"], async (result) => {
      // Return full array if no token provided
      if (!result.token) {
        resolve(repos);
        return;
      }

      // Connect to GitHub GraphQL API
      const graph = graphql("https://api.github.com/graphql", {
        headers: {
          "Authorization": "bearer " + result.token
        },
        asJSON: true
      })

      const query = buildRepoExistsQuery(repos);
      const results = await graph(query)();

      const filtered = filterUnknownRepos(results, repos);

      resolve(filtered);
    });
  })
}