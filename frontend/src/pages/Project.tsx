import {useParams} from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Terminal, RefreshCw, StopCircle } from 'lucide-react'
import { useState } from 'react'
import { Label } from "@/components/ui/label"

export default function DeploymentSettings() {
  const {name} = useParams<{name: string}>()
  const [activeTab, setActiveTab] = useState("github")
  const [deployMethod, setDeployMethod] = useState('');
  return (
    <div className="min-h-screen bg-background p-6">
      <h1 className="text-2xl font-semibold mb-4">Deployment Settings for {name}</h1>
      <div className="mb-6">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="environment">Environment</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="deployments">Deployments</TabsTrigger>
            <TabsTrigger value="domains">Domains</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deploy Settings</CardTitle>
          <p className="text-sm text-muted-foreground">
            Create a compose file to deploy your compose
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-2">
            <Button className="active:scale-95 transition-transform hover:opacity-90">Deploy</Button>
            <Button variant="secondary" className="active:scale-95 transition-transform hover:opacity-90">
              Autodeploy
            </Button>
            <Button variant="secondary" className="active:scale-95 transition-transform hover:opacity-90">
              <RefreshCw className="mr-2 h-4 w-4" />
              Rebuild
            </Button>
            <Button variant="destructive" className="active:scale-95 transition-transform hover:opacity-90">
              <StopCircle className="mr-2 h-4 w-4" />
              Stop
            </Button>
            <Button variant="outline" className="active:scale-95 transition-transform hover:opacity-90">
              <Terminal className="mr-2 h-4 w-4" />
              Open Terminal
            </Button>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Provider</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Select the source of your code
            </p>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList>
                <TabsTrigger value="github">Github</TabsTrigger>
                <TabsTrigger value="raw">Raw</TabsTrigger>
              </TabsList>
            </Tabs>

            {activeTab === "raw" && (
              <div className="mt-4">
                <Label htmlFor="file-upload" className="block text-sm font-medium text-gray-700">
                  Upload Project Zip File
                </Label>
                <Input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="mt-1 block w-full"
                  accept=".yml,.yaml"
                />
              </div>
            )}

            {(activeTab === "github") && (
              <div>
                <label htmlFor="repository" className="text-sm font-medium mb-2 block">Repository</label>
                <Input 
                  id="repository"
                  placeholder="https://github.com/pranavkd/demo"
                  className="w-full"
                />
              </div>
            )}

            <div className="space-y-4">
              <div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Deploy Methods</label>
                  <Select onValueChange={(value) => setDeployMethod(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select deploy method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="docker">Docker</SelectItem>
                      <SelectItem value="nix">Nix Build</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {deployMethod === 'docker' && (
                  <div className="mt-4">
                    <label htmlFor="dockerFile" className="text-sm font-medium mb-2 block">Docker File Name</label>
                    <Input id="dockerFile" placeholder="Enter Docker file name" />
                  </div>
                )}
                {deployMethod === 'nix' && (
                  <div className="space-y-4 mt-4">
                    <div>
                      <label htmlFor="buildCommand" className="text-sm font-medium mb-2 block">Build Command</label>
                      <Input id="buildCommand" placeholder="Enter build command" />
                    </div>
                    <div>
                      <label htmlFor="startCommand" className="text-sm font-medium mb-2 block">Start Command</label>
                      <Input id="startCommand" placeholder="Enter start command" />
                    </div>
                    <div>
                      <label htmlFor="nixPackages" className="text-sm font-medium mb-2 block">Nix Packages</label>
                      <Input id="nixPackages" placeholder="Enter Nix packages" />
                    </div>
                    <div>
                      <label htmlFor="aptPackages" className="text-sm font-medium mb-2 block">APT Packages</label>
                      <Input id="aptPackages" placeholder="Enter APT packages" />
                    </div>
                  </div>
                )}
              </div>

              {(activeTab === "github" || activeTab === "git") && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Branch</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="main">main</SelectItem>
                        <SelectItem value="develop">develop</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                </div>
              )}
              
            </div>
          </div>
          <div className="flex justify-items-start mt-6">
          <Button className="active:scale-95 transition-transform hover:opacity-90">
            Save Settings
          </Button>
        </div>
        </CardContent>
      </Card>
    </div>
  )
}

