import { CheckCircle, XCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import Cookies from "js-cookie"
import axios, { AxiosResponse } from "axios"

interface Deployment {
  id: string
  created_at: string
  status: "failed" | "success"
  log: string
  name: string
}

export default function DeploymentHistory({ name }: { name: string }) {

  const [selectedLog, setSelectedLog] = useState<string | null>(null)
  const [isloaded, setIsLoaded] = useState(false)
  const { toast } = useToast()
  const [deployments, setDeployments] = useState<Deployment[]>([])
  useEffect(() => {
    let data = JSON.stringify({
      "name": name
    });
    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: '/api/projects/getDeployments',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Cookies.get('token')}`
      },
      data: data
    };
    axios.request(config)
      .then((response : AxiosResponse<Deployment[] , {}>) => {
        setDeployments(response.data)
        setIsLoaded(true)
      })
      .catch((error) => {
        console.log(error);
        toast({
          title: "Error",
          description: "Failed to fetch deployment history"
        })
      });
  }, [])
  return (
    <div className="w-full max-w-4xl mx-auto p-6 pt-8">
      <h1 className="text-2xl font-semibold mb-6">Deployment History</h1>
      {!isloaded && <h2 className="text-lg font-semibold mb-4">Loading data.....</h2>}
      {isloaded && (<div className="space-y-4">
        {deployments.map((deployment) => (
          <Card
            key={deployment.id}
            className={`p-4 flex items-center justify-between ${deployment.status === "failed" ? "bg-red-100" : "bg-green-100"
              }`}
          >
            <div className="flex items-center gap-3">
              {deployment.status === "failed" ? (
                <XCircle className="h-5 w-5 text-red-600" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
              <span className="font-medium">{deployment.status === "failed" ? "Failed" : "Done"}</span>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(deployment.created_at), { addSuffix: true })}
              </span>
              <button
                onClick={() => setSelectedLog(deployment.log)}
                className="px-4 py-1 bg-white rounded-md shadow-sm hover:bg-gray-50"
              >
                View
              </button>
            </div>
          </Card>
        ))}
      </div>)}
      <Dialog open={selectedLog !== null} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deployment Log</DialogTitle>
          </DialogHeader>
          <div className="bg-black rounded-md p-4 mt-4 max-h-[60vh] overflow-auto">
            <pre className="text-white font-mono text-sm whitespace-pre-wrap overflow-x-auto">{selectedLog}</pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

