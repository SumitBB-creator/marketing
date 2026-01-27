import { useEffect, useState } from 'react';
import { MarketerService } from '@/services/marketer';
import { Button } from '@/components/ui/button';
import { UserPlus, Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CreateMarketerDialog from '@/components/marketers/CreateMarketerDialog';
import PlatformAssignmentDialog from '@/components/marketers/PlatformAssignmentDialog';

interface Marketer {
    id: string;
    full_name: string;
    email: string;
    _count: {
        leads: number;
        marketer_assignments: number;
    }
}

export default function MarketerListPage() {
    const [marketers, setMarketers] = useState<Marketer[]>([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [assignmentUser, setAssignmentUser] = useState<{ id: string, name: string } | null>(null);

    const fetchMarketers = async () => {
        try {
            const data = await MarketerService.getAll();
            setMarketers(data);
        } catch (error) {
            console.error('Failed to fetch marketers', error);
        }
    };

    useEffect(() => {
        fetchMarketers();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
                    <p className="text-muted-foreground">Manage marketers and their platform assignments.</p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                    <UserPlus size={16} /> Add Marketer
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {marketers.map((marketer) => (
                    <Card key={marketer.id}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-lg font-bold">{marketer.full_name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-500 mb-4">{marketer.email}</p>

                            <div className="grid grid-cols-2 gap-4 mb-4 text-center">
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{marketer._count.leads}</div>
                                    <div className="text-xs text-gray-500">Leads</div>
                                </div>
                                <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{marketer._count.marketer_assignments}</div>
                                    <div className="text-xs text-gray-500">Platforms</div>
                                </div>
                            </div>

                            <Button variant="outline" className="w-full gap-2" onClick={() => setAssignmentUser({ id: marketer.id, name: marketer.full_name })}>
                                <Layers size={16} /> Manage Assignments
                            </Button>
                        </CardContent>
                    </Card>
                ))}
                {marketers.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500 border-2 border-dashed rounded-lg">
                        No marketers found. Add one to get started.
                    </div>
                )}
            </div>

            <CreateMarketerDialog
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSuccess={fetchMarketers}
            />

            {assignmentUser && (
                <PlatformAssignmentDialog
                    isOpen={!!assignmentUser}
                    onClose={() => setAssignmentUser(null)}
                    marketerId={assignmentUser.id}
                    marketerName={assignmentUser.name}
                />
            )}
        </div>
    );
}
