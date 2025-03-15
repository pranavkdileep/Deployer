import { Copy, ExternalLink } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import CanddyLog from "./CanddyLog"
import { getDomainAction, saveDomain } from "@/actions/project"

interface DomainCardProps {
  domain?: string
  name: string
  isHttps?: boolean
  onDomainChange?: (newDomain: string,https:boolean) => void
}

export default function DomainCard({ onDomainChange,name }: DomainCardProps) {
  const [copied, setCopied] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [iscanddylogOpen, setIsCandyLogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formValues, setFormValues] = useState({
    domainName: "",
    useHttps: false,
  })
  const { toast } = useToast()
  async function getdomain(){
    const data : {domain:string,ssl:boolean} = await getDomainAction(name!)
    console.log(data)
    return data
  }
  useEffect(
    () => {
        const data = getdomain()
        data.then((res) => {
          setFormValues({domainName:res.domain,useHttps:res.ssl})
        })
    },[]
  )

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(formValues.domainName)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
      toast({
        variant: "destructive",
        title: "Copy failed",
        description: "Could not copy domain to clipboard.",
      })
    }
  }

  const openInNewTab = () => {
    window.open(formValues.domainName, "_blank", "noopener,noreferrer")
  }

  const handleSave = async () => {
    if (!formValues.domainName.trim()) {
      toast({
        variant: "destructive",
        title: "Invalid domain",
        description: "Please enter a valid domain name.",
      })
      return
    }

    setIsLoading(true)

    try {
      const protocol = formValues.useHttps
      const newDomain = formValues.domainName

      const result = await saveDomain(name,newDomain,protocol!)
      console.log(result)

      if (onDomainChange) {
        onDomainChange(newDomain,protocol!)
      }

      setDialogOpen(false)
      toast({
        title: "Domain updated",
        description: `Successfully updated to ${newDomain}`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "Failed to update domain. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const openCandyLog = () => {
    toast({
      title: "Candy Log",
      description: "Opening Candy Log...",
    })
    setIsCandyLogOpen(true)
  }

  return (
    <>
    <Dialog open={iscanddylogOpen} onOpenChange={setIsCandyLogOpen}>
              
              <DialogContent className='p-0 w-full max-w-2xl mx-auto '>
                {<CanddyLog name={name} />}
                
              </DialogContent>
    </Dialog>
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="text-base font-medium">Domain</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-md bg-muted p-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 p-0" onClick={openInNewTab}>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                <span className="sr-only">Open domain</span>
              </Button>
              <span className="flex-1 text-sm">{formValues.domainName}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={copyToClipboard}>
                <Copy className={cn("h-4 w-4", copied ? "text-green-500" : "text-muted-foreground")} />
                <span className="sr-only">Copy domain</span>
              </Button>
            </div>
            <Button variant="outline" className="shrink-0" onClick={() => setDialogOpen(true)}>
              Edit
            </Button>
          </div>
          <Button variant="secondary" className="w-full" onClick={openCandyLog}>
            Open Candy Log
          </Button>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Domain</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="domain">Domain Name</Label>
              <Input
                id="domain"
                value={formValues.domainName}
                onChange={(e) => setFormValues({ ...formValues, domainName: e.target.value })}
                placeholder="example.com"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="https" className="flex-1">
                Use HTTPS
              </Label>
              <Switch
                id="https"
                checked={formValues.useHttps}
                onCheckedChange={(checked) => setFormValues({ ...formValues, useHttps: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setDialogOpen(false)} variant="outline" disabled={isLoading}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

