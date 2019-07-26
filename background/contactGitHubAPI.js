/**
 * "Did you mean... for GitHub" browser extension
 * Query GitHub API about if given repositories exist
 */
// Translation needed for building and parsing GraphQL query
const translation = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

const buildGraphQLQuery = (repos, originalName) => {
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

  query += `
    search(query: "${originalName}" type:REPOSITORY first:5) {
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

  query += `}`;

  return query;
}


const applyGitHubResults = (result, repos, originalNameWithOwner) => {
  let filtered = [];

  // Filter out non-existent repos and add details
  for (const position in result) {
    const index = translation.indexOf(position);

    if (result[position].repositoryCount > 0) {
      filtered.push({
        ...repos[index],
        stars: result[position].edges[0].node.stargazers.totalCount,
        description: result[position].edges[0].node.description,
        language: result[position].edges[0].node.primaryLanguage
      });
    }
  }

  // Add results from searching for repo name
  console.log('1', filtered, result)
  if (result.search.repositoryCount > 0) {
    for(const repo of result.search.edges) {
      const d = window.__DID_YOU_MEAN_distance__(originalNameWithOwner, repo.node.nameWithOwner);

      filtered.push({
        name: repo.node.nameWithOwner,
        confidence: 60 - (d * 3),
        technique: 'search',
        stars: repo.node.stargazers.totalCount,
        description: repo.node.description,
        language: repo.node.primaryLanguage
      });
    }
  }
  console.log('2', filtered)

  return filtered;
}

window.contactGitHubAPI = (repos, originalOwner, originalName) => {
  return new Promise(async (resolve, reject) => {
    // Get API token
    chrome.storage.local.get(["token"], (result) => {
      // Return full array if no token provided
      if (!result.token) {
        resolve(repos);
        return;
      }

      // Query GitHub API
      const query = buildGraphQLQuery(repos, originalName);
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
        const filtered = applyGitHubResults(result.data, repos, originalOwner + '/' + originalName);

        resolve(filtered);
      });
    });
  })
}