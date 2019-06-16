/**
 * "Did you mean... for GitHub" browser extension
 * Options page, saves the provided API token
 */
// Restore current token
function restoreOptions() {
  function setCurrentChoice(result) {
    if (result.token) {
      document.getElementById('token').value = result.token;
    }
  }
  chrome.storage.local.get(["token"], setCurrentChoice);
}

// Save new token
document.getElementById('save').addEventListener('click', () => {
  const token = document.getElementById('token').value;
  chrome.storage.local.set({ token });
  document.getElementById('success').style.display = "block";
})

document.addEventListener("DOMContentLoaded", restoreOptions);