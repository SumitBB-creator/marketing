import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BrandingConfig } from '@/types';
import { hexToHsl } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BrandingPreviewProps {
    config: Partial<BrandingConfig>;
}

export function BrandingPreview({ config }: BrandingPreviewProps) {
    const [previewStyles, setPreviewStyles] = useState<React.CSSProperties>({});

    useEffect(() => {
        const styles: any = {};
        if (config.primary_color) styles['--primary'] = hexToHsl(config.primary_color);
        if (config.secondary_color) styles['--secondary'] = hexToHsl(config.secondary_color);
        if (config.accent_color) styles['--accent'] = hexToHsl(config.accent_color); // Note: Shadcn usually maps accent to accent-foreground too
        // For simplicity, we assume generic mappings. Shadcn `accent` is usually for hover states of list items, `destructive`, `muted`, etc.
        // If we want to change the MAIN look, checking 'primary'.

        if (config.border_radius) styles['--radius'] = config.border_radius;

        setPreviewStyles(styles);
    }, [config]);

    // We need to apply these variables to a container correctly.
    // Tailwind classes use these variables.
    // We wrap the preview using a ref and properties.

    return (
        <Card className="w-full border-2 border-dashed">
            <CardHeader>
                <CardTitle>Live Preview</CardTitle>
                <CardDescription>See how your changes affect the UI components.</CardDescription>
            </CardHeader>
            <CardContent>
                <div
                    className="p-6 rounded-lg border bg-background text-foreground space-y-8"
                    style={previewStyles}
                >
                    {/* The variables set in 'style' will override global ones for this div and children if they use valid css variables */}

                    <div className="grid gap-4">
                        <h3 className="text-lg font-semibold">Typography & Colors</h3>
                        <div className="flex gap-4 items-center flex-wrap">
                            <Button>Primary Button</Button>
                            <Button variant="secondary">Secondary Button</Button>
                            <Button variant="outline">Outline Button</Button>
                            <Button variant="ghost">Ghost Button</Button>
                            <Button variant="destructive">Destructive</Button>
                        </div>

                        <div className="flex gap-2">
                            <Badge>Primary Badge</Badge>
                            <Badge variant="secondary">Secondary Badge</Badge>
                            <Badge variant="outline">Outline Badge</Badge>
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Card Component</CardTitle>
                            <CardDescription>This is how cards will appear.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Input Label</Label>
                                <Input placeholder="Type something..." />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full">Submit Action</Button>
                        </CardFooter>
                    </Card>

                    {config.logo_url && (
                        <div className="mt-4">
                            <p className="text-sm text-muted-foreground mb-2">Logo Preview:</p>
                            <img src={config.logo_url} alt="Logo" className="h-12 object-contain" />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
