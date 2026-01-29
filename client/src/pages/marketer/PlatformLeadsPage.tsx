import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LeadService } from '@/services/lead';
import { PlatformService } from '@/services/platform';
import { Platform } from '@/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import LeadForm from '@/components/leads/LeadForm';
import DynamicLeadTable from '@/components/leads/DynamicLeadTable';
import LeadImportDialog from '@/components/leads/LeadImportDialog';

export default function PlatformLeadsPage() {
    const { platformId } = useParams<{ platformId: string }>();
    const [leads, setLeads] = useState<any[]>([]);
    const [platform, setPlatform] = useState<Platform | null>(null);
    const [editingLead, setEditingLead] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        if (!platformId) return;
        setLoading(true);
        try {
            const [platData, leadsData] = await Promise.all([
                PlatformService.getById(platformId),
                LeadService.getAll({ platform_id: platformId })
            ]);
            setPlatform(platData);
            setLeads(leadsData.leads);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [platformId]);

    const handleSave = async (id: string, data: any) => {
        try {
            await LeadService.update(id, data);
            fetchData();
        } catch (error) {
            console.error("Failed to save lead", error);
            alert("Failed to save lead");
        }
    };

    const handleCreate = async (data: any) => {
        if (!platform) return;
        try {
            await LeadService.create({
                ...data,
                platform_id: platform.id
            });
            fetchData();
        } catch (error) {
            console.error("Failed to create lead", error);
            alert("Failed to create lead");
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await LeadService.delete(id);
            fetchData();
        } catch (error: any) {
            console.error("Failed to delete lead", error);
            alert(`Failed to delete lead: ${error.response?.data?.message || 'Unknown error'}`);
        }
    };

    const handleOptOut = async (id: string) => {
        try {
            await LeadService.optOut(id);
            fetchData();
        } catch (error: any) {
            console.error("Failed to opt out", error);
            alert(`Failed to opt out: ${error.response?.data?.message || 'Unknown error'}`);
        }
    };

    if (!platformId) return <div>Invalid URL</div>;

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center gap-4">
                <Link to="/">
                    <Button variant="ghost" size="icon"><ArrowLeft size={20} /></Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">{platform?.name || 'Loading...'} Leads</h1>
                    <p className="text-muted-foreground text-sm">Track and manage your leads. Inline edit available.</p>
                </div>
                {platform && (
                    <div className="ml-auto">
                        <LeadImportDialog
                            platformId={platform.id}
                            platformName={platform.name}
                            onSuccess={fetchData}
                        />
                    </div>
                )}
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-10">Loading leads...</div>
                ) : (
                    <DynamicLeadTable
                        leads={leads}
                        platforms={platform ? [platform] : []}
                        onSave={handleSave}
                        onCreate={handleCreate}
                        onDelete={handleDelete}
                        onOptOut={handleOptOut}
                        disableCopy={true}
                    />
                )}
            </div>

            {/* Edit Modal (Optional fallback) */}
            {
                editingLead && platform && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <h2 className="text-xl font-bold mb-4">Edit Lead (Detailed)</h2>
                                <LeadForm
                                    platformId={platform.id}
                                    fields={platform.fields || []}
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
                )
            }
        </div >
    );
}
