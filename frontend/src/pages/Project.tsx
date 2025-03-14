import { useParams } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Terminal, RefreshCw, StopCircle } from 'lucide-react'
import { useState } from 'react'
import { Label } from "@/components/ui/label"
import { deployProject, saveDeploymentSettings, setupgit, uploadZip } from '@/actions/project'
import { DeploymentMethod } from '@/interfaces/types'
import { useToast } from '@/hooks/use-toast'
import DeploymentHistory from '@/components/deployment-history'
import { AutoScrollingLogView } from '@/components/AutoScrollingLogView'
import Envcard from '@/components/Envcard'
import BuildOut from '@/components/BuildOut'
import { Dialog, DialogContent } from '@/components/ui/dialog'

//extra items
interface nixDep{
  pkgs?: string;
  apts?: string;
  install_cmd?: string;
  build_cmd?: string;
  start_cmd?: string;
}

export default function DeploymentSettings() {
  const { name } = useParams<{ name: string }>();
  const [activeTab, setActiveTab] = useState("github");
  const [sourceDir, setSourceDir] = useState('');
  const [port, setPort] = useState(0);
  const [dockerFile, setDockerFile] = useState('');
  const [sourcesetupbutton, setSourceSetupButton] = useState(false);
  const [deployMethod, setDeployMethod] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isProgress, setIsProgress] = useState(false);
  const [progress, setProgress] = useState(0);
  const [githubRepo, setGithubRepo] = useState('');
  const [githubBranch, setGithubBranch] = useState('');
  const { toast } = useToast()
  const [maintab, setMainTab] = useState('general');
  const [isBuildoutOpen, setIsBuildoutOpen] = useState(false);
  const [extrafornix , setExtraforNix] = useState<nixDep>({});

  const handleFileUpload = async () => {
    console.log("Uploading file");
    const formData = new FormData();
    formData.append('zipfile', file!);
    formData.append('name', name!);
    setIsProgress(true);
    uploadZip(formData,(progress) =>{
      setProgress(progress);
    },(success)=>{
      if(success){
        toast({
          title: 'Success',
          description: 'File uploaded successfully'
        });
      }else{
        toast({
          title: 'Failed',
          description: 'File upload failed',
          variant: 'destructive'
        }); 
      } 
    });
    
  }
  const handleGithubSetup = async () =>{
    console.log(githubRepo, githubBranch);
    setupgit(name!, githubRepo, githubBranch,(success) =>{
      if(success){
        toast({
          title: 'Success',
          description: 'Github setup successfully'
        });
      }else{
        toast({
          title: 'Failed',
          description: 'Github setup failed',
          variant: 'destructive'
        }); 
      }
    });
  }

  const handlesavesettings = () => {
    console.log("Saving settings");
    if(deployMethod === 'docker'){
      const condfig : DeploymentMethod = {
        name: name!,
        sourcedir: sourceDir,
        buildtype: deployMethod as 'docker' | 'nix',
        dockerFile: dockerFile,
        port: port
      }
      console.log(condfig);
      saveDeploymentSettings(condfig,(success) =>{
        if(success){
          toast({
            title: 'Success',
            description: 'Settings saved successfully'
          });
        }else{
          toast({
            title: 'Failed',
            description: 'Settings save failed',
            variant: 'destructive'
          }); 
        }
      });
    }else{
      const config : DeploymentMethod ={
        name:name!,
        sourcedir: sourceDir,
        buildtype:'nix',
        port: port,
        ...extrafornix
      };
      console.log(config);
      setExtraforNix(extrafornix);
      saveDeploymentSettings(config,(success) =>{
        if(success){
          toast({
            title: 'Success',
            description: 'Settings saved successfully'
          });
        }else{
          toast({
            title: 'Failed',
            description: 'Settings save failed',
            variant: 'destructive'
          }); 
        }
      });
    }
  }

  const handleDeploy = () => {
    deployProject(name!, (success) => {
      if(success){
        toast({
          title: 'Success',
          description: 'Project deployed successfully'
        });
        setIsBuildoutOpen(true);
      }else{
        toast({
          title: 'Failed',
          description: 'Project deployment failed',
          variant: 'destructive'
        });
    }
  });
}

function generalTab(){
  

  return(
    <>
    <Dialog open={isBuildoutOpen} onOpenChange={setIsBuildoutOpen}>
              
              <DialogContent className='p-0 w-full max-w-2xl mx-auto '>
                {buildoutcard()}
                
              </DialogContent>
            </Dialog>
    <Card>
        <CardHeader>
          <CardTitle>Deploy Settings</CardTitle>
          <p className="text-sm text-muted-foreground">
            Create a compose file to deploy your compose
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-2">
            <Button className="active:scale-95 transition-transform hover:opacity-90" onClick={handleDeploy}>Deploy</Button>
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
                  accept=".zip"
                  onChange={
                    (e) => {
                      setFile(e.target.files![0])
                      console.log(e.target.files![0].name)
                      setSourceSetupButton(true)
                    }
                  }
                />
                {isProgress && (
                  <div className="mt-2">
                  <p className="text-sm text-muted-foreground">
                    {progress}%
                  </p>
                  </div>
                )}
              </div>
            )}

            {(activeTab === "github") && (
              <div>
                <label htmlFor="repository" className="text-sm font-medium mb-2 block">Repository</label>
                <Input
                  id="repository"
                  placeholder="https://github.com/pranavkd/demo"
                  className="w-full"
                  onChange={(e) => setGithubRepo(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Branch</label>
                    <Select onValueChange={(value) => {
                      setGithubBranch(value)
                      setSourceSetupButton(true)
                    }}>
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
              </div>

            )}

            <div className="flex justify-items-start mt-6 mb-6">
                <Button 
                className={`${sourcesetupbutton ? 'text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline' : 'bg-gray-300 hover:bg-gray-300'} `}
                disabled={!sourcesetupbutton}
                onClick={activeTab === "raw" ? handleFileUpload : handleGithubSetup}
                >
                Setup Source
                </Button>
            </div>

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
                    <Input id="dockerFile" placeholder="Enter Docker file name" onChange={(e)=>{setDockerFile(e.target.value)}} />
                    <label htmlFor="port" className="text-sm font-medium mb-2 block">Port</label>
                    <Input id="port" placeholder="Enter port" onChange={(e)=>{setPort(parseInt(e.target.value))}} />
                    <label htmlFor="sourceDir" className="text-sm font-medium mb-2 block">Source Directory</label>
                    <Input id="sourceDir" placeholder="Enter source directory" onChange={(e)=>{setSourceDir(e.target.value)}} />
                  </div>
                )}
                {deployMethod === 'nix' && (
                  <div className="space-y-4 mt-4">
                    <div>
                      <label htmlFor="port" className="text-sm font-medium mb-2 block">Port</label>
                      <Input id="port" placeholder="Enter port" onChange={(e)=>{setPort(parseInt(e.target.value))}} />
                      <label htmlFor="sourceDir" className="text-sm font-medium mb-2 block">Source Directory</label>
                      <Input id="sourceDir" placeholder="Enter source directory" onChange={(e)=>{setSourceDir(e.target.value)}} />
                    </div>
                    <div>
                      <label htmlFor="installCommand" className="text-sm font-medium mb-2 block">Install Command</label>
                      <Input id="installCommand" placeholder="Enter build command" onChange={(e)=>{extrafornix.install_cmd=e.target.value}} />
                    </div>
                    <div>
                      <label htmlFor="buildCommand" className="text-sm font-medium mb-2 block">Build Command</label>
                      <Input id="buildCommand" placeholder="Enter build command" onChange={(e)=>{extrafornix.build_cmd=e.target.value}} />
                    </div>
                    <div>
                      <label htmlFor="startCommand" className="text-sm font-medium mb-2 block">Start Command</label>
                      <Input id="startCommand" placeholder="Enter start command" onChange={(e)=>{extrafornix.start_cmd=e.target.value}} />
                    </div>
                    <div>
                      <label htmlFor="nixPackages" className="text-sm font-medium mb-2 block">Nix Packages</label>
                      <Input id="nixPackages" placeholder="Enter Nix packages" onChange={(e)=>{extrafornix.pkgs=e.target.value}} />
                    </div>
                    <div>
                      <label htmlFor="aptPackages" className="text-sm font-medium mb-2 block">APT Packages</label>
                      <Input id="aptPackages" placeholder="Enter APT packages" onChange={(e)=>{extrafornix.apts=e.target.value}} />
                    </div>
                  </div>
                )}
              </div>



            </div>
          </div>
          <div className="flex justify-items-start mt-6">
            <Button className="active:scale-95 transition-transform hover:opacity-90" onClick={handlesavesettings}>
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
      </>
  )
}

function deploymentTab(){
  return (
    <>
    <DeploymentHistory name={name!}/>
    </>
  )
}

function envcardfunctions(){
  return (
    <>
    <Envcard name={name!}/>
    </>
  )
}

function buildoutcard(){
  return (
    <>
    <BuildOut name={name!}/>
    </>
  )
}


  return (
    <div className="min-h-screen bg-background p-6">
      <h1 className="text-2xl font-semibold mb-4">Deployment Settings for {name}</h1>
      <div className="mb-6">
        <Tabs defaultValue="general" className="w-full" onValueChange={(value)=>{setMainTab(value)}}>
          <TabsList className="w-full justify-start" >
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
      {maintab === 'general' && generalTab()}
      {maintab === 'deployments' && deploymentTab()}
      {maintab === 'logs' && <AutoScrollingLogView name={name!}/>}
      {maintab === 'environment' && envcardfunctions()}
    </div>
  )
}

