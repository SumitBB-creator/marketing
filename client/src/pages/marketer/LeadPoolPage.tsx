import { useState, useEffect } from "react";
// import { useParams } from "react-router-dom"; 
// useParams unused
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Interface Platform removed as unused

interface Lead {
    id: string;
    created_at: string;
    platform: { name: string };
    lead_data: any;
}

export default function LeadPoolPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchPoolLeads = async () => {
        setLoading(true);
        try {
            // Fetch unassigned leads
            const res = await api.get('/leads', { params: { marketer_id: 'unassigned' } });
            setLeads(res.data.leads || []);
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to load lead pool",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPoolLeads();
    }, []);

    const handleClaim = async (leadId: string) => {
        try {
            setClaiming(leadId);
            await api.post(`/leads/${leadId}/claim`);

            toast({
                title: "Lead Claimed",
                description: "You have successfully claimed this lead.",
            });

            // Remove from list
            setLeads(prev => prev.filter(l => l.id !== leadId));
        } catch (error: any) {
            toast({
                title: "Claim Failed",
                description: error.response?.data?.message || "Could not claim lead",
                variant: "destructive"
            });
            // Refresh to sync state if someone else claimed it
            fetchPoolLeads();
        } finally {
            setClaiming(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Common Lead Pool</h2>
                    <p className="text-muted-foreground">Claim unassigned leads from the common pool.</p>
                </div>
                <Button variant="outline" onClick={fetchPoolLeads}><Loader2 size={16} className="mr-2" /> Refresh</Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Users size={20} /> Available Leads</CardTitle>
                    <CardDescription>First come, first served. Claiming a lead assigns it to you exclusively.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : leads.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            No unassigned leads available in the pool right now.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Platform</TableHead>
                                    <TableHead>Lead Summary</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leads.map((lead) => (
                                    <TableRow key={lead.id}>
                                        <TableCell><Badge variant="outline">{lead.platform.name}</Badge></TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                {Object.entries(lead.lead_data).slice(0, 3).map(([k, v]) => (
                                                    <span key={k} className="mr-3 text-muted-foreground">
                                                        <span className="font-medium text-foreground">{k}:</span> {String(v)}
                                                    </span>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(lead.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                size="sm"
                                                onClick={() => handleClaim(lead.id)}
                                                disabled={claiming === lead.id}
                                            >
                                                {claiming === lead.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Claim <ArrowRight className="ml-2 h-4 w-4" /></>}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
