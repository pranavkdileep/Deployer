import  { useRef, useEffect, useState } from "react"
import { useLogGenerator } from "../hooks/useLogGenerator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export function AutoScrollingLogView() {
  const logs = useLogGenerator()
  const logContainerRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = 0
    }
  }, [logs, autoScroll])

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Auto-Scrolling Log View</h1>
      <div className="flex items-center space-x-2 mb-4">
        <Switch id="auto-scroll" checked={autoScroll} onCheckedChange={setAutoScroll} />
        <Label htmlFor="auto-scroll">Auto-scroll</Label>
      </div>
      <div
        ref={logContainerRef}
        className="bg-gray-900 text-green-400 p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm flex flex-col-reverse"
      >
        {logs
          .slice()
          .reverse()
          .map((log, index) => (
            <div key={index} className="mb-1">
              {log}
            </div>
          ))}
      </div>
    </div>
  )
}

