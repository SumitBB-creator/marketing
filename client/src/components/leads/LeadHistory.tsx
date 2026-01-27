import { formatDateIST } from '@/lib/utils';



interface LeadHistoryProps {
    activities: any[];
}

export default function LeadHistory({ activities }: LeadHistoryProps) {
    if (!activities || activities.length === 0) {
        return (
            <div className="text-center text-gray-500 py-4 text-sm">
                No history available.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 uppercase tracking-wider">Activity History</h4>
            <div className="border rounded-md divide-y dark:divide-gray-800">
                {activities.map((activity) => {
                    const diffs = getDiffs(activity.old_values, activity.new_values);

                    return (
                        <div key={activity.id} className="p-3 text-sm flex flex-col gap-1 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <div className="flex justify-between items-start">
                                <div className="font-medium text-gray-800 dark:text-gray-200">
                                    {formatAction(activity.activity_type)}
                                </div>
                                <div className="text-xs text-gray-400 font-mono">
                                    {formatDateIST(activity.created_at)}
                                </div>
                            </div>
                            <div className="text-gray-500 text-xs">
                                by <span className="font-medium text-gray-700 dark:text-gray-300">{activity.marketer?.full_name || 'Unknown'}</span>
                            </div>
                            {activity.notes && (
                                <div className="mt-1 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-2 rounded text-xs border border-gray-100 dark:border-gray-800">
                                    {activity.notes}
                                </div>
                            )}

                            {/* Display Diffs for updates */}
                            {activity.activity_type === 'updated' && diffs.length > 0 && (
                                <div className="mt-2 space-y-1">
                                    {diffs.map((diff, idx) => (
                                        <div key={idx} className="text-xs flex items-center gap-2">
                                            <span className="font-medium text-gray-500">{diff.field}:</span>
                                            <span className="line-through text-red-500 opacity-70">{String(diff.from || '-')}</span>
                                            <span className="text-gray-400">→</span>
                                            <span className="text-green-600 font-medium">{String(diff.to || '-')}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function formatAction(type: string) {
    switch (type) {
        case 'created': return 'Lead Created';
        case 'updated': return 'Details Updated';
        case 'status_changed': return 'Status Changed';
        case 'note_added': return 'Note Added';
        default: return type.replace('_', ' ');
    }
}

function getDiffs(oldVal: any, newVal: any) {
    if (!oldVal || !newVal) return [];

    // Flatten if needed, but assuming flat objects for lead_data
    const changes: { field: string, from: any, to: any }[] = [];

    const allKeys = new Set([...Object.keys(oldVal), ...Object.keys(newVal)]);

    allKeys.forEach(key => {
        const from = oldVal[key];
        const to = newVal[key];

        // Simple equality check (works for primitives)
        if (from !== to && (from || to)) { // Ignore if both empty/null-ish
            changes.push({ field: key, from, to });
        }
    });

    return changes;
}
