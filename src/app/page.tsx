import { Button } from "@/components/ui/button";
import { ArrowRight, LayoutDashboard, User } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-muted/20 p-6 text-center">
      <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">

        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-primary">
            Smart Clinic
          </h1>
          <p className="text-muted-foreground text-lg">
            Next-Gen OPD Token System
          </p>
        </div>

        <div className="grid gap-4 w-full">
          <Button asChild size="lg" className="h-16 text-lg shadow-lg touch-target">
            <Link href="/patient">
              <User className="mr-2 h-6 w-6" /> Patient Portal
              <ArrowRight className="ml-2 h-5 w-5 opacity-50" />
            </Link>
          </Button>

          <Button asChild variant="outline" size="lg" className="h-16 text-lg touch-target">
            <Link href="/login">
              <LayoutDashboard className="mr-2 h-6 w-6" /> Staff Login
            </Link>
          </Button>
        </div>

        <div className="pt-8 text-xs text-muted-foreground/50">
          <p>Smart Clinic Management System v1.0</p>
        </div>
      </div>
    </div>
  );
}
