import { useEffect, useState } from 'react';
import { PlatformService } from '@/services/platform';
import { Platform } from '@/types';
import { Button } from '@/components/ui/button';
import { Plus, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import CreatePlatformDialog from '@/components/platforms/CreatePlatformDialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function PlatformListPage() {
    const [platforms, setPlatforms] = useState<Platform[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const fetchPlatforms = async () => {
        try {
            const data = await PlatformService.getAll();
            setPlatforms(data);
        } catch (error) {
            console.error('Failed to fetch platforms', error);
        }
    };

    useEffect(() => {
        fetchPlatforms();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Platforms</h1>
                    <p className="text-muted-foreground">Manage your tracking platforms and configurations.</p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                    <Plus size={16} /> Add Platform
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {platforms.map((platform) => (
                    <Card key={platform.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xl font-bold">{platform.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CardDescription className="mb-4">
                                {platform.description || 'No description provided.'}
                            </CardDescription>
                            <Link to={`/admin/platforms/${platform.id}/edit`}>
                                <Button variant="outline" className="w-full gap-2">
                                    <Settings size={16} /> Configure Fields
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ))}
                {platforms.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500 border-2 border-dashed rounded-lg">
                        No platforms found. Create one to get started.
                    </div>
                )}
            </div>

            <CreatePlatformDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onSuccess={fetchPlatforms}
            />
        </div>
    );
}
