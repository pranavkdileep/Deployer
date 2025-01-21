import { Cpu, HardDrive, MemoryStickIcon as Memory, Network, Play, Power, RefreshCw, Trash2, ExternalLink, BarChart } from 'lucide-react'
import * as React from 'react'

import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { useEffect, useState } from 'react'
import { getProjects, getSystemanalysis } from '@/actions/getHomeanalysis'
import { HomeDto, ProjectsDto } from '@/interfaces/types'
import { createProject, restartProject, startProject, stopProject } from '@/actions/project'
import { Link } from 'react-router-dom'
import { Textarea } from './ui/textarea'
import { Input } from './ui/input'
import { useToast } from '@/hooks/use-toast'

interface MetricCardProps {
  title: string
  value: string
  description?: string
  icon: React.ReactNode
  className?: string
}

function MetricCard({ title, value, description, icon, className }: MetricCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

interface ProjectCardProps {
  name: string
  description: string
  status: 'running' | 'Stopped' | 'error'
  createdAt: string
  lastDeployed: string
  cpu: number
  memory: number
  openPorts?: string[]
  onStop?: () => void
  onStart?: () => void
  onRestart?: () => void
  onDelete?: () => void
}

function ProjectCard({
  name,
  description,
  status,
  createdAt,
  lastDeployed,
  cpu,
  memory,
  openPorts,
  onStop,
  onRestart,
  onStart,
  onDelete
}: ProjectCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <Link to={`/project/${name}`}>
            <CardTitle className="text-xl flex items-center gap-2">
              {name}
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </CardTitle>
          </Link>
          {openPorts && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Open Ports</span>
              <div className="flex items-center gap-2">
                {openPorts.map((port) => (
                  <Button key={port} variant="outline">
                    {port}
                  </Button>
                ))}
              </div>
            </div>
          )}
          <CardDescription className="mt-2">{description}</CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Power className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {status === 'running' ? (
              <>
                <DropdownMenuItem onClick={onStop}>
                  <Power className="mr-2 h-4 w-4" />
                  Stop
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onRestart}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Restart
                </DropdownMenuItem>
              </>
            ) : (status === 'Stopped' ? (<></>) : (
              <>
                <DropdownMenuItem onClick={onStart}>
                  <Power className="mr-2 h-4 w-4" />
                  Start
                </DropdownMenuItem>
              </>
            ))}
            <DropdownMenuItem onClick={onDelete} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm">
          <span className={`flex items-center gap-2 ${status === 'running' ? 'text-green-500' :
            status === 'Stopped' ? 'text-gray-500' :
              'text-red-500'
            }`}>
            <span className="h-2 w-2 rounded-full bg-current" />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
          <span className="text-muted-foreground">Created {createdAt}</span>
          <span className="text-muted-foreground">Last deployed {lastDeployed}</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">CPU Usage</span>
            <span>{cpu}%</span>
          </div>
          <Progress value={cpu} className="h-1" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Memory Usage</span>
            <span>{memory}%</span>
          </div>
          <Progress value={memory} className="h-1" />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Network IO</span>
          <span>3.35kB / 1.23kB</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" className="w-full">
          <BarChart className="mr-2 h-4 w-4" />
          View Analytics
        </Button>
      </CardFooter>
    </Card>
  )
}

export default function Dashboard() {



  useEffect(() => {
    setDumymetrics()
    constructProjectCards()
    const interval = setInterval(() => {
      constructMetricCards()
    }, 3000)

    return () => {
      clearInterval(interval)
    }
  }, [])



  const [metrics, setMetrics] = useState<MetricCardProps[]>([])
  const [projects, setProjects] = useState<ProjectCardProps[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const { toast } = useToast()
  // const metricsdumy = [
  //   {
  //     title: 'CPU',
  //     value: '0.5%',
  //     description: '',
  //     icon: <Cpu className="h-4 w-4 text-orange-500" />,
  //     className: 'bg-orange-50 dark:bg-orange-950/50',
  //   },
  //   {
  //     title: 'Memory',
  //     value: '18.0%',
  //     description: '1066 MB / 5916 MB',
  //     icon: <Memory className="h-4 w-4 text-blue-500" />,
  //     className: 'bg-blue-50 dark:bg-blue-950/50',
  //   },
  //   {
  //     title: 'Disk',
  //     value: '24.3%',
  //     description: '10.9 GB / 44.9 GB',
  //     icon: <HardDrive className="h-4 w-4 text-green-500" />,
  //     className: 'bg-green-50 dark:bg-green-950/50',
  //   },
  //   {
  //     title: 'Network',
  //     value: '0.00 MB',
  //     description: '↑ 0.00 MB ↓ 0.00 MB',
  //     icon: <Network className="h-4 w-4 text-gray-500" />,
  //     className: 'bg-gray-50 dark:bg-gray-950/50',
  //   },
  // ]


  // const projects = [
  //   { 
  //     name: 'Frontend App', 
  //     description: 'Main customer-facing web application',
  //     status: 'running' as const,
  //     createdAt: '2 months ago',
  //     lastDeployed: '2 hours ago',
  //     cpu: 45,
  //     memory: 62
  //   },
  //   { 
  //     name: 'Backend API', 
  //     description: 'RESTful API service for the frontend',
  //     status: 'stopped' as const,
  //     createdAt: '3 months ago',
  //     lastDeployed: '1 day ago',
  //     cpu: 0,
  //     memory: 12
  //   },
  //   { 
  //     name: 'Database', 
  //     description: 'Primary PostgreSQL database instance',
  //     status: 'error' as const,
  //     createdAt: '3 months ago',
  //     lastDeployed: '5 days ago',
  //     cpu: 89,
  //     memory: 95
  //   },
  //   { 
  //     name: 'Cache Server', 
  //     description: 'Redis cache for improved performance',
  //     status: 'running' as const,
  //     createdAt: '1 month ago',
  //     lastDeployed: '12 hours ago',
  //     cpu: 23,
  //     memory: 45
  //   },
  // ]

  function setDumymetrics() {
    const metricsdumy = [
      {
        title: 'CPU',
        value: '--%',
        description: '',
        icon: <Cpu className="h-4 w-4 text-orange-500" />,
        className: 'bg-orange-50 dark:bg-orange-950/50',
      },
      {
        title: 'Memory',
        value: '--%',
        description: '-- MB / -- MB',
        icon: <Memory className="h-4 w-4 text-blue-500" />,
        className: 'bg-blue-50 dark:bg-blue-950/50',
      },
      {
        title: 'Disk',
        value: '--%',
        description: '-- GB / -- GB',
        icon: <HardDrive className="h-4 w-4 text-green-500" />,
        className: 'bg-green-50 dark:bg-green-950/50',
      },
      {
        title: 'Network',
        value: '-- MB',
        description: '↑ -- MB ↓ -- MB',
        icon: <Network className="h-4 w-4 text-gray-500" />,
        className: 'bg-gray-50 dark:bg-gray-950/50',
      },
    ]
    setMetrics(metricsdumy)
  }
  async function constructMetricCards() {
    const data = await getSystemanalysis() as HomeDto
    setMetrics([
      {
        title: 'CPU',
        value: data.cpu,
        description: '',
        icon: <Cpu className="h-4 w-4 text-orange-500" />,
        className: 'bg-orange-50 dark:bg-orange-950/50',
      },
      {
        title: 'Memory',
        value: data.ram.percent,
        description: `${data.ram.used} / ${data.ram.total}`,
        icon: <Memory className="h-4 w-4 text-blue-500" />,
        className: 'bg-blue-50 dark:bg-blue-950/50',
      },
      {
        title: 'Disk',
        value: data.disk.percent,
        description: `${data.disk.used} / ${data.disk.total}`,
        icon: <HardDrive className="h-4 w-4 text-green-500" />,
        className: 'bg-green-50 dark:bg-green-950/50',
      },
      {
        title: 'Network',
        value: `${parseInt(data.network.received) + parseInt(data.network.transmitted)} MB`,
        description: `↑ ${data.network.received} ↓ ${data.network.transmitted}`,
        icon: <Network className="h-4 w-4 text-gray-500" />,
        className: 'bg-gray-50 dark:bg-gray-950/50',
      },
    ]);
  }
  async function constructProjectCards() {
    const data = await getProjects() as ProjectsDto
    const projects = data.projects.map((project) => ({
      name: project.name,
      description: project.description,
      status: project.status as 'running' | 'Stopped' | 'error',
      createdAt: formatRelativeTime(project.created_at),
      lastDeployed: formatRelativeTime(project.updated_at),
      cpu: parseInt(project.cpu),
      memory: parseInt(project.ram),
      openPorts: project.open_ports,
    }))
    setProjects(projects)
  }
  async function handleCreateProject(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    console.log(projectName, projectDescription)
    const respose = await createProject(projectName, projectDescription)
    if (respose.success) {
      toast({
        title: "Project Created",
        description: respose.message,
      })
      constructProjectCards()
    } else {
      toast({
        title: "Error",
        description: respose.message,
      })
    }
    setIsDialogOpen(false)
  }

  function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const days = Math.floor(diffInSeconds / (24 * 3600));
    const hours = Math.floor((diffInSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((diffInSeconds % 3600) / 60);
    let result = "";
    if (days > 0) {
      result += `${days} day${days > 1 ? "s" : ""} `;
    }
    if (hours > 0 && days === 0) {
      result += `${hours} hr${hours > 1 ? "s" : ""} `;
    }
    if (minutes > 0 && days === 0 && hours === 0) {
      result += `${minutes} min${minutes > 1 ? "s" : ""} `;
    }
    return result.trim() + " ago";
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.title} {...metric} />
          ))}
        </div>

        <div className="mt-8">
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Play className="mr-2 h-4 w-4" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                  <DialogDescription>
                    Enter the details for your new project.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateProject}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="project-name" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="project-name"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="project-description" className="text-right">
                        Description
                      </Label>
                      <Textarea
                        id="project-description"
                        value={projectDescription}
                        onChange={(e) => setProjectDescription(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Tabs defaultValue="expanded" className="mt-4">
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <TabsList>
                <TabsTrigger value="expanded">Expanded</TabsTrigger>
                <TabsTrigger value="collapsed">Collapsed</TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  Name
                </Button>
                <Button variant="outline" size="sm">
                  Time
                </Button>
              </div>
            </div>

            <TabsContent value="expanded" className="mt-4">
              <ScrollArea className="h-[calc(100vh-20rem)]">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {projects.map((project) => (
                    <ProjectCard
                      key={project.name}
                      {...project}
                      onStop={() => stopProject(project.name)}
                      onStart={() => startProject(project.name)}
                      onRestart={() => restartProject(project.name)}
                      onDelete={() => console.log('Delete', project.name)}
                    />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="collapsed" className="mt-4">
              <ScrollArea className="h-[calc(100vh-20rem)]">
                <div className="space-y-2">
                  {projects.map((project) => (
                    <Card key={project.name} className="p-4">
                      <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                        <div className="flex items-center gap-4">
                          <span className={`h-2 w-2 rounded-full ${project.status === 'running' ? 'bg-green-500' :
                            project.status === 'Stopped' ? 'bg-gray-500' :
                              'bg-red-500'
                            }`} />
                          <div>
                            <span className="font-medium">{project.name}</span>
                            <p className="text-sm text-muted-foreground">{project.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon">
                            <Power className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}


