import { useState, useRef, ReactNode, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Upload, Loader2, AlertCircle, CheckCircle, X } from 'lucide-react';
import api from '@/lib/axios';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface LeadImportDialogProps {
    platformId: string;
    platformName: string;
    onSuccess?: () => void;
    trigger?: ReactNode;
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
}

import { useAuth } from '@/context/AuthContext';

export default function LeadImportDialog({ platformId, platformName, onSuccess, trigger, isOpen, onOpenChange }: LeadImportDialogProps) {
    const { user } = useAuth();
    const [internalOpen, setInternalOpen] = useState(false);

    const isControlled = isOpen !== undefined;
    const open = isControlled ? isOpen : internalOpen;
    const setOpen = isControlled ? onOpenChange : setInternalOpen;

    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<any | null>(null);
    const [assignToPool, setAssignToPool] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    // Reset when dialog opens/closes
    useEffect(() => {
        if (!open) {
            setFile(null);
            setResult(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } else {
            // Default to pool if admin or super_admin
            if (user?.role === 'admin' || user?.role === 'super_admin') {
                setAssignToPool(true);
            } else {
                setAssignToPool(false);
            }
        }
    }, [open, user]);

    const handleDownloadTemplate = async () => {
        try {
            const res = await api.get(`/import/${platformId}/template`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${platformName}_Template.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Failed to download template", error);
            toast({
                title: "Download Failed",
                description: "Could not download the template.",
                variant: "destructive"
            });
        }
    };

    const handleImport = async () => {
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('assignToPool', String(assignToPool));

        try {
            const res = await api.post(`/import/${platformId}/import`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setResult(res.data);
            toast({
                title: "Import Successful",
                description: `Imported: ${res.data.imported} leads.`,
            });
            if (onSuccess) onSuccess();
        } catch (error: any) {
            console.error(error);
            setResult({ error: error.response?.data?.message || 'Import failed' });
            toast({
                title: "Import Failed",
                description: error.response?.data?.message || "Something went wrong",
                variant: "destructive"
            });
        } finally {
            setUploading(false);
        }
    };

    const reset = () => {
        setFile(null);
        setResult(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <Dialog open={open} onOpenChange={(val: boolean) => {
            if (setOpen) setOpen(val);
            if (!val) reset();
        }}>
            {(!isControlled || trigger) && (
                <DialogTrigger asChild>
                    {trigger || (
                        <Button variant="outline" className="gap-2">
                            <Upload size={16} /> Import Excel
                        </Button>
                    )}
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Import Leads for {platformName}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Step 1: Template */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                            Step 1: Get Template
                        </h4>
                        <p className="text-xs text-muted-foreground">Download the Excel template with correct headers for this platform.</p>
                        <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="w-full gap-2">
                            <Download size={14} /> Download Template
                        </Button>
                    </div>

                    {/* Step 2: Upload */}
                    <div className="p-4 border border-dashed rounded-lg space-y-4 text-center">
                        <h4 className="font-medium text-sm text-left">Step 2: Upload File</h4>
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={(e) => {
                                if (e.target.files?.[0]) {
                                    setFile(e.target.files[0]);
                                    setResult(null);
                                }
                            }}
                        />

                        {!file ? (
                            <div
                                className="py-8 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">Click to select Excel file</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center space-x-2 justify-center">
                                    <Checkbox
                                        id="pool"
                                        checked={assignToPool}
                                        onChange={(e) => setAssignToPool(e.target.checked)}
                                    />
                                    <Label htmlFor="pool" className="text-sm font-normal">Add to Common Lead Pool (Unassigned)</Label>
                                </div>

                                <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                                    <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                                    <Button variant="ghost" size="sm" onClick={reset} className="h-6 w-6 p-0 text-red-500">
                                        <X size={14} />
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>

                    {result && (
                        <div className="space-y-2">
                            {result.error ? (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>{result.error}</AlertDescription>
                                </Alert>
                            ) : (
                                <Alert className="bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
                                    <CheckCircle className="h-4 w-4" />
                                    <AlertTitle>Success</AlertTitle>
                                    <AlertDescription>
                                        Imported: {result.imported} leads. {result.failed > 0 && `Failed: ${result.failed} rows.`}
                                    </AlertDescription>
                                </Alert>
                            )}

                            {result.errors && result.errors.length > 0 && (
                                <div className="max-h-[100px] overflow-y-auto text-xs text-red-600 bg-red-50 p-2 rounded">
                                    {result.errors.map((e: any, i: number) => (
                                        <div key={i}>Row {e.row}: {e.error}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => {
                        if (setOpen) setOpen(false);
                    }}>Cancel</Button>
                    <Button onClick={handleImport} disabled={!file || uploading}>
                        {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {uploading ? 'Importing...' : 'Import Leads'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
