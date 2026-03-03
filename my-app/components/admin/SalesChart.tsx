"use client";

import { useEffect, useState, useCallback } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/lib/supabase/client";

interface ChartDataPoint {
    name: string;
    revenue: number;
    orders: number;
}

interface OrderRow {
    total_price: number;
    created_at: string;
}

interface SalesChartProps {
    timeRange: "24H" | "7D" | "30D";
}

export function SalesChart({ timeRange }: SalesChartProps) {
    const [data, setData] = useState<ChartDataPoint[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchChartData = useCallback(async () => {
        setLoading(true);
        try {
            const now = new Date();
            let startDate: Date;

            if (timeRange === "24H") {
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            } else if (timeRange === "7D") {
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            } else {
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            }

            const { data: ordersData, error } = await supabase
                .from("orders")
                .select("total_price, created_at")
                .gte("created_at", startDate.toISOString())
                .order("created_at", { ascending: true });

            if (error) {
                console.error("Error fetching chart data:", error);
                setData([]);
                return;
            }

            const orders = (ordersData || []) as OrderRow[];
            let chartData: ChartDataPoint[];

            if (timeRange === "24H") {
                chartData = groupByHour(orders, now);
            } else if (timeRange === "7D") {
                chartData = groupByDay(orders, 7);
            } else {
                chartData = groupByDay(orders, 30);
            }

            setData(chartData);
        } catch (err) {
            console.error("Error fetching chart data:", err);
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [timeRange]);

    useEffect(() => {
        fetchChartData();
    }, [fetchChartData]);

    if (loading) {
        return (
            <div className="h-[300px] w-full flex items-center justify-center">
                <div className="animate-pulse text-sm text-slate-400">Loading chart...</div>
            </div>
        );
    }

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{
                        top: 10,
                        right: 10,
                        left: 0,
                        bottom: 0,
                    }}
                >
                    <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#cbd5e1" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#cbd5e1" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }}
                        dy={10}
                    />
                    <YAxis hide />
                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontSize: '12px', fontWeight: '500' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#2563eb"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                    />
                    <Area
                        type="monotone"
                        dataKey="orders"
                        stroke="#cbd5e1"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        fillOpacity={1}
                        fill="url(#colorOrders)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

/** Group orders into hourly buckets for the last 24 hours */
function groupByHour(orders: OrderRow[], now: Date): ChartDataPoint[] {
    // Create 8 time slots across 24 hours (every 3 hours)
    const slots: ChartDataPoint[] = [];
    const slotHours = [0, 3, 6, 9, 12, 15, 18, 21];

    for (const hour of slotHours) {
        slots.push({
            name: `${hour.toString().padStart(2, "0")}:00`,
            revenue: 0,
            orders: 0,
        });
    }

    for (const order of orders) {
        const orderDate = new Date(order.created_at);
        const orderHour = orderDate.getHours();
        // Find the closest slot
        let slotIndex = 0;
        for (let i = slotHours.length - 1; i >= 0; i--) {
            if (orderHour >= slotHours[i]) {
                slotIndex = i;
                break;
            }
        }
        slots[slotIndex].revenue += order.total_price || 0;
        slots[slotIndex].orders += 1;
    }

    // Only show up to the current time slot
    const currentHour = now.getHours();
    const currentSlotIndex = slotHours.findIndex((h, i) => {
        const nextH = slotHours[i + 1] ?? 24;
        return currentHour >= h && currentHour < nextH;
    });

    return slots.slice(0, (currentSlotIndex >= 0 ? currentSlotIndex : slots.length - 1) + 1);
}

/** Group orders into daily buckets */
function groupByDay(orders: OrderRow[], days: number): ChartDataPoint[] {
    const now = new Date();
    const slots: ChartDataPoint[] = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const label = days <= 7
            ? dayNames[d.getDay()]
            : `${d.getDate().toString().padStart(2, "0")} ${monthNames[d.getMonth()]}`;
        slots.push({
            name: label,
            revenue: 0,
            orders: 0,
        });
    }

    for (const order of orders) {
        const orderDate = new Date(order.created_at);
        const diffMs = now.getTime() - orderDate.getTime();
        const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
        const slotIndex = days - 1 - diffDays;
        if (slotIndex >= 0 && slotIndex < slots.length) {
            slots[slotIndex].revenue += order.total_price || 0;
            slots[slotIndex].orders += 1;
        }
    }

    // For 30D, sample every 5 days to avoid too many labels
    if (days === 30) {
        return slots.filter((_, i) => i % 5 === 0 || i === slots.length - 1);
    }

    return slots;
}
