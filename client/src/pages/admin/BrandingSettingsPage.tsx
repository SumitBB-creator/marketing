import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { BrandingService } from '@/services/branding';
// import { BrandingConfig } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { BrandingPreview } from '@/components/admin/BrandingPreview';
// import { Separator } from '@/components/ui/separator';
import { Loader2, RefreshCw, Save } from 'lucide-react';
import { Select } from '@/components/ui/select';
import { useBranding } from '@/components/branding-provider';

const brandingSchema = z.object({
    company_name: z.string().min(1, 'Company name is required'),
    primary_color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, 'Invalid color'),
    secondary_color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, 'Invalid color'),
    accent_color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, 'Invalid color'),
    logo_url: z.string().optional().or(z.literal("")),
    favicon_url: z.string().optional().or(z.literal("")),
    font_family: z.string().optional(),
    font_size_base: z.string().optional(),
    border_radius: z.string().optional(),
    custom_css: z.string().optional(),
});

type BrandingFormValues = z.infer<typeof brandingSchema>;

export default function BrandingSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { refreshBranding } = useBranding();

    const { register, handleSubmit, watch, setValue, formState: { errors, isDirty } } = useForm<BrandingFormValues>({
        resolver: zodResolver(brandingSchema),
        defaultValues: {
            company_name: 'LeadTrack Pro',
            primary_color: '#3B82F6',
            secondary_color: '#10B981',
            accent_color: '#F59E0B',
            border_radius: '0.5rem',
            font_family: 'Inter',
        }
    });

    const watchedValues = watch();

    useEffect(() => {
        loadBranding();
    }, []);

    const loadBranding = async () => {
        try {
            setLoading(true);
            const config = await BrandingService.getBranding();
            if (config) {
                setValue('company_name', config.company_name);
                setValue('primary_color', config.primary_color);
                setValue('secondary_color', config.secondary_color);
                setValue('accent_color', config.accent_color);
                setValue('logo_url', config.logo_url || '');
                setValue('favicon_url', config.favicon_url || '');
                setValue('font_family', config.font_family);
                setValue('font_size_base', config.font_size_base);
                setValue('border_radius', config.border_radius);
                setValue('custom_css', config.custom_css || '');
            }
        } catch (error) {
            toast({
                title: "Error fetching branding",
                description: "Could not load current configuration.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: BrandingFormValues) => {
        try {
            setSaving(true);
            await BrandingService.updateBranding(data);
            await refreshBranding();
            toast({
                title: "Settings saved",
                description: "Branding configuration has been updated successfully. Please refresh 'Branding' pages to fully apply changes globally.",
            });
        } catch (error) {
            toast({
                title: "Error saving settings",
                description: "Failed to update branding configuration.",
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        if (!confirm("Are you sure you want to reset all branding settings to default?")) return;

        try {
            setSaving(true);
            const defaults = await BrandingService.resetBranding();
            setValue('company_name', defaults.company_name);
            setValue('primary_color', defaults.primary_color);
            setValue('secondary_color', defaults.secondary_color);
            setValue('accent_color', defaults.accent_color);
            setValue('logo_url', defaults.logo_url || '');
            setValue('favicon_url', defaults.favicon_url || '');
            setValue('font_family', defaults.font_family);
            setValue('border_radius', defaults.border_radius);

            await refreshBranding();
            toast({
                title: "Reset successful",
                description: "Branding settings have been reset to defaults.",
            });
        } catch (error) {
            toast({ title: "Error", description: "Failed to reset.", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Branding & Customization</h2>
                    <p className="text-muted-foreground">Manage your organization's visual identity.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleReset} disabled={saving}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Reset to Defaults
                    </Button>
                    <Button onClick={handleSubmit(onSubmit)} disabled={saving || !isDirty}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>General Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="company_name">Company Name</Label>
                                <Input id="company_name" {...register('company_name')} />
                                {errors.company_name && <p className="text-sm text-red-500">{errors.company_name.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="logo_url">Logo URL</Label>
                                <Input id="logo_url" placeholder="https://..." {...register('logo_url')} />
                                <p className="text-xs text-muted-foreground">URL to your company logo (PNG/SVG recommended).</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="favicon_url">Favicon URL</Label>
                                <Input id="favicon_url" placeholder="https://..." {...register('favicon_url')} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Color Palette</CardTitle>
                            <CardDescription>Select your brand colors.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="primary_color">Primary Color</Label>
                                    <div className="flex gap-2">
                                        <div className="h-10 w-10 rounded-md border shadow-sm overflow-hidden">
                                            <input type="color" className="h-full w-full p-0 cursor-pointer border-0" {...register('primary_color')} />
                                        </div>
                                        <Input {...register('primary_color')} className="font-mono uppercase" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="secondary_color">Secondary Color</Label>
                                    <div className="flex gap-2">
                                        <div className="h-10 w-10 rounded-md border shadow-sm overflow-hidden">
                                            <input type="color" className="h-full w-full p-0 cursor-pointer border-0" {...register('secondary_color')} />
                                        </div>
                                        <Input {...register('secondary_color')} className="font-mono uppercase" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="accent_color">Accent Color</Label>
                                    <div className="flex gap-2">
                                        <div className="h-10 w-10 rounded-md border shadow-sm overflow-hidden">
                                            <input type="color" className="h-full w-full p-0 cursor-pointer border-0" {...register('accent_color')} />
                                        </div>
                                        <Input {...register('accent_color')} className="font-mono uppercase" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Typography & Shape</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Font Family</Label>
                                <Select {...register('font_family')}>
                                    <option value="Inter">Inter</option>
                                    <option value="Arial">Arial</option>
                                    <option value="Helvetica">Helvetica</option>
                                    <option value="Times New Roman">Times New Roman</option>
                                    <option value="Courier New">Courier New</option>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Border Radius</Label>
                                <Select {...register('border_radius')}>
                                    <option value="0rem">0 (Square)</option>
                                    <option value="0.3rem">Small (0.3rem)</option>
                                    <option value="0.5rem">Medium (0.5rem)</option>
                                    <option value="0.75rem">Large (0.75rem)</option>
                                    <option value="1.0rem">Extra Large (1rem)</option>
                                    <option value="9999px">Full (Rounded)</option>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <BrandingPreview config={watchedValues} />

                    <Card>
                        <CardHeader>
                            <CardTitle>Custom CSS</CardTitle>
                            <CardDescription>Advanced: Inject custom CSS into the application.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                className="font-mono text-xs h-32"
                                placeholder=".custom-header { background: red; }"
                                {...register('custom_css')}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
