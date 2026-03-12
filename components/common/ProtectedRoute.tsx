"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, getUserRole } from "@/lib/auth";
import { LoadingSpinner } from "./LoadingSpinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    const role = getUserRole();

    if (!token) {
      router.push("/login");
      return;
    }

    if (allowedRoles && !allowedRoles.includes(role)) {
      if (role === "donor") router.push("/dashboard/donor");
      else if (role === "ngo") router.push("/dashboard/ngo");
      else if (role === "admin") router.push("/dashboard/admin");
      else router.push("/login");
      return;
    }

    setAuthorized(true);
  }, [router, allowedRoles]);

  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return <>{children}</>;
};
