import { findAndReplace } from "mdast-util-find-and-replace"
import React from "react"
import ReactMarkdown, { Components } from "react-markdown"
import remarkBreaks from "remark-breaks"
import remarkGfm, { Root } from "remark-gfm"
import smartypants from "remark-smartypants"

import { Link } from "@/components/Routing"
import * as settings from "@/settings"
import { normalizeUnitsFracs } from "@/text"
import {
  THEME_CSS_BAKING_POWDER,
  THEME_CSS_BAKING_SODA,
} from "@/themeConstants"

const ALLOWED_MARKDOWN_TYPES: (keyof Components)[] = [
  "text",
  "s",
  "br",
  "blockquote",
  "p",
  "strong",
  "em",
  "li",
  "a",
  "link",
  "ol",
  "ul",
  // allow our baking soda, baking powder replacer thing to work
  "span",
]

function renderLink({
  href,
  ...props
}: React.DetailedHTMLProps<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  HTMLAnchorElement
>) {
  const linkCss = "underline hover:no-underline"
  if (href?.startsWith(settings.DOMAIN)) {
    const to = new URL(href).pathname
    return (
      <Link {...props} to={to} children={to.substring(1)} className={linkCss} />
    )
  }
  return <a {...props} href={href} className={linkCss} />
}

function renderUl({
  children,
  ...props
}: React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLUListElement>,
  HTMLUListElement
>) {
  return (
    <ul {...props} className="mb-2 list-inside list-disc">
      {children}
    </ul>
  )
}

function renderOl({
  children,
  ...props
}: React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLOListElement>,
  HTMLOListElement
>) {
  return (
    <ol {...props} className="mb-2 list-inside list-decimal">
      {children}
    </ol>
  )
}

function renderP({
  children,
  ...props
}: React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLParagraphElement>,
  HTMLParagraphElement
>) {
  return (
    // eslint-disable-next-line react/forbid-elements
    <p {...props} className="last-child:mb-0 mb-2">
      {children}
    </p>
  )
}

function renderBlockQuote({
  children,
  ...props
}: React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLQuoteElement>,
  HTMLQuoteElement
>) {
  return (
    <blockquote
      {...props}
      className="mb-2 border-y-0 border-l-[3px] border-r-0 border-solid border-l-[var(--color-border)] pl-2"
    >
      {children}
    </blockquote>
  )
}

// setup a lot of renderers so we can style the individual tags
const renderers = {
  a: renderLink,
  ul: renderUl,
  ol: renderOl,
  p: renderP,
  blockquote: renderBlockQuote,
}

function remarkHighlightBakingSodaAndPowder() {
  return (tree: Root): undefined => {
    findAndReplace(tree, [
      /(baking soda|baking powder)/gi,
      (value: string) => {
        // Took me a while to figure out how to inject a <span> into the markdown
        // Spelunking through the various packages lead me to:
        // https://github.com/rhysd/remark-emoji/blob/e4b9918ede15cddd6316f410cc53b83ed9afe549/index.js#L22-L37
        //
        // We need to dupe the value otherwise it doesn't typecheck, runtime seems fine
        const cls =
          value === "baking soda"
            ? THEME_CSS_BAKING_SODA
            : THEME_CSS_BAKING_POWDER
        return {
          type: "text",
          value,
          data: {
            hName: "span",
            hProperties: {
              class: cls,
            },
            hChildren: [{ type: "text", value }],
          },
        }
      },
    ])
  }
}

export function Markdown({ children: text }: { children: string }) {
  return (
    <div className="cursor-auto select-text [word-break:break-word]">
      <ReactMarkdown
        allowedElements={ALLOWED_MARKDOWN_TYPES}
        remarkPlugins={[
          // enable auto-linking of urls & other github flavored markdown features
          remarkGfm,
          // make new lines behave like github comments
          //
          //   Mars is
          //   the fourth planet
          //
          // becomes:
          //
          //   <p>Mars is<br>
          //   the fourth planet</p>
          //
          // instead of without the plugin:
          //
          //   <p>Mars is
          //   the fourth planet</p>
          //
          remarkBreaks,
          // auto convert -- to em dash and similar
          smartypants,
          remarkHighlightBakingSodaAndPowder,
        ]}
        children={normalizeUnitsFracs(text)}
        components={renderers}
        unwrapDisallowed
      />
    </div>
  )
}
