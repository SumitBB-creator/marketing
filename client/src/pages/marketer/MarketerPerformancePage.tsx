import { useEffect, useState } from 'react';
import { AnalyticsService } from '@/services/analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatDateIST } from '@/lib/utils';
import { RefreshCw } from 'lucide-react';

export default function MarketerPerformancePage() {
    const [stats, setStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await AnalyticsService.getPerformanceStats({ date });
            setStats(data);
        } catch (error) {
            console.error("Failed to fetch performance stats", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [date]);

    // Since backend filters by user ID automatically for marketers, we should only see 1 record.
    const myStat = stats.length > 0 ? stats[0] : null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Performance</h1>
                    <p className="text-muted-foreground">Track your daily activity and metrics.</p>
                </div>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Filter by Date
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={fetchData}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 mb-6">
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="max-w-[200px]"
                        />
                    </div>

                    <div className="rounded-md border">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-gray-900 border-b">
                                <tr>
                                    <th className="px-4 py-3 font-medium">First Login</th>
                                    <th className="px-4 py-3 font-medium">Last Logout</th>
                                    <th className="px-4 py-3 font-medium">Last Lead Created</th>
                                    <th className="px-4 py-3 font-medium">Total Active Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="text-center py-8 text-muted-foreground">Loading...</td>
                                    </tr>
                                ) : !myStat ? (
                                    <tr>
                                        <td colSpan={4} className="text-center py-8 text-muted-foreground">No activity recorded for this date.</td>
                                    </tr>
                                ) : (
                                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {myStat.first_login ? formatDateIST(myStat.first_login).split(',')[1] : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {myStat.last_logout ? formatDateIST(myStat.last_logout).split(',')[1] : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {myStat.last_lead_time ? formatDateIST(myStat.last_lead_time).split(',')[1] : '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${myStat.active_duration_minutes > 0 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                                }`}>
                                                {myStat.active_time_formatted}
                                            </span>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
