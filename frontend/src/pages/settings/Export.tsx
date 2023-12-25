import { Download } from "react-feather"

import { Box } from "@/components/Box"
import { pathRecipesExportJson, pathRecipesExportYaml } from "@/paths"

export function ExportLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-2 rounded-md border border-solid border-[var(--color-border)] bg-[var(--color-background-card)] px-3 py-2 font-medium"
    >
      <Download size={20} />
      <span>{children}</span>
    </a>
  )
}

export function Export() {
  return (
    <Box dir="col" className="gap-1">
      <label className="text-xl font-bold">Export</label>
      <div className="flex gap-2">
        <ExportLink href={pathRecipesExportYaml({})}>recipes.yaml</ExportLink>
        <ExportLink href={pathRecipesExportJson({})}>recipes.json</ExportLink>
      </div>
    </Box>
  )
}