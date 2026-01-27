import { useEffect, useState } from 'react';
import { LeadService } from '@/services/lead';
import { PlatformService } from '@/services/platform';

import LeadForm from '@/components/leads/LeadForm';
import DynamicLeadTable from '@/components/leads/DynamicLeadTable';

export default function AllLeadsPage() {
    const [leads, setLeads] = useState<any[]>([]);
    const [platforms, setPlatforms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingLead, setEditingLead] = useState<any | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch all leads and accessible platforms
            // Note: Marketers can only see platforms assignments, handled by backend usually or we fetch marketer assignments here if needed.
            // PlatformService.getAll() returns all platforms created by user if admin, or assigned if marketer?
            // Let's assume PlatformService.getAll() is secured. If not precise, DynamicTable simply won't show dynamic columns for non-fetched platforms.
            // But we need the platform configs for the columns.
            const [leadsData, platformsData] = await Promise.all([
                LeadService.getAll(),
                PlatformService.getAll()
            ]);
            setLeads(leadsData.leads);
            setPlatforms(platformsData);
        } catch (error) {
            console.error("Failed to fetch leads", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleEditClick = (lead: any) => {
        setEditingLead(lead);
    };

    const handleSave = async (id: string, data: any) => {
        try {
            await LeadService.update(id, data);
            fetchData();
        } catch (error) {
            console.error("Failed to save lead", error);
            alert("Failed to save lead");
        }
    };

    return (
        <div className="p-8 space-y-6">
            <h1 className="text-3xl font-bold">All Leads</h1>
            <p className="text-gray-500">View and manage leads from all your assigned platforms.</p>

            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-10">Loading leads...</div>
                ) : (
                    <DynamicLeadTable
                        leads={leads}
                        platforms={platforms}
                        onEdit={handleEditClick}
                        onSave={handleSave}
                        disableCopy={true}
                    />
                )}
            </div>

            {/* Edit Modal */}
            {editingLead && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-xl font-bold mb-4">Edit Lead</h2>
                            <LeadForm
                                platformId={editingLead.platform_id}
                                fields={editingLead.platform?.fields || []}
                                initialData={editingLead}
                                leadId={editingLead.id}
                                onSuccess={() => {
                                    setEditingLead(null);
                                    fetchData();
                                }}
                                onCancel={() => setEditingLead(null)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
