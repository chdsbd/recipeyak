export function pathNamesEqual(a: string, b: string): boolean {
  const urlA = new URL(a, "https://example.com")
  const urlB = new URL(b, "https://example.com")
  return urlA.pathname === urlB.pathname
}

/**
 * Image sizes supported:
 * 100x100 for comment thumbnail images
 * 620x470 for header image
 * 1152x864 for gallery
 */
export function imgixFmt(url: string) {
  if (url === "" || !url.startsWith("http")) {
    return url
  }
  const u = new URL(url)
  u.searchParams.set("w", "1200")
  u.searchParams.set("q", "30")
  u.searchParams.set("fit", "clip")
  return u.toString()
}

export function imgixFmtSmall(url: string) {
  if (url === "" || !url.startsWith("http")) {
    return url
  }
  const u = new URL(url)
  u.searchParams.set("w", "100")
  u.searchParams.set("q", "75")
  u.searchParams.set("fit", "clip")
  return u.toString()
}

/**
 *  Open graph images are recommended to be 1200x630, so we use Imgix to crop.
 */
export function formatImgOpenGraph(x: string): string {
  if (!x) {
    return x
  }
  const u = new URL(x)
  u.searchParams.set("w", "1200")
  u.searchParams.set("h", "910")
  u.searchParams.set("fit", "crop")
  return u.toString()
}
