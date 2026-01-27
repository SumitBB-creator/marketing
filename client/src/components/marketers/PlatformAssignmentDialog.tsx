import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlatformService } from '@/services/platform';
import { MarketerService } from '@/services/marketer';
import { Platform } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface PlatformAssignmentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    marketerId: string;
    marketerName: string;
}

export default function PlatformAssignmentDialog({ isOpen, onClose, marketerId, marketerName }: PlatformAssignmentDialogProps) {
    const [platforms, setPlatforms] = useState<Platform[]>([]);
    const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && marketerId) {
            loadData();
        }
    }, [isOpen, marketerId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [allPlatforms, assignments] = await Promise.all([
                PlatformService.getAll(),
                MarketerService.getAssignments(marketerId)
            ]);
            setPlatforms(allPlatforms);
            setAssignedIds(new Set(assignments.map((a: any) => a.platform_id)));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const toggleAssignment = async (platformId: string, isChecked: boolean) => {
        // Optimistic update
        const newSet = new Set(assignedIds);
        if (isChecked) newSet.add(platformId);
        else newSet.delete(platformId);
        setAssignedIds(newSet);

        try {
            if (isChecked) {
                await MarketerService.assignPlatform(marketerId, platformId);
            } else {
                await MarketerService.removeAssignment(marketerId, platformId);
            }
        } catch (error) {
            console.error('Failed to update assignment', error);
            // Revert on error
            loadData();
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md p-6">
                <h2 className="text-xl font-bold mb-4">Assign Platforms to {marketerName}</h2>

                {loading ? (
                    <div className="py-8 text-center">Loading...</div>
                ) : (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                        {platforms.length === 0 ? (
                            <p className="text-gray-500">No platforms available.</p>
                        ) : (
                            platforms.map(platform => (
                                <div key={platform.id} className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <Checkbox
                                        id={`platform-${platform.id}`}
                                        checked={assignedIds.has(platform.id)}
                                        onChange={(e) => toggleAssignment(platform.id, e.target.checked)}
                                    />
                                    <Label htmlFor={`platform-${platform.id}`} className="cursor-pointer flex-1">
                                        {platform.name}
                                    </Label>
                                </div>
                            ))
                        )}
                    </div>
                )}

                <div className="flex justify-end mt-6">
                    <Button onClick={onClose}>Done</Button>
                </div>
            </div>
        </div>
    );
}
