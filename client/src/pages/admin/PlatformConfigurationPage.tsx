import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PlatformService } from '@/services/platform';
import { Platform, PlatformField } from '@/types';
import FieldBuilder from '@/components/fields/FieldBuilder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
// Minimal workaround for Select/Checkbox since we haven't implemented shadcn select yet
// Using native select/checkbox for simplicity in this iteration

export default function PlatformConfigurationPage() {
    const { id } = useParams<{ id: string }>();
    const [platform, setPlatform] = useState<Platform | null>(null);
    const [loading, setLoading] = useState(true);

    // New Field State
    const [fieldName, setFieldName] = useState('');
    const [fieldType, setFieldType] = useState('text');
    const [fieldCategory, setFieldCategory] = useState('lead_detail');
    const [isRequired, setIsRequired] = useState(false);
    const [addingField, setAddingField] = useState(false);
    const [fieldOptions, setFieldOptions] = useState(''); // Comma separated

    const fetchPlatform = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const data = await PlatformService.getById(id);
            setPlatform(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlatform();
    }, [id]);

    const handleAddField = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !platform) return;
        setAddingField(true);
        try {
            const maxOrder = platform.fields ? Math.max(...platform.fields.map(f => f.field_order), 0) : 0;

            let parsedOptions = null;
            if (fieldType === 'select' && fieldOptions.trim()) {
                parsedOptions = fieldOptions.split(',').map(o => o.trim()).filter(Boolean);
            }

            await PlatformService.addField(id, {
                field_name: fieldName,
                field_type: fieldType,
                field_category: fieldCategory,
                is_required: isRequired,
                field_order: maxOrder + 1,
                options: parsedOptions
            });

            setFieldName('');
            setFieldType('text');
            setFieldOptions(''); // Reset options
            setIsRequired(false);
            await fetchPlatform();
        } catch (error) {
            console.error(error);
        } finally {
            setAddingField(false);
        }
    }

    // ... (rest of code)

    <div>
        <Label>Data Type</Label>
        <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            value={fieldType}
            onChange={e => setFieldType(e.target.value)}
        >
            <option value="text">Text</option>
            <option value="email">Email</option>
            <option value="url">URL</option>
            <option value="phone">Phone</option>
            <option value="number">Number</option>
            <option value="date">Date</option>
            <option value="textarea">Long Text</option>
            <option value="select">Select / Dropdown</option>
        </select>
    </div>

    {
        fieldType === 'select' && (
            <div>
                <Label>Options (comma separated)</Label>
                <Input
                    value={fieldOptions}
                    onChange={e => setFieldOptions(e.target.value)}
                    placeholder="Option 1, Option 2, Option 3"
                />
                <p className="text-xs text-muted-foreground mt-1">Example: "Hot, Warm, Cold" or "Yes, No"</p>
            </div>
        )
    }

    const handleDeleteField = async (fieldId: string) => {
        if (!id || !confirm('Are you sure you want to delete this field? Data associated with it may be lost.')) return;
        try {
            await PlatformService.deleteField(id, fieldId);
            await fetchPlatform();
        } catch (error) {
            console.error(error);
        }
    }

    // Optimistic UI updates could used here for reordering, not implementing persistence for reorder backend yet in this step specific request
    const handleReorder = (newFields: PlatformField[]) => {
        if (platform) {
            setPlatform({ ...platform, fields: newFields });
            // TODO: Call API to save order
        }
    }

    if (loading) return <div>Loading...</div>;
    if (!platform) return <div>Platform not found</div>;

    const leadFields = platform.fields?.filter(f => f.field_category === 'lead_detail') || [];
    const monitoringFields = platform.fields?.filter(f => f.field_category === 'tracking_action') || [];


    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link to="/admin/platforms">
                    <Button variant="ghost" size="icon"><ArrowLeft size={20} /></Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">{platform.name} Configuration</h1>
                    <p className="text-muted-foreground text-sm">Configure data fields and tracking logic.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Field Creator Panel */}
                <div className="lg:col-span-1 border rounded-lg p-6 bg-white dark:bg-gray-800 h-fit sticky top-6">
                    <h3 className="font-semibold mb-4 text-lg">Add New Field</h3>
                    <form onSubmit={handleAddField} className="space-y-4">
                        <div>
                            <Label>Field Name</Label>
                            <Input value={fieldName} onChange={e => setFieldName(e.target.value)} required placeholder="e.g. Job Title" />
                        </div>
                        <div>
                            <Label>Field Category</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                value={fieldCategory}
                                onChange={e => setFieldCategory(e.target.value)}
                            >
                                <option value="lead_detail">Lead Detail</option>
                                <option value="tracking_action">Tracking Action</option>
                            </select>
                        </div>
                        <div>
                            <Label>Data Type</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                value={fieldType}
                                onChange={e => setFieldType(e.target.value)}
                            >
                                <option value="text">Text</option>
                                <option value="email">Email</option>
                                <option value="url">URL</option>
                                <option value="phone">Phone</option>
                                <option value="number">Number</option>
                                <option value="date">Date</option>
                                <option value="textarea">Long Text</option>
                                <option value="select">Dropdown (Select)</option>
                                <option value="file">File Upload</option>
                            </select>
                        </div>

                        {fieldType === 'select' && (
                            <div>
                                <Label>Options (comma separated)</Label>
                                <Input
                                    value={fieldOptions}
                                    onChange={e => setFieldOptions(e.target.value)}
                                    placeholder="Option 1, Option 2, Option 3"
                                />
                                <p className="text-xs text-muted-foreground mt-1">Example: "Hot, Warm, Cold" or "Yes, No"</p>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="req" checked={isRequired} onChange={e => setIsRequired(e.target.checked)} className="h-4 w-4" />
                            <Label htmlFor="req">Required Field?</Label>
                        </div>
                        <Button type="submit" className="w-full" disabled={addingField}>
                            {addingField ? 'Adding...' : 'Add Field'}
                        </Button>
                    </form>
                </div>

                {/* Field Lists */}
                <div className="lg:col-span-2 space-y-8">
                    <div>
                        <h3 className="font-semibold mb-3 text-lg flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            Lead Details
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">Static information about the lead (Name, Email, etc.)</p>
                        <FieldBuilder
                            fields={leadFields}
                            onReorder={handleReorder}
                            onDelete={handleDeleteField}
                        />
                    </div>

                    <div className="border-t pt-6">
                        <h3 className="font-semibold mb-3 text-lg flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            Tracking Actions
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">Dynamic status fields to track progress (e.g. Connection Sent, Replied)</p>
                        <FieldBuilder
                            fields={monitoringFields}
                            onReorder={handleReorder}
                            onDelete={handleDeleteField}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
