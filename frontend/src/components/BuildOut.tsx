import { buildoutstreem } from "@/actions/project"
import { useEffect, useRef, useState } from "react"
import { Switch } from "./ui/switch"
import { Label } from "./ui/label"

function BuildOut({name}: {name: string}) {
    const [buildOut, setBuildOut] = useState<string>("")
    const logContainerRef = useRef<HTMLDivElement>(null)
    const [autoScroll, setAutoScroll] = useState(true)
  
    const buildOutgen = async () => {
        buildoutstreem(name,(log:string)=>{
            setBuildOut(log)
        })
    }

    useEffect(() => {
        buildOutgen()
    }, [])

    useEffect(() => {
        if (autoScroll && logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
        }
    }, [buildOut, autoScroll])

    
  return (
    <>
    <div className="w-full max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Build Log View</h1>
      <div className="flex items-center space-x-2 mb-4">
        <Switch id="auto-scroll" checked={autoScroll} onCheckedChange={setAutoScroll} />
        <Label htmlFor="auto-scroll">Auto-scroll</Label>
      </div>
      <div
        ref={logContainerRef}
        className="bg-gray-900 text-green-400 p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm flex flex-col-reverse"
      >
        {buildOut
        .split("\n")
          .slice()
          .reverse()
          .map((log, index) => (
            <div key={index} className="mb-1">
              {log}
            </div>
          ))}
      </div>
    </div>
    </>
  )
}

export default BuildOut