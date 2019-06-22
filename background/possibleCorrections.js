/**
 * "Did you mean... for GitHub" browser extension
 * Find possible corrections for repo name
 * 
 * This will:
 * - Search for popular GitHub repos with a similar name
 * - Search for popular GitHub user with a similar name
 * - Search in english dictionary for word similar to repo name
 */
// Handle string case
// Dash case
const isDashCase = (str) => {
  return /(\w+-)+\w+/i.test(str);
}
const splitDashCase = (str) => {
  return str.split('-');
}
const buildDashCase = (arr) => {
  return arr.join('-');
}

// Lower camel case
const isLowerCamelCase = (str) => {
  return /[a-z]+([A-Z][a-z]+)+/.test(str);
}
const buildLowerCamelCase = (arr) => {
  let str = arr[0].toLowerCase();

  for (const position in arr) {
    if (position === 0) continue;

    // Capitalize first letter
    str += arr[position].charAt(0).toUpperCase() + arr[position].slice(1).toLowerCase();
  }

  return str;
}

// Upper camel case
const isUpperCamelCase = (str) => {
  return /([A-Z][a-z]+)+/.test(str);
}
const buildUpperCamelCase = (arr) => {
  let str = '';
  for (const position in arr) {
    // Capitalize first letter
    str += arr[position].charAt(0).toUpperCase() + arr[position].slice(1).toLowerCase();
  }

  return str;
}
const splitCamelCase = (str) => {
  return str.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().split(' ');
}

// Helper
const buildCase = (arr, stringCase) => {
  switch(stringCase) {
    case 'dash':
      return buildDashCase(arr);
    case 'lowerCamel':
      return buildLowerCamelCase(arr);
    case 'upperCamel':
      return buildUpperCamelCase(arr);
    default:
      return arr[0];
  }
}

// Create all possible permutations of an array
const permutate = (array) => {
  function p(array, temp) {
      var i, x;
      if (!array.length) {
          result.push(temp);
      }
      for (i = 0; i < array.length; i++) {
          x = array.splice(i, 1)[0];
          p(array, temp.concat(x));
          array.splice(i, 0, x);
      }
  }

  var result = [];
  p(array, []);
  return result;
}

// Find possible corrections for current 404
window.findPossibleCorrections = (owner, name, limit = 50) => {
  return new Promise((resolve, reject) => {
    let possibleRepoName = [];

    // Find out case and split name
    let stringCase = false;
    let split = [];
  
    if (isDashCase(name)) {
      stringCase = 'dash';
      split = splitDashCase(name);
    } else if (isLowerCamelCase(name)) {
      stringCase = 'lowerCamel';
      split = splitCamelCase(name);
    } else if (isUpperCamelCase(name)) {
      stringCase = 'upperCamel';
      split = splitCamelCase(name);
    } else {
      stringCase = 'none';
      split = [name];
    }
  
    // Find corrections for splitted words using english dictionary
    for (const word in split) {
      window.__DID_YOU_MEAN_DICTIONARY__.forEach((s2) => {
        // Calculate Damerau-Levenshtein distance
        const d = window.__DID_YOU_MEAN_distance__(split[word], s2);
  
        // Only use close words
        if (d < 5) {
          const corrected = [...split];
          corrected[word] = s2;
          possibleRepoName.push({
            name: owner + '/' + buildCase(corrected, stringCase),
            confidence: 10 - (d * 3),
            technique: 'dictionary'
          })
        }
      });
    }

    // Find corrections by permutating words
    if (split.length > 1 && split.length <= 3) {
      const permutations = permutate(split);

      for (const permutation of permutations) {
        if (permutation == split) continue;

        possibleRepoName.push({
          name: owner + '/' + buildCase(permutation, stringCase),
          confidence: 20,
          technique: 'permutation'
        })
      }
    }
  
    // Find if there is popular repository that is named similarly
    const nameWithOwner = `${owner}/${name}`.toLowerCase()
  
    window.__DID_YOU_MEAN_POPULAR_REPOS__.forEach((s2) => {
      // Calculate Damerau-Levenshtein distance
      const d = window.__DID_YOU_MEAN_distance__(nameWithOwner, s2);
  
      if (d < 10) {
        possibleRepoName.push({
          name: s2,
          confidence: 100 - (d * 15),
          technique: 'popular'
        });
      }
    });
  
    // Find if there are users with a similar name
    window.__DID_YOU_MEAN_POPLAR_USERS__.forEach((s2) => {
      // Calculate Damerau-Levenshtein distance
      const d = window.__DID_YOU_MEAN_distance__(owner, s2);
  
      if (d < 5) {
        possibleRepoName.push({
          name: `${s2}/${name}`,
          confidence: 50 - (d * 10),
          technique: 'username'
        })
      }
    });

    // Sort by confidence (higher confidence first)
    possibleRepoName.sort((a, b) => b.confidence - a.confidence)

    // Limit array to make filtering faster
    possibleRepoName = possibleRepoName.splice(0, limit * 2)
  
    // Filter out duplicates
    possibleRepoName = possibleRepoName.filter(repo => {
      // Find out if there are multiple items with this name
      const items = possibleRepoName.filter(item => item.name === repo.name);

      if (items.length > 1) {
        // Find out if is item with highest confidence
        let isHighestConfidence = true;

        for (const item of items) {
          if (item.confidence > repo.confidence) {
            isHighestConfidence = false;
            break;
          }
        }

        // Only keep if is item with highest confidence
        return isHighestConfidence;
      }
      return true;
    })
  
    // Return limited results
    resolve(possibleRepoName.splice(0, limit));
  })
}
