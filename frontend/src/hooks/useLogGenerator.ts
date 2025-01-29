import { useState, useEffect } from "react"
import { generateLog } from "@/utils/generateLog"

export function useLogGenerator() {
  const [logs, setLogs] = useState<string[]>([])

  useEffect(() => {
    const intervalId = setInterval(() => {
      setLogs((prevLogs) => [...prevLogs, generateLog()])
    }, 1000)

    return () => clearInterval(intervalId)
  }, [])

  return logs
}

