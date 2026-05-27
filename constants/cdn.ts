const GITHUB_USER = 'subbu-h21'
const GITHUB_REPO = 'tailor-templates'
const BRANCH = 'main'

export const CDN_BASE =
  `https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@${BRANCH}`

export const CATALOG_URL = `${CDN_BASE}/index.json`

export function templateUrl(path: string): string {
  return `${CDN_BASE}/${path}`
}
