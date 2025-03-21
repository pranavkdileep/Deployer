import { getResouces, saveResources } from "@/actions/project"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useEffect, useState } from "react"

export interface Resources {
  cpureservation : number,
  cpulimit : number,
  memoryreservation : number,
  memorylimit : number
}

export default function ResourcesCard({name}: {name: string}) {
  const [resources, setResources] = useState<Resources>({
    cpureservation: 0,
    cpulimit: 0,
    memoryreservation: 0,
    memorylimit: 0
  })
  const { toast } = useToast()

  useEffect(() => {
    const getResources = async () => {
      const res = await getResouces(name)
      setResources(res)
    }
    getResources()
  }, [])


  const handlesubmit = async () => {
    const result = await saveResources(name, resources)
    if (result) {
      setResources(result)
      toast({
        title: "Sucess",
        description: "Resources updated successfully",
      })
    } else {
      toast({
        title: "Error",
        description: "Failed to update Resources",
        variant: 'destructive'
      })
    }

  }


  return (
    <Card className="w-full max-w-4xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-gray-600">Resources</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="memory-reservation" className="flex items-center">
              Memory Reservation (MB) <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input id="memory-reservation" placeholder="0" value={resources.memoryreservation} onChange={(e)=>{
              setResources({...resources, memoryreservation: parseInt(e.target.value)})
            }} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="memory-limit" className="flex items-center">
              Memory Limit (MB) <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input id="memory-limit" placeholder="0" value={resources.memorylimit} onChange={(e)=>{
              setResources({...resources, memorylimit: parseInt(e.target.value)})
            }} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpu-reservation" className="flex items-center">
              CPU Reservation (Cores) <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input id="cpu-reservation" placeholder="0" value={resources.cpureservation} onChange={(e)=>{
              setResources({...resources, cpureservation: parseInt(e.target.value)})
            }} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpu-limit" className="flex items-center">
              CPU Limit (Cores) <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input id="cpu-limit" placeholder="0" value={resources.cpulimit} onChange={(e)=>{
              setResources({...resources, cpulimit: parseInt(e.target.value)})
            }} />
          </div>
        </div>

        <p className="text-sm text-gray-600 mt-4">Set values to 0 for unlimited resources</p>

        <Button className="mt-6 bg-emerald-600 hover:bg-emerald-700" onClick={handlesubmit}>Save</Button>
      </CardContent>
    </Card>
  )
}

