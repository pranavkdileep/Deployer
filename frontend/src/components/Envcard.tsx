import { useEffect, useState } from "react"
import { Copy, Eye, EyeOff, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EnvVariable } from "@/interfaces/types"
import { getProjectEnv, setProjectEnv } from "@/actions/project"
import { useToast } from "@/hooks/use-toast"



export default function Envcard({name}:{name:string}) {
  const [variables, setVariables] = useState<EnvVariable[]>([])
  const [showValues, setShowValues] = useState<Record<number, boolean>>({})
  const { toast } = useToast()

//   const copyToClipboard = (value:string) => {
//     navigator.clipboard.writeText(value)
//   }
  const getEnvVariables = async () => {
    const envs = await getProjectEnv(name)
    setVariables(envs)
  }
  const setEnvVariables = async () => {
    const result = await setProjectEnv(name, variables)
    console.log(result)
    if (result) {
      toast({
        title: "Sucess",
        description: "Environment Variables updated successfully",
      })
    } else {
      toast({
        title: "Error",
        description: "Failed to update Environment Variables",
        variant: 'destructive'
      })
    }
  }

  useEffect(() => {
    getEnvVariables()
  }, [])

  const addNewVariable = () => {
    const newId = variables.length > 0 ? Math.max(...variables.map((v) => v.id)) + 1 : 1
    setVariables([...variables, { id: newId, key: "", value: "" }])
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Environment Variables</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {variables.map((variable) => (
            <div key={variable.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={`var-${variable.id}`}>{variable.id}</Label>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setShowValues((prev) => ({
                        ...prev,
                        [variable.id]: !prev[variable.id],
                      }))
                    }
                    className="h-8 w-8"
                  >
                    {showValues[variable.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const text = `${variable.key}=${variable.value}`
                      navigator.clipboard.writeText(text)
                    }}
                    className="h-8 w-8"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  id={`var-${variable.id}-key`}
                  placeholder="KEY"
                  value={variable.key}
                  onChange={(e) =>
                    setVariables((vars) => vars.map((v) => (v.id === variable.id ? { ...v, key: e.target.value } : v)))
                  }
                  className="font-mono"
                />
                <Input
                  id={`var-${variable.id}-value`}
                  type={showValues[variable.id] ? "text" : "password"}
                  placeholder="VALUE"
                  value={variable.value}
                  onChange={(e) =>
                    setVariables((vars) =>
                      vars.map((v) => (v.id === variable.id ? { ...v, value: e.target.value } : v)),
                    )
                  }
                  className="font-mono"
                />
              </div>
            </div>
          ))}
        </div>
        <Button variant="outline" className="w-full" onClick={addNewVariable}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Variable
        </Button>
      </CardContent>
      <CardFooter className="flex items-center justify-end border-t pt-6">
        <Button onClick={setEnvVariables} className="bg-emerald-600 hover:bg-emerald-700">Save</Button>
      </CardFooter>
    </Card>
  )
}

