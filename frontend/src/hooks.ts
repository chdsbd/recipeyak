import { isSameDay } from "date-fns"
import React from "react"

import { Theme, useUserFetch } from "@/queries/userFetch"
import { themeGet } from "@/theme"

export function useCurrentDay() {
  const [date, setDate] = React.useState(new Date())

  React.useEffect(() => {
    const timerID = setInterval(() => {
      const newDate = new Date()
      if (!isSameDay(date, newDate)) {
        setDate(newDate)
      }
    }, 5 * 1000)
    return () => {
      clearInterval(timerID)
    }
  }, [date])

  return date
}

interface IGlobalEventProps {
  readonly mouseUp?: (e: MouseEvent) => void
  readonly mouseDown?: (e: MouseEvent) => void
  readonly keyDown?: (e: KeyboardEvent) => void
  readonly keyUp?: (e: KeyboardEvent) => void
}

export function useGlobalEvent({
  mouseUp,
  mouseDown,
  keyDown,
  keyUp,
}: IGlobalEventProps) {
  React.useEffect(() => {
    if (keyUp) {
      document.addEventListener("keyup", keyUp)
    }
    return () => {
      if (keyUp) {
        document.removeEventListener("keyup", keyUp)
      }
    }
  }, [keyUp])
  React.useEffect(() => {
    if (keyDown) {
      document.addEventListener("keydown", keyDown)
    }
    return () => {
      if (keyDown) {
        document.removeEventListener("keydown", keyDown)
      }
    }
  }, [keyDown])
  React.useEffect(() => {
    if (mouseUp) {
      document.addEventListener("mouseup", mouseUp)
    }
    return () => {
      if (mouseUp) {
        document.removeEventListener("mouseup", mouseUp)
      }
    }
  }, [mouseUp])
  React.useEffect(() => {
    if (mouseDown) {
      document.addEventListener("mousedown", mouseDown)
    }
    return () => {
      if (mouseDown) {
        document.removeEventListener("mousedown", mouseDown)
      }
    }
  }, [mouseDown])
}

export function useOnClickOutside<T extends HTMLElement>(
  handler: (e: MouseEvent | TouchEvent) => void,
): React.MutableRefObject<T | null> {
  const ref = React.useRef<T | null>(null)

  React.useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref.current
      if (
        el == null ||
        (event.target instanceof HTMLElement && el.contains(event.target))
      ) {
        return
      }

      handler(event)
    }

    document.addEventListener("mousedown", listener)
    document.addEventListener("touchstart", listener)

    return () => {
      document.removeEventListener("mousedown", listener)
      document.removeEventListener("touchstart", listener)
    }
  }, [ref, handler])
  return ref
}

export function useUserId(): number | null {
  const res = useUserFetch()
  return res.data?.id ?? null
}

export function useUserTheme(): Theme {
  // caching to avoid some theme flashing -- still not perfect since the
  // index.html isn't preloaded with user data
  const user = useUserFetch()

  if (user.data?.theme == null) {
    return themeGet()
  }
  return user.data.theme
}

export function useUser() {
  const res = useUserFetch()
  return {
    id: res.data?.id ?? null,
    avatarURL: res.data?.avatar_url ?? "",
    email: res.data?.email ?? "",
    name: res.data?.name ?? "",
    scheduleTeamID: res.data?.schedule_team ?? null,
  }
}

export function useIsLoggedIn(): {
  authenticated: boolean
  isLoading: boolean
} {
  const res = useUserFetch()
  return { authenticated: res.data?.id != null, isLoading: res.isPending }
}

export function useTeamId(): number {
  const res = useUserFetch()
  // TODO: put this in the preload so we can avoid this
  return res.data?.schedule_team ?? -1
}
