import { RefObject, useEffect, useState } from "react"

interface Args extends IntersectionObserverInit {
  freezeOnceVisible?: boolean
}

// from: https://usehooks-ts.com/react-hook/use-intersection-observer
export function useIntersectionObserver(
  elementRef: RefObject<Element>,
  {
    threshold = 0,
    root = null,
    rootMargin = "0%",
    freezeOnceVisible = true,
  }: Args,
): IntersectionObserverEntry | undefined {
  const [entry, setEntry] = useState<IntersectionObserverEntry>()

  const frozen = entry?.isIntersecting && freezeOnceVisible

  const updateEntry = ([entry]: IntersectionObserverEntry[]): void => {
    setEntry(entry)
  }

  useEffect(() => {
    const node = elementRef?.current // DOM Ref
    const hasIOSupport = !!window.IntersectionObserver

    if (!hasIOSupport || frozen || !node) return
    const observer = new IntersectionObserver(updateEntry, {
      threshold,
      root,
      rootMargin,
    })

    observer.observe(node)

    return () => {
      observer.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elementRef?.current, JSON.stringify(threshold), root, rootMargin, frozen])

  return entry
}
