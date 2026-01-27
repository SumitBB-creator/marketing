import React, { createContext, useContext, useEffect, useState } from 'react';
import { BrandingService } from '@/services/branding';
import { BrandingConfig } from '@/types';
import { hexToHsl } from '@/lib/utils';

interface BrandingContextType {
    config: BrandingConfig | null;
    refreshBranding: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType>({
    config: null,
    refreshBranding: async () => { },
});

export const useBranding = () => useContext(BrandingContext);

export function BrandingProvider({ children }: { children: React.ReactNode }) {
    const [config, setConfig] = useState<BrandingConfig | null>(null);

    const refreshBranding = async () => {
        try {
            const data = await BrandingService.getBranding();
            setConfig(data);
            applyBranding(data);
        } catch (error) {
            console.error("Failed to load branding", error);
        }
    };

    useEffect(() => {
        refreshBranding();
    }, []);

    const applyBranding = (data: BrandingConfig) => {
        const root = document.documentElement;

        if (data.primary_color) root.style.setProperty('--primary', hexToHsl(data.primary_color));
        if (data.secondary_color) root.style.setProperty('--secondary', hexToHsl(data.secondary_color));
        if (data.accent_color) root.style.setProperty('--accent', hexToHsl(data.accent_color));

        if (data.border_radius) root.style.setProperty('--radius', data.border_radius);

        // Font family handling might require loading fonts or just setting the stack if it's a web safe font
        // For simplicity, we just set the variable if the system uses it, or body style.
        // Tailwind default theme uses --font-sans usually if configured, or we can force it.
        // If we want to support Google Fonts, we'd need to dynamically inject a <link> tag.
        // For MVP, we assume standard fonts or handled elsewhere. But we can set the css var.
        if (data.font_family) {
            root.style.setProperty('--font-sans', data.font_family);
            document.body.style.fontFamily = data.font_family;
        }

        if (data.custom_css) {
            // Remove old custom css
            const oldStyle = document.getElementById('custom-branding-css');
            if (oldStyle) oldStyle.remove();

            const style = document.createElement('style');
            style.id = 'custom-branding-css';
            style.innerHTML = data.custom_css;
            document.head.appendChild(style);
        }
    };

    return (
        <BrandingContext.Provider value={{ config, refreshBranding }}>
            {children}
        </BrandingContext.Provider>
    );
}
