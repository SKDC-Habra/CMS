'use client'

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar"
import { DollarSign, Home, Settings, Users, ShieldAlert } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const items = [
    {
        title: "Dashboard",
        url: "/admin/dashboard",
        icon: Home,
    },
    {
        title: "Doctor Management",
        url: "/admin/doctors",
        icon: Users,
    },
    {
        title: "Financials",
        url: "/admin/financials",
        icon: DollarSign,
    },
    {
        title: "Settings",
        url: "/admin/settings",
        icon: Settings,
    },
    {
        title: "Super Admin",
        url: "/admin/super",
        icon: ShieldAlert,
    },
]

export function AppSidebar() {
    const pathname = usePathname()

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="font-bold text-xl px-4 py-2 text-primary">
                CMS Admin
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Application</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === item.url}
                                        tooltip={item.title}
                                    >
                                        <Link href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        AD
                    </div>
                    <div className="truncate">
                        <p className="font-medium text-foreground">Admin User</p>
                        <p className="text-xs">admin@clinic.com</p>
                    </div>
                </div>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
