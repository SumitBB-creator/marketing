import { useEffect, useState } from 'react';
import { AnalyticsService } from '@/services/analytics';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Layers, Activity } from 'lucide-react';

interface DashboardStats {
    summary: {
        total_leads: number;
        total_platforms: number;
        total_marketers: number;
    };
    by_platform: { platform_id: string; name: string; count: number }[];
    by_status: { status: string; count: number }[];
    by_marketer: { marketer_id: string; name: string; count: number }[];
}

export default function AnalyticsPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await AnalyticsService.getDashboardStats();
                setStats(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div>Loading analytics...</div>;
    if (!stats) return <div>Failed to load data</div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
                <p className="text-muted-foreground">Overview of your marketing performance.</p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.summary.total_leads}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Platforms</CardTitle>
                        <Layers className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.summary.total_platforms}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Marketers</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.summary.total_marketers}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {/* Platform Breakdown */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Leads by Platform</CardTitle>
                        <CardDescription>Distribution of leads across active platforms.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.by_platform.map(item => (
                                <div key={item.platform_id} className="flex items-center">
                                    <div className="w-full flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium">{item.name}</span>
                                            <span className="text-sm text-gray-500">{item.count}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full"
                                                style={{ width: `${(item.count / stats.summary.total_leads) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {stats.by_platform.length === 0 && <p className="text-sm text-gray-500">No data available.</p>}
                        </div>
                    </CardContent>
                </Card>

                {/* Status Breakdown */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Lead Status</CardTitle>
                        <CardDescription>Current status of all leads.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.by_status.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="font-medium">{item.status}</span>
                                    <span className="font-bold text-gray-700">{item.count}</span>
                                </div>
                            ))}
                            {stats.by_status.length === 0 && <p className="text-sm text-gray-500">No data available.</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
