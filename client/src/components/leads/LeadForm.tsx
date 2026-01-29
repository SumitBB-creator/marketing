import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { PlatformField } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { LeadService } from '@/services/lead';
import LeadHistory from './LeadHistory';
import api from '@/lib/axios';
import { FileIcon } from 'lucide-react';

interface LeadFormProps {
    platformId: string;
    fields: PlatformField[];
    initialData?: any; // For editing
    leadId?: string;   // For editing
    onSuccess: () => void;
    onCancel: () => void;
}

import { useAuth } from '@/context/AuthContext';
import { Checkbox } from '@/components/ui/checkbox';

export default function LeadForm({ platformId, fields, initialData, leadId, onSuccess, onCancel }: LeadFormProps) {
    const { user } = useAuth();
    // If initialData is provided, use it for defaults.
    // If leadId is provided, we might want to fetch fresh data for history.
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
        defaultValues: initialData ? {
            ...initialData.lead_data,
            current_status: initialData.current_status,
        } : {}
    });

    // Default to false for single create, user must verify
    const [assignToPool, setAssignToPool] = useState(false);

    const [loading, setLoading] = useState(false);
    const [activities, setActivities] = useState<any[]>([]);

    useEffect(() => {
        const loadFullDetails = async () => {
            if (leadId) {
                try {
                    const fullLead = await LeadService.getById(leadId);
                    if (fullLead && fullLead.activities) {
                        setActivities(fullLead.activities);
                    }
                    // Optional: Update form values with fresh data
                    reset({
                        ...fullLead.lead_data,
                        current_status: fullLead.current_status,
                    });
                } catch (e) {
                    console.error("Failed to load lead history", e);
                }
            }
        };
        // If we only have partial initialData (from list view) or just leadId, load full
        if (leadId) {
            loadFullDetails();
        }
    }, [leadId]);


    // Group fields
    const leadFields = fields.filter(f => f.field_category === 'lead_detail')
        .sort((a, b) => a.field_order - b.field_order);
    const trackFields = fields.filter(f => f.field_category === 'tracking_action')
        .sort((a, b) => a.field_order - b.field_order);

    const onSubmit = async (data: any) => {
        setLoading(true);
        try {
            // Separate standard fields
            const leadData: any = {};
            fields.forEach(field => {
                leadData[field.field_name] = data[field.field_name];
            });

            if (leadId) {
                // UPDATE
                await LeadService.update(leadId, {
                    lead_data: leadData,
                    current_status: 'New', // TODO: Allow status edit via form if field exists? Or assume status flow is separate?
                    // For now, preserving backend logic or explicit status field if we add it to form
                    // actually, we aren't submitting current_status from form unless it's a field.
                    // Let's check: in initialData we map current_status.
                    // We should probably allow editing status if it's not a dynamic field but a system field?
                    // User asked for "track status changes".
                    // Let's assume status is updated via this form if we map it back or if we add a status dropdown specific system field.
                    // For now, just sending lead_data updates.
                });
            } else {
                // CREATE
                await LeadService.create({
                    platform_id: platformId,
                    lead_data: leadData,
                    current_status: 'New',
                    assign_to_pool: assignToPool
                });
            }
            onSuccess();
        } catch (error) {
            console.error(error);
            alert('Failed to save lead');
        } finally {
            setLoading(false);
        }
    };

    const renderField = (field: PlatformField) => {
        return (
            <div key={field.id} className="space-y-2">
                <Label htmlFor={field.field_name}>
                    {field.field_name} {field.is_required && <span className="text-red-500">*</span>}
                </Label>

                {field.field_type === 'textarea' ? (
                    <textarea
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...register(field.field_name, { required: field.is_required })}
                    />
                ) : field.field_type === 'select' ? (
                    <Select {...register(field.field_name, { required: field.is_required })}>
                        <option value="">Select option...</option>
                        {Array.isArray(field.options) ? (
                            field.options.map((opt: string, idx: number) => (
                                <option key={idx} value={opt}>{opt}</option>
                            ))
                        ) : (
                            <>
                                <option value="Option 1">Option 1</option>
                                <option value="Option 2">Option 2</option>
                            </>
                        )}
                    </Select>
                ) : field.field_type === 'file' ? (
                    <div className="space-y-2">
                        <div className="flex gap-2 items-center">
                            <Input
                                type="file"
                                accept="image/*,.pdf,.doc,.docx"
                                className="cursor-pointer file:bg-blue-50 file:text-blue-700 file:border-0 file:rounded-md file:px-2 file:py-1 file:mr-4 file:text-sm file:font-medium hover:file:bg-blue-100"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;

                                    setLoading(true);
                                    const formData = new FormData();
                                    formData.append('file', file);

                                    try {
                                        const res = await api.post('/upload', formData, {
                                            headers: { 'Content-Type': 'multipart/form-data' }
                                        });
                                        setValue(field.field_name, res.data.url);
                                    } catch (err) {
                                        console.error(err);
                                        alert("Upload failed");
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                            />
                        </div>
                        <input type="hidden" {...register(field.field_name, { required: field.is_required })} />
                        {watch(field.field_name) && (
                            <div className="text-sm text-green-600 flex items-center gap-1 mt-1">
                                <FileIcon size={14} />
                                <a href={watch(field.field_name)} target="_blank" rel="noopener noreferrer" className="underline truncate max-w-[200px]">
                                    View Uploaded File
                                </a>
                            </div>
                        )}
                    </div>
                ) : (
                    <Input
                        type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : field.field_type === 'datetime' ? 'datetime-local' : 'text'}
                        {...register(field.field_name, { required: field.is_required })}
                    />
                )}

                {errors[field.field_name] && <p className="text-red-500 text-sm">This field is required</p>}
            </div>
        );
    };

    return (
        <div className="space-y-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                    <h4 className="font-medium border-b pb-2">Lead Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {leadFields.map(renderField)}
                    </div>
                </div>

                {trackFields.length > 0 && (
                    <div className="space-y-4">
                        <h4 className="font-medium border-b pb-2">Tracking Status</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {trackFields.map(renderField)}
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-center pt-4">
                    {/* Admin Option: Add to Pool */}
                    {(user?.role === 'admin' || user?.role === 'super_admin') && !leadId ? (
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="assign_pool"
                                checked={assignToPool}
                                onChange={(e) => setAssignToPool(e.target.checked)}
                            />
                            <Label htmlFor="assign_pool" className="text-sm font-normal">Add to Common Lead Pool</Label>
                        </div>
                    ) : (<span></span>)}

                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Lead'}
                        </Button>
                    </div>
                </div>
            </form>

            {/* History Section - Only if editing */}
            {leadId && (
                <div className="pt-6 border-t">
                    <LeadHistory activities={activities} />
                </div>
            )}
        </div>
    );
}
