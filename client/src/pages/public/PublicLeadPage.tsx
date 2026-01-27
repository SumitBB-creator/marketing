import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { LeadService } from '@/services/lead';
import { formatDateIST } from '@/lib/utils';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function PublicLeadPage() {
    const { token } = useParams<{ token: string }>();
    const [lead, setLead] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!token) return;
        loadLead();
    }, [token]);

    const loadLead = async () => {
        try {
            const data = await LeadService.getPublicLead(token as string);
            setLead(data);
        } catch (e: any) {
            setError(e.response?.data?.message || 'Failed to load lead');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={32} /></div>;
    if (error) return <div className="min-h-screen flex flex-col items-center justify-center text-red-500 gap-2"><AlertCircle size={32} />{error}</div>;
    if (!lead) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
            <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="bg-blue-600 text-white p-6">
                    <h1 className="text-2xl font-bold">{lead.platform_name} Lead</h1>
                    <div className="text-blue-100 text-sm mt-1">Managed by {lead.marketer_name}</div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded border">
                            <label className="text-xs font-bold text-gray-700 uppercase">Status</label>
                            <div className="mt-1 font-medium text-gray-900">{lead.current_status || 'New'}</div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded border">
                            <label className="text-xs font-bold text-gray-700 uppercase">Created At</label>
                            <div className="mt-1 font-medium text-gray-900">{formatDateIST(lead.created_at)}</div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2 text-gray-900">Details</h3>
                        <div className="grid gap-4">
                            {lead.fields?.map((field: any) => {
                                const val = lead.lead_data[field.field_name];
                                if (!val) return null;
                                return (
                                    <div key={field.id} className="grid sm:grid-cols-3 gap-2 py-2 border-b last:border-0 border-gray-100">
                                        <div className="text-sm font-medium text-gray-700 sm:col-span-1">{field.field_name}</div>
                                        <div className="text-sm text-gray-900 sm:col-span-2 break-words">
                                            {field.field_type === 'file' ? (
                                                <a href={val} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                                                    View File
                                                </a>
                                            ) : (
                                                String(val)
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                        <h3 className="text-lg font-semibold border-b pb-2 text-gray-900">Activity History</h3>
                        <div className="space-y-4">
                            {lead.activities?.map((activity: any) => (
                                <div key={activity.id} className="flex gap-3 text-sm">
                                    <div className="mt-1">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 ring-4 ring-blue-50"></div>
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between text-gray-500 text-xs">
                                            <span className="font-semibold text-gray-700">{activity.marketer.full_name}</span>
                                            <span>{formatDateIST(activity.created_at)}</span>
                                        </div>
                                        <div className="text-gray-900 font-medium">
                                            {activity.activity_type.replace('_', ' ').toUpperCase()}
                                        </div>
                                        {activity.activity_type === 'updated' && activity.new_values && (
                                            <div className="text-xs text-gray-600 space-y-1 bg-gray-50 p-2 rounded border border-gray-100">
                                                {Object.entries(activity.new_values).map(([key, newVal]) => {
                                                    const oldVal = activity.old_values ? activity.old_values[key] : null;
                                                    // Skip if values match or strictly eq (though db recording should assume change)
                                                    // Handle long text?
                                                    return (
                                                        <div key={key} className="flex flex-wrap gap-1">
                                                            <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                                                            <span className="text-red-400 line-through decoration-red-400/50">{String(oldVal || 'Empty')}</span>
                                                            <span className="text-gray-400">→</span>
                                                            <span className="text-green-600">{String(newVal || 'Empty')}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        {activity.notes && (
                                            <div className="text-gray-700 bg-gray-100 p-2 rounded text-xs whitespace-pre-wrap">
                                                {activity.notes}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {(!lead.activities || lead.activities.length === 0) && (
                                <div className="text-gray-500 italic text-sm">No activity recorded.</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 text-center text-xs text-gray-400">
                    LeadTrack Pro &copy; {new Date().getFullYear()}
                </div>
            </div>
        </div>
    );
}
