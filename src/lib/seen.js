const KEY = 'bs-seen-version'

export function getSeenVersion() {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function markSeen(version) {
  try {
    localStorage.setItem(KEY, version)
  } catch {
    /* no storage: the card will just show again */
  }
}
