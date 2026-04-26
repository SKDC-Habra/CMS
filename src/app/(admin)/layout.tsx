import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/admin/AppSidebar"
import { requireAdmin } from "@/lib/auth"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    await requireAdmin()

    return (
        <SidebarProvider>
            <AppSidebar />
            <main className="w-full">
                <div className="flex items-center h-14 border-b px-4 gap-4">
                    <SidebarTrigger />
                    <h1 className="font-semibold text-lg">Smart Clinic Administration</h1>
                </div>
                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </SidebarProvider>
    )
}
