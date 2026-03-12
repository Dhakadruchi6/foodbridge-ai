"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Heart, ClipboardCheck, LayoutGrid } from "lucide-react";
import { getRequest } from "@/lib/apiClient";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export const MetricsCard = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const result = await getRequest("/api/admin/metrics");
        if (result.success) {
          setMetrics(result.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!metrics) return null;

  const statCards = [
    { title: "Total Users", value: metrics.totalUsers, icon: Users, color: "text-blue-600" },
    { title: "Active NGOs", value: metrics.totalNGOs, icon: LayoutGrid, color: "text-purple-600" },
    { title: "Total Donations", value: metrics.totalDonations, icon: Heart, color: "text-red-600" },
    { title: "Successful Deliveries", value: metrics.successfulDeliveries, icon: ClipboardCheck, color: "text-green-600" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
