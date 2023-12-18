import { ForwardedRef, forwardRef } from "react"

import { clx } from "@/classnames"

export function Label({
  children,
  htmlFor,
}: {
  children: React.ReactNode
  htmlFor?: string
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-base font-bold"
      children={children}
    />
  )
}

export const BetterLabel = forwardRef(
  (
    {
      children,
      cursor,
      ...props
    }: { htmlFor?: string; children: React.ReactNode; cursor?: "move" },
    ref: ForwardedRef<HTMLLabelElement>,
  ) => {
    return (
      <label
        ref={ref}
        className={clx("mr-3 font-bold", cursor && "cursor-move")}
        children={children}
        {...props}
      />
    )
  },
)
