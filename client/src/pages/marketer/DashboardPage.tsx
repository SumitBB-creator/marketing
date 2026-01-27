import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { MarketerService } from '@/services/marketer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart2 } from 'lucide-react';
import StickyNoteBoard from '@/components/notes/StickyNoteBoard';

export default function MarketerDashboard() {
    const { user } = useAuth();
    const [assignedPlatforms, setAssignedPlatforms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAssignments = async () => {
            if (user) {
                try {
                    setLoading(true);
                    const data = await MarketerService.getAssignments(user.id);
                    console.log("Assignments:", data);
                    setAssignedPlatforms(data || []);
                } catch (e) {
                    console.error(e);
                    setError("Failed to load assignments.");
                } finally {
                    setLoading(false);
                }
            }
        }
        if (user) fetchAssignments();
    }, [user]);

    if (loading) return <div className="p-8">Loading assignments...</div>;
    if (error) return <div className="p-8 text-red-500">{error}</div>;

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.full_name}</h1>
                <p className="text-gray-600">Here are the platforms you are assigned to.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assignedPlatforms.length > 0 ? (
                    assignedPlatforms.map((item) => (
                        <Card key={item.platform_id} className="hover:border-blue-500 transition-colors">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    {item.platform.name}
                                </CardTitle>
                                <CardDescription>
                                    {item.platform.description || 'Manage your leads for this platform.'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Link to={`/marketer/platform/${item.platform_id}`}>
                                    <Button className="w-full gap-2 group">
                                        View Leads
                                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full p-12 text-center border-2 border-dashed rounded-xl bg-gray-50">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BarChart2 className="text-gray-400" />
                        </div>
                        <h3 className="text-xl font-medium text-gray-900 mb-2">No Assignments Yet</h3>
                        <p className="text-gray-500">You haven't been assigned to any platforms. Please contact your administrator.</p>
                    </div>
                )}
            </div>

            <div className="pt-8 border-t">
                <h2 className="text-2xl font-bold mb-4">My Sticky Notes</h2>
                <div className="h-[500px]">
                    <StickyNoteBoard />
                </div>
            </div>
        </div>
    );
}
