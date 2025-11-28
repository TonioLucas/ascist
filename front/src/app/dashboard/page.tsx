"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/auth/useAuth";
import { authOperations } from "@/auth/authOperations";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { LogOut } from "lucide-react";
import { PlannerConfig } from "./components";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/signin");
    }
  }, [loading, isAuthenticated, router]);

  const handleSignOut = async () => {
    try {
      await authOperations.signOut();
      router.push("/signin");
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const displayName = user?.displayName || user?.email || "";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-semibold">{t("app.name")}</h1>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            {t("auth.signout")}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">
            {t("dashboard.welcome", { name: displayName })}
          </h2>
        </div>

        <PlannerConfig />
      </main>
    </div>
  );
}
