import { useState, useEffect } from "react"
import { generateLog } from "@/utils/generateLog"

export function useLogGenerator(name:string) {
  const [logs, setLogs] = useState<string[]>([])

  useEffect(() => {
    generateLog(name,(log:string)=>{
      setLogs((prevLogs) => [...prevLogs, log])
    })
  }, [])

  return logs
}

