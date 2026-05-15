import * as React from "react"

function TooltipProvider({ children }: React.PropsWithChildren) {
  return <>{children}</>
}

function Tooltip({ children }: React.PropsWithChildren) {
  return <>{children}</>
}

function TooltipTrigger({ children }: React.PropsWithChildren) {
  return <>{children}</>
}

function TooltipContent({ children }: React.PropsWithChildren) {
  return <span className="sr-only">{children}</span>
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger }
