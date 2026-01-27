import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MarketerService } from '@/services/marketer';

const marketerSchema = z.object({
    full_name: z.string().min(2, 'Name is required'),
    email: z.string().email('Invalid email'),
    password: z.string().min(6, 'Password must be at least 6 characters').optional(),
});

type MarketerFormValues = z.infer<typeof marketerSchema>;

interface CreateMarketerDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateMarketerDialog({ isOpen, onClose, onSuccess }: CreateMarketerDialogProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors } } = useForm<MarketerFormValues>({
        resolver: zodResolver(marketerSchema)
    });

    const onSubmit = async (data: MarketerFormValues) => {
        setLoading(true);
        setError(null);
        try {
            await MarketerService.create(data);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create marketer');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md p-6">
                <h2 className="text-xl font-bold mb-4">Add New Marketer</h2>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input id="full_name" placeholder="John Doe" {...register('full_name')} />
                        {errors.full_name && <p className="text-red-500 text-sm">{errors.full_name.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="john@example.com" {...register('email')} />
                        {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Initial Password (Optional)</Label>
                        <Input id="password" type="text" placeholder="Defaults to TempPass123!" {...register('password')} />
                        <p className="text-xs text-gray-500">Leave blank to use default: TempPass123!</p>
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <div className="flex justify-end gap-2 mt-6">
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Marketer'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
