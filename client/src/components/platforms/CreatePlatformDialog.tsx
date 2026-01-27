import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlatformService } from '@/services/platform';

const platformSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
});

type PlatformFormValues = z.infer<typeof platformSchema>;

interface CreatePlatformDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreatePlatformDialog({ isOpen, onClose, onSuccess }: CreatePlatformDialogProps) {
    const [loading, setLoading] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm<PlatformFormValues>({
        resolver: zodResolver(platformSchema)
    });

    const onSubmit = async (data: PlatformFormValues) => {
        setLoading(true);
        try {
            await PlatformService.create(data);
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md p-6">
                <h2 className="text-xl font-bold mb-4">Create New Platform</h2>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Platform Name</Label>
                        <Input id="name" placeholder="e.g. LinkedIn" {...register('name')} />
                        {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input id="description" placeholder="Optional description" {...register('description')} />
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Platform'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
