const logTypes = ["INFO", "WARNING", "ERROR", "DEBUG"]
const logMessages = [
  "User logged in",
  "Database connection established",
  "API request failed",
  "Cache cleared",
  "File upload completed",
  "Payment processed",
  "Email sent",
  "New user registered",
  "Server restarted",
  "Memory usage high",
]

export function generateLog(): string {
  const timestamp = new Date().toISOString()
  const type = logTypes[Math.floor(Math.random() * logTypes.length)]
  const message = logMessages[Math.floor(Math.random() * logMessages.length)]
  return `[${timestamp}] ${type}: ${message}`
}

