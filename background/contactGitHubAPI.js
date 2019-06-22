/**
 * "Did you mean... for GitHub" browser extension
 * Query GitHub API about if given repositories exist
 */
// Translation needed for building and parsing GraphQL query
const translation = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

const buildGraphQLQuery = (repos) => {
  let query = `query {`;

  // Add search query for each repository
  for(const position in repos) {
    const repo = repos[position];

    query += `
      ${translation[position]} : search(query: "repo:${repo.name}" type:REPOSITORY first:1) {
        repositoryCount
        edges {
          node {
            ...on Repository {
              nameWithOwner
              stargazers {
                totalCount
              }
              description
              primaryLanguage {
                name
                color
              }
            }
          }
        }
      }
    `
  }

  query += `}`;

  return query;
}


const applyGitHubResults = (result, repos) => {
  let filtered = [];

  for (const position in result) {
    const index = translation.indexOf(position);

    if (result[position].repositoryCount > 0) {
      console.log(result[position]);
      filtered.push({
        ...repos[index],
        details: {
          stars: result[position].edges[0].node.stargazers.totalCount,
          description: result[position].edges[0].node.description,
          language: result[position].edges[0].node.primaryLanguage
        }
      });
    }
  }

  return filtered;
}

window.contactGitHubAPI = (repos) => {
  return new Promise(async (resolve, reject) => {
    // Get API token
    chrome.storage.local.get(["token"], (result) => {
      // Return full array if no token provided
      if (!result.token) {
        resolve(repos);
        return;
      }

      // Query GitHub API
      const query = buildGraphQLQuery(repos);
      fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          "Authorization": "bearer " + result.token
        },
        body: JSON.stringify({ query })
      })
      .then(r => r.json())
      .then(result => {
        const filtered = applyGitHubResults(result.data, repos);

        resolve(filtered);
      });
    });
  })
}