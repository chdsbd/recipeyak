import { addWeeks, startOfToday } from "date-fns"
import { Location } from "history"
import { clamp } from "lodash-es"
import { ArrowRight, ChevronRight, PlusIcon, Search } from "lucide-react"
import { useRef, useState } from "react"
import { useHistory, useLocation } from "react-router"
import useOnClickOutside from "use-onclickoutside"

import { isMobile } from "@/browser"
import { clx } from "@/classnames"
import { Palette } from "@/components/Palette"
import { SearchPalette } from "@/components/SearchPalette"
import { toISODateString } from "@/date"
import { isInputFocused } from "@/input"
import { pathHome, pathRecipeAdd, pathRecipesList, pathSchedule } from "@/paths"
import { addQueryParams } from "@/querystring"
import { useGlobalEvent } from "@/useGlobalEvent"

let currentId = 0
function id() {
  return currentId++
}

const iconWidth = 14
const options = [
  {
    id: id(),
    name: "Search Recipes",
    icon: <Search size={iconWidth} />,
    openSearch: true,
    visible: () => {
      return true
    },
  },
  {
    id: id(),
    name: "Go to Browse Recipes",
    icon: <ArrowRight size={iconWidth} />,
    href: pathRecipesList({}),
    visible: () => {
      return "pathname"
    },
  },
  {
    id: id(),
    name: "Go to Calendar",
    icon: <ArrowRight size={iconWidth} />,
    href: pathSchedule({}),
    visible: () => {
      return "pathname"
    },
  },
  {
    id: id(),
    name: "Go to Home",
    icon: <ArrowRight size={iconWidth} />,
    href: pathHome({}),
    visible: () => {
      return "pathname"
    },
  },
  {
    id: id(),
    name: "Create Recipe",
    icon: <PlusIcon size={iconWidth} />,
    href: pathRecipeAdd({}),
    visible: () => {
      return "pathname"
    },
  },
  {
    id: id(),
    name: "Create Shopping List",
    icon: <PlusIcon size={iconWidth} />,
    href: ({ location }: { location: Location<unknown> }) => {
      return (
        pathSchedule({}) +
        addQueryParams(location.search, {
          shoppingStartDay: toISODateString(startOfToday()),
          shoppingEndDay: toISODateString(addWeeks(startOfToday(), 1)),
        })
      )
    },
    visible: () => {
      return true
    },
  },
  {
    id: id(),
    name: "Create Scheduled Recipe",
    icon: <PlusIcon size={iconWidth} />,
    href: ({ location }: { location: Location<unknown> }) => {
      return (
        pathSchedule({}) +
        addQueryParams(location.search, {
          schedule: "1",
        })
      )
    },
    visible: () => {
      return true
    },
  },
]

export function CommandPalette() {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [query, setQuery] = useState("")
  const location = useLocation()
  const hits = options.filter((x) => {
    if (typeof x.visible === "function") {
      const result = x.visible()
      if (result === "pathname") {
        if (x.href === location.pathname) {
          return false
        }
      } else if (!result) {
        return false
      }
    }

    return x.name.toLocaleLowerCase().includes(query.toLocaleLowerCase())
  })

  function handleSelect(suggestion: (typeof hits)[number]) {
    if (suggestion?.href) {
      if (typeof suggestion.href === "function") {
        history.push(suggestion.href({ location }))
      } else {
        history.push(suggestion.href)
      }
      resetForm()
    } else if (suggestion?.openSearch) {
      setShowSearchPopover(true)
      setShowCommandPalettePopover(false)
      setQuery("")
      setSelectedIndex(0)
    }
  }
  const suggestions = hits.map((hit, index) => {
    const isCurrentSelection = index === selectedIndex
    return (
      <div
        key={hit.id}
        onClick={() => {
          handleSelect(hit)
        }}
        className={clx(
          "cursor-pointer overflow-x-hidden text-ellipsis whitespace-nowrap px-2 py-2",
          isCurrentSelection &&
            !isMobile() &&
            "rounded-md bg-[--color-border-selected-day]",
        )}
      >
        <div className="flex items-center gap-2">
          <div className="flex flex-col overflow-x-hidden text-ellipsis whitespace-pre">
            <div className="flex items-center gap-2">
              {hit.icon}
              <div
                className={clx(
                  "grow-0 overflow-x-hidden text-ellipsis whitespace-pre",
                )}
              >
                {hit.name}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  })

  const resetForm = () => {
    setQuery("")
    setSelectedIndex(0)
    setShowCommandPalettePopover(false)
    setShowSearchPopover(false)
  }
  const history = useHistory()

  const [showSearchPopover, setShowSearchPopover] = useState(false)
  const handleSearchKeydown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // We need to extract the key from the synthetic event before we lose the
    // event.
    switch (e.key) {
      case "Escape": {
        // end up with the trigger button focused when a user hits
        // escape so they can press enter to open the modal again
        resetForm()
        // searchInputRef.current?.focus()
        break
      }
      case "ArrowUp":
        // prevent arrow key from moving cursor to start of input
        e.preventDefault()
        setSelectedIndex((s) => clamp(s - 1, 0, hits.length - 1))
        break
      case "ArrowDown":
        // prevent arrow key from moving cursor to end of input
        e.preventDefault()
        setSelectedIndex((s) => clamp(s + 1, 0, hits.length - 1))
        break
      case "Enter": {
        const suggestion = hits?.[selectedIndex]
        handleSelect(suggestion)
        break
      }
    }
  }
  const [showCommandPalettePopover, setShowCommandPalettePopover] =
    useState(false)

  useGlobalEvent({
    keyDown(e) {
      if (e.key === "k" && e.metaKey) {
        e.preventDefault()
        if (showSearchPopover) {
          debugger
          setShowSearchPopover(false)
          setQuery("")
          setSelectedIndex(0)
          setShowCommandPalettePopover(true)
        } else if (!isInputFocused() && !showCommandPalettePopover) {
          setShowCommandPalettePopover(true)
        } else if (showCommandPalettePopover) {
          setShowCommandPalettePopover(false)
        }
      }
    },
  })

  const searchContainerRef = useRef(null)
  useOnClickOutside(searchContainerRef, () => {
    resetForm()
  })

  if (showSearchPopover) {
    return (
      <SearchPalette
        selectedIndex={selectedIndex}
        query={query}
        setSelectedIndex={setSelectedIndex}
        setQuery={(query) => {
          setQuery(query)
          // If we start searching after we already selected a
          // suggestion, we should reset back to the initial state aka 0
          if (selectedIndex !== 0) {
            setSelectedIndex(0)
          }
        }}
        onClose={() => {
          resetForm()
        }}
        searchInputRef={null}
      />
    )
  }
  if (showCommandPalettePopover) {
    return (
      <Palette
        ref={searchContainerRef}
        icon={<ChevronRight size={16} />}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          // If we start searching after we already selected a
          // suggestion, we should reset back to the initial state aka 0
          if (selectedIndex !== 0) {
            setSelectedIndex(0)
          }
        }}
        onKeyDown={handleSearchKeydown}
        suggestions={suggestions}
      />
    )
  }
  return null
}
