"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getToken, getUserRole } from "@/lib/auth";
import { LoadingSpinner } from "./LoadingSpinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const [authorized, setAuthorized] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    const token = getToken();
    const legacyRole = getUserRole(); // Role decoded from JWT (most accurate for manual logins)

    const isAuthenticated = !!(token || session);
    // PRIORITY: JWT/legacy role first (set by login API), then NextAuth session role.
    // This prevents a stale Google OAuth session from overriding the correct NGO/donor role.
    const userRole = legacyRole || session?.user?.role;

    console.log("[ProtectedRoute] token:", !!token, "legacyRole:", legacyRole, "sessionRole:", session?.user?.role, "resolved:", userRole);

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (allowedRoles && (!userRole || !allowedRoles.includes(userRole))) {
      if (userRole === "donor") router.push("/dashboard/donor");
      else if (userRole === "ngo") router.push("/dashboard/ngo");
      else if (userRole === "admin") router.push("/dashboard/admin");
      else router.push("/login");
      return;
    }

    setAuthorized(true);
  }, [router, allowedRoles, session, status]);

  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return <>{children}</>;
};
