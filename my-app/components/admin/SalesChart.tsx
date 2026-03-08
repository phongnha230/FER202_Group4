"use client";

import { useCallback, useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/lib/supabase/client";

const VIETNAM_TIMEZONE = "Asia/Ho_Chi_Minh";

interface ChartDataPoint {
    name: string;
    displayName: string;
    revenue: number;
    orders: number;
}

interface OrderRow {
    total_price: number;
    created_at: string;
}

export interface SalesSummary {
    totalRevenue: number;
    totalOrders: number;
    averageRevenue: number;
    averageOrders: number;
    peakLabel: string;
    peakRevenue: number;
    activePeriods: number;
    insight: string;
}

interface SalesChartProps {
    timeRange: "24H" | "7D" | "30D";
    onSummaryChange?: (summary: SalesSummary) => void;
}

export function SalesChart({ timeRange, onSummaryChange }: SalesChartProps) {
    const [data, setData] = useState<ChartDataPoint[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchChartData = useCallback(async (showLoading = true) => {
        if (showLoading) {
            setLoading(true);
        }

        try {
            const now = new Date();
            let startDate: Date;

            if (timeRange === "24H") {
                startDate = new Date(now.getTime() - 23 * 60 * 60 * 1000);
            } else if (timeRange === "7D") {
                startDate = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
            } else {
                startDate = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
            }

            const { data: ordersData, error } = await supabase
                .from("orders")
                .select("total_price, created_at")
                .gte("created_at", startDate.toISOString())
                .order("created_at", { ascending: true });

            if (error) {
                console.error("Error fetching chart data:", error);
                setData([]);
                onSummaryChange?.(buildSalesSummary([], timeRange));
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
            onSummaryChange?.(buildSalesSummary(chartData, timeRange));
        } catch (err) {
            console.error("Error fetching chart data:", err);
            setData([]);
            onSummaryChange?.(buildSalesSummary([], timeRange));
        } finally {
            setLoading(false);
        }
    }, [onSummaryChange, timeRange]);

    useEffect(() => {
        void fetchChartData();

        const channel = supabase
            .channel(`admin-sales-chart-${timeRange.toLowerCase()}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "orders",
                },
                () => {
                    void fetchChartData(false);
                }
            )
            .subscribe();

        return () => {
            void supabase.removeChannel(channel);
        };
    }, [fetchChartData, timeRange]);

    if (loading) {
        return (
            <div className="flex h-[220px] w-full items-center justify-center">
                <div className="animate-pulse text-sm text-slate-400">Loading chart...</div>
            </div>
        );
    }

    return (
        <div className="h-[220px] w-full">
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
                        dataKey="displayName"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: "bold" }}
                        dy={10}
                    />
                    <YAxis hide />
                    <Tooltip
                        labelFormatter={(_, payload) => payload?.[0]?.payload?.name ?? ""}
                        contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                        itemStyle={{ fontSize: "12px", fontWeight: "500" }}
                    />
                    <Area
                        type="linear"
                        dataKey="revenue"
                        stroke="#2563eb"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                    />
                    <Area
                        type="linear"
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

function buildSalesSummary(data: ChartDataPoint[], timeRange: "24H" | "7D" | "30D"): SalesSummary {
    const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
    const totalOrders = data.reduce((sum, item) => sum + item.orders, 0);
    const divisor = timeRange === "24H" ? 24 : timeRange === "7D" ? 7 : 30;
    const unitLabel = timeRange === "24H" ? "hour" : "day";
    const averageRevenue = totalRevenue / divisor;
    const averageOrders = totalOrders / divisor;
    const activePeriods = data.filter((item) => item.orders > 0).length;
    const peakPoint = data.reduce<ChartDataPoint | null>((best, item) => {
        if (!best) {
            return item;
        }

        if (item.revenue > best.revenue) {
            return item;
        }

        if (item.revenue === best.revenue && item.orders > best.orders) {
            return item;
        }

        return best;
    }, null);

    const peakLabel = peakPoint ? peakPoint.name : "No peak yet";
    const peakRevenue = peakPoint?.revenue || 0;

    let insight = `No orders recorded in the last ${timeRange.toLowerCase()} yet.`;
    if (totalOrders > 0 && peakPoint) {
        if (activePeriods === 1) {
            insight = `${peakLabel} drove all activity with ${peakPoint.orders} orders and ${formatSummaryCurrency(peakRevenue)} in revenue.`;
        } else {
            insight = `${activePeriods} ${unitLabel}${activePeriods > 1 ? "s" : ""} generated orders. Peak revenue landed on ${peakLabel} at ${formatSummaryCurrency(peakRevenue)}.`;
        }
    }

    return {
        totalRevenue,
        totalOrders,
        averageRevenue,
        averageOrders,
        peakLabel,
        peakRevenue,
        activePeriods,
        insight,
    };
}

function formatSummaryCurrency(amount: number): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(amount);
}

function groupByHour(orders: OrderRow[], now: Date): ChartDataPoint[] {
    const slots: ChartDataPoint[] = [];
    const slotIndexByKey = new Map<string, number>();
    const currentHour = getZonedHourDate(now);

    for (let i = 23; i >= 0; i--) {
        const hourDate = new Date(currentHour);
        hourDate.setHours(hourDate.getHours() - i);

        const label = formatHourLabel(hourDate);

        slots.push({
            name: label,
            displayName: hourDate.getHours() % 3 === 0 || i === 0 ? label : "",
            revenue: 0,
            orders: 0,
        });

        slotIndexByKey.set(getHourKey(hourDate), slots.length - 1);
    }

    for (const order of orders) {
        const orderDate = parseSupabaseTimestamp(order.created_at);
        const slotIndex = slotIndexByKey.get(getHourKey(orderDate));

        if (slotIndex !== undefined) {
            slots[slotIndex].revenue += order.total_price || 0;
            slots[slotIndex].orders += 1;
        }
    }

    return slots;
}

function groupByDay(orders: OrderRow[], days: number): ChartDataPoint[] {
    const now = new Date();
    const slots: ChartDataPoint[] = [];
    const slotIndexByKey = new Map<string, number>();
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    for (let i = days - 1; i >= 0; i--) {
        const date = getZonedDayDate(new Date(now.getTime() - i * 24 * 60 * 60 * 1000));
        const label = days <= 7 ? dayNames[date.getDay()] : `${date.getDate().toString().padStart(2, "0")} ${monthNames[date.getMonth()]}`;

        slots.push({
            name: label,
            displayName: days === 30 && i % 5 !== 0 && i !== 0 ? "" : label,
            revenue: 0,
            orders: 0,
        });

        slotIndexByKey.set(getDayKey(date), slots.length - 1);
    }

    for (const order of orders) {
        const orderDate = parseSupabaseTimestamp(order.created_at);
        const slotIndex = slotIndexByKey.get(getDayKey(orderDate));

        if (slotIndex !== undefined) {
            slots[slotIndex].revenue += order.total_price || 0;
            slots[slotIndex].orders += 1;
        }
    }

    return slots;
}

function parseSupabaseTimestamp(value: string): Date {
    let safeValue = value;

    if (!safeValue.endsWith("Z") && !safeValue.includes("+") && safeValue.includes("T")) {
        safeValue += "Z";
    }

    return new Date(safeValue);
}

function getVietnamParts(date: Date): Record<string, string> {
    const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: VIETNAM_TIMEZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });

    const parts = formatter.formatToParts(date);
    const map: Record<string, string> = {};

    for (const part of parts) {
        if (part.type !== "literal") {
            map[part.type] = part.value;
        }
    }

    return map;
}

function getZonedHourDate(date: Date): Date {
    const parts = getVietnamParts(date);
    return new Date(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour));
}

function getZonedDayDate(date: Date): Date {
    const parts = getVietnamParts(date);
    return new Date(Number(parts.year), Number(parts.month) - 1, Number(parts.day));
}

function formatHourLabel(date: Date): string {
    return `${date.getHours().toString().padStart(2, "0")}:00`;
}

function getHourKey(date: Date): string {
    const parts = getVietnamParts(date);
    return [parts.year, parts.month, parts.day, parts.hour].join("-");
}

function getDayKey(date: Date): string {
    const parts = getVietnamParts(date);
    return [parts.year, parts.month, parts.day].join("-");
}
