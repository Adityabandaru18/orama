"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Calendar, BarChart3, Settings, Home, Ticket, LogOut, User } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface AdminSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const router = useRouter();
  const menuItems = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ]

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-6">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Ticket className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">ORAMA</span>
        </Link>
        <p className="text-sm text-muted-foreground mt-1">Admin Dashboard</p>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => onTabChange(item.id)}
            >
              <item.icon className="w-4 h-4 mr-3" />
              {item.label}
            </Button>
          ))}
        </div>
      </nav>

      <Separator />

      {/* Sign out */}
      <div className="p-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-red-600 hover:bg-red-50">
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sign Out</DialogTitle>
              <DialogDescription>
                Are you sure you want to sign out? You will need to reconnect your wallet to access your account again.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                variant="destructive"
                onClick={() => {
                  router.push("/");
                }}
              >
                Sign Out
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
