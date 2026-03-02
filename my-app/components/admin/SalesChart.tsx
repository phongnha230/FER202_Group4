"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface ChartDataPoint {
    name: string;
    revenue: number;
    orders: number;
}

export function SalesChart({ timeRange = '30D', data = [] }: { timeRange?: '24H' | '7D' | '30D', data?: ChartDataPoint[] }) {

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
                    <YAxis
                        hide
                    />
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
