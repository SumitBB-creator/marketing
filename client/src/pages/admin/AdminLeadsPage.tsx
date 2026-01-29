import { useEffect, useState } from 'react';

import { LeadService } from '@/services/lead';
import { PlatformService } from '@/services/platform';
import { MarketerService } from '@/services/marketer';
import { Card, CardContent } from '@/components/ui/card';
import DynamicLeadTable from '@/components/leads/DynamicLeadTable';
import { Button } from '@/components/ui/button';
import { X, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import LeadForm from '@/components/leads/LeadForm';
import LeadImportDialog from '@/components/leads/LeadImportDialog';

export default function AdminLeadsPage() {
    const [leads, setLeads] = useState<any[]>([]);
    const [platforms, setPlatforms] = useState<any[]>([]);
    const [marketers, setMarketers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [selectedPlatform, setSelectedPlatform] = useState('');
    const [selectedMarketer, setSelectedMarketer] = useState('');

    // View/Edit Modal
    const [viewingLead, setViewingLead] = useState<any | null>(null);

    // Import State
    const [showImportSelector, setShowImportSelector] = useState(false);
    const [importTargetPlatform, setImportTargetPlatform] = useState<string>('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (selectedPlatform) params.platform_id = selectedPlatform;
            if (selectedMarketer) params.marketer_id = selectedMarketer;

            const [leadsData, platformsData, marketersData] = await Promise.all([
                LeadService.getAll(params),
                PlatformService.getAll(),
                MarketerService.getAll()
            ]);

            setLeads(leadsData.leads);
            setPlatforms(platformsData);
            setMarketers(marketersData);
        } catch (error) {
            console.error("Failed to fetch admin leads data", error);
        } finally {
            setLoading(false);
        }
    };

    // Re-fetch when filters change (debouncing could be added, but simple effect is fine for now)
    useEffect(() => {
        fetchData();
    }, [selectedPlatform, selectedMarketer]);

    const clearFilters = () => {
        setSelectedPlatform('');
        setSelectedMarketer('');
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

    const handleDelete = async (id: string) => {
        try {
            await LeadService.delete(id);
            fetchData();
        } catch (error: any) {
            console.error("Failed to delete lead", error);
            alert(`Failed to delete lead: ${error.response?.data?.message || 'Unknown error'}`);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Leads Management</h1>

            {/* Filters */}
            <Card>
                <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-end">
                    <div className="w-full md:w-1/3">
                        <label className="text-sm font-medium mb-1 block">Filter by Platform</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={selectedPlatform}
                            onChange={(e) => setSelectedPlatform(e.target.value)}
                        >
                            <option value="">All Platforms</option>
                            {platforms.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="w-full md:w-1/3">
                        <label className="text-sm font-medium mb-1 block">Filter by Marketer</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={selectedMarketer}
                            onChange={(e) => setSelectedMarketer(e.target.value)}
                        >
                            <option value="">All Marketers</option>
                            {marketers.map(m => (
                                <option key={m.id} value={m.id}>{m.full_name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="w-full md:w-auto flex gap-2">
                        <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => {
                                if (selectedPlatform) {
                                    setImportTargetPlatform(selectedPlatform);
                                    // LeadImportDialog will open because importTargetPlatform is set and it's controlled below
                                } else {
                                    setImportTargetPlatform('');
                                    setShowImportSelector(true);
                                }
                            }}
                        >
                            <Upload size={16} /> Import Excel
                        </Button>

                        {/* Selector Dialog */}
                        <Dialog open={showImportSelector} onOpenChange={setShowImportSelector}>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Select Platform</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Select which platform you want to import leads into:</Label>
                                        <div className="grid gap-2">
                                            {platforms.map(p => (
                                                <Button
                                                    key={p.id}
                                                    variant="outline"
                                                    className="justify-start"
                                                    onClick={() => {
                                                        setImportTargetPlatform(p.id);
                                                        setShowImportSelector(false);
                                                        // Dialog closes, but importTargetPlatform is set, so LeadImportDialog opens
                                                    }}
                                                >
                                                    {p.name}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setShowImportSelector(false)}>Cancel</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        {/* Controlled Import Dialog */}
                        {importTargetPlatform && (
                            <LeadImportDialog
                                isOpen={!!importTargetPlatform}
                                onOpenChange={(open: boolean) => {
                                    if (!open) setImportTargetPlatform('');
                                }}
                                platformId={importTargetPlatform}
                                platformName={platforms.find(p => p.id === importTargetPlatform)?.name || 'Platform'}
                                onSuccess={() => {
                                    setImportTargetPlatform('');
                                    fetchData();
                                }}
                            />
                        )}

                        <Button variant="outline" onClick={clearFilters} disabled={!selectedPlatform && !selectedMarketer}>
                            <X size={16} className="mr-2" /> Clear Filters
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Dynamic Table */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-10">Loading leads...</div>
                ) : (
                    <DynamicLeadTable
                        leads={leads}
                        platforms={platforms}
                        onSave={handleSave}
                        onEdit={(lead) => setViewingLead(lead)}
                        onDelete={handleDelete}
                    />
                )}
            </div>

            {/* View/Edit Details Modal */}
            {viewingLead && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold">Lead Details</h2>
                                <Button variant="ghost" size="icon" onClick={() => setViewingLead(null)}>
                                    <X size={20} />
                                </Button>
                            </div>

                            {/* Find platform for this lead to pass correct fields */}
                            {(() => {
                                const platform = platforms.find(p => p.id === viewingLead.platform_id || p.name === viewingLead.platform?.name);
                                return (
                                    <LeadForm
                                        platformId={viewingLead.platform_id}
                                        fields={platform?.fields || []}
                                        initialData={viewingLead}
                                        leadId={viewingLead.id}
                                        onSuccess={() => {
                                            setViewingLead(null);
                                            fetchData();
                                        }}
                                        onCancel={() => setViewingLead(null)}
                                    />
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
