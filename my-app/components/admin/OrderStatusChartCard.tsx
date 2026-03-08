"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Cell, Pie, PieChart, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase/client";

interface OrderStatusRow {
    order_status: string;
}

interface StatusSlice {
    name: string;
    value: number;
    color: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    pending_payment: { label: "Pending", color: "#94a3b8" },
    paid: { label: "Paid", color: "#f59e0b" },
    processing: { label: "Processing", color: "#f97316" },
    shipping: { label: "Shipping", color: "#3b82f6" },
    delivered: { label: "Delivered", color: "#10b981" },
    completed: { label: "Completed", color: "#059669" },
    cancelled: { label: "Cancelled", color: "#ef4444" },
    returned: { label: "Returned", color: "#e11d48" },
};

export function OrderStatusChartCard() {
    const [data, setData] = useState<StatusSlice[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchStatusData = useCallback(async (showLoading = true) => {
        if (showLoading) {
            setLoading(true);
        }

        try {
            const { data: ordersData, error } = await supabase.from("orders").select("order_status");

            if (error) {
                console.error("Error loading order status data:", error);
                setData([]);
                return;
            }

            const counts = new Map<string, number>();
            for (const row of (ordersData || []) as OrderStatusRow[]) {
                counts.set(row.order_status, (counts.get(row.order_status) || 0) + 1);
            }

            const nextData = Object.entries(STATUS_CONFIG)
                .map(([status, config]) => ({
                    name: config.label,
                    value: counts.get(status) || 0,
                    color: config.color,
                }))
                .filter((item) => item.value > 0);

            setData(nextData);
        } catch (error) {
            console.error("Error loading order status data:", error);
            setData([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchStatusData();

        const channel = supabase
            .channel("admin-order-status-chart")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "orders",
                },
                () => {
                    void fetchStatusData(false);
                }
            )
            .subscribe();

        return () => {
            void supabase.removeChannel(channel);
        };
    }, [fetchStatusData]);

    const totalOrders = data.reduce((sum, item) => sum + item.value, 0);

    return (
        <Card className="col-span-4 h-fit text-slate-900 md:col-span-2 lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-lg font-bold">ORDER STATUS</CardTitle>
                <Badge className="rounded-sm bg-slate-900 px-1.5 text-white hover:bg-slate-900">{totalOrders}</Badge>
            </CardHeader>
            <CardContent className="grid gap-4 pt-0">
                {loading ? (
                    <div className="flex flex-col items-center gap-2 py-10">
                        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                        <p className="text-xs text-slate-400">Loading order status...</p>
                    </div>
                ) : totalOrders === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-10 text-center">
                        <div className="h-10 w-10 rounded-full bg-slate-100" />
                        <p className="text-sm font-bold text-slate-700">No Orders Yet</p>
                        <p className="text-xs text-slate-400">Status breakdown will appear after your first order.</p>
                    </div>
                ) : (
                    <>
                        <div className="relative mx-auto h-[220px] w-[220px]">
                            <PieChart width={220} height={220}>
                                <Pie
                                    data={data}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={58}
                                    outerRadius={96}
                                    paddingAngle={3}
                                    strokeWidth={0}
                                >
                                    {data.map((entry) => (
                                        <Cell key={entry.name} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value) => [`${String(value ?? 0)} orders`, "Count"]}
                                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                                    itemStyle={{ fontSize: "12px", fontWeight: "500" }}
                                />
                            </PieChart>
                            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                                <span className="text-3xl font-black text-slate-900">{totalOrders}</span>
                                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Orders</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
                            {data.map((item) => {
                                const percentage = Math.round((item.value / totalOrders) * 100);
                                return (
                                    <div key={item.name} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                            <span className="truncate text-[11px] font-bold uppercase tracking-wider text-slate-600">{item.name}</span>
                                        </div>
                                        <div className="pl-2 text-right">
                                            <div className="text-sm font-bold text-slate-900">{item.value}</div>
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{percentage}%</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                <div className="border-t pt-4">
                    <Link href="/admin/orders">
                        <Button variant="outline" className="h-10 w-full text-xs font-bold uppercase tracking-wider">
                            Manage Orders
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
