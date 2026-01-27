import { useEffect, useState } from 'react';
import { AnalyticsService } from '@/services/analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatDateIST } from '@/lib/utils';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PerformancePage() {
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

    return (
        <div className="space-y-6 p-8">
            <div className="flex items-center gap-4">
                <Link to="/admin">
                    <Button variant="ghost" size="icon"><ArrowLeft size={20} /></Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Daily Performance</h1>
                    <p className="text-muted-foreground">Track marketer login times, activity duration, and lead generation.</p>
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
                                    <th className="px-4 py-3 font-medium">Marketer</th>
                                    <th className="px-4 py-3 font-medium">First Login</th>
                                    <th className="px-4 py-3 font-medium">Last Lead Created</th>
                                    <th className="px-4 py-3 font-medium">Total Active Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="text-center py-8 text-muted-foreground">Loading...</td>
                                    </tr>
                                ) : stats.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="text-center py-8 text-muted-foreground">No activity recorded for this date.</td>
                                    </tr>
                                ) : (
                                    stats.map((stat: any) => (
                                        <tr key={stat.marketer_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="px-4 py-3 font-medium">{stat.marketer_name}</td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {stat.first_login ? formatDateIST(stat.first_login).split(',')[1] : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {stat.last_lead_time ? formatDateIST(stat.last_lead_time).split(',')[1] : '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stat.active_duration_minutes > 0 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                                    }`}>
                                                    {stat.active_time_formatted}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
