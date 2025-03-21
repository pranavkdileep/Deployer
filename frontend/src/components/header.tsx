import {  Menu, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import logout from '@/lib/logout'

export function Header() {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold p-5">Dashboard</span>
          </Link>
          {/* <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link to="/projects" className="transition-colors hover:text-foreground/80">Projects</Link>
            <Link to="/analytics" className="transition-colors hover:text-foreground/80">Analytics</Link>
            <Link to="/settings" className="transition-colors hover:text-foreground/80">Settings</Link>
          </nav> */}
        </div>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[400px]">
            <nav className="flex flex-col space-y-4">
              <Link to="/" className="flex items-center space-x-2" onClick={() => setIsOpen(false)}>
                <span className="font-bold">Dashboard</span>
              </Link>
              {/* <Link to="/projects" className="transition-colors hover:text-foreground/80" onClick={() => setIsOpen(false)}>Projects</Link>
              <Link to="/analytics" className="transition-colors hover:text-foreground/80" onClick={() => setIsOpen(false)}>Analytics</Link>
              <Link to="/settings" className="transition-colors hover:text-foreground/80" onClick={() => setIsOpen(false)}>Settings</Link> */}
            </nav>
          </SheetContent>
        </Sheet>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center">
            {/* <Button variant="ghost" size="icon">
              <Bell className="h-4 w-4" />
              <span className="sr-only">Notifications</span>
            </Button> */}
            {/* <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
              <span className="sr-only">Settings</span>
            </Button> */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                  <span className="sr-only">User Menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()}>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </div>
    </header>
  )
}

