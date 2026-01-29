import React, { createContext, useContext, useEffect, useState } from 'react';
import { BrandingService } from '@/services/branding';
import { BrandingConfig } from '@/types';
import { hexToHsl } from '@/lib/utils';
import { useTheme } from './theme-provider';

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
    const { theme } = useTheme();

    const refreshBranding = async () => {
        try {
            const data = await BrandingService.getBranding();
            setConfig(data);
        } catch (error) {
            console.error("Failed to load branding", error);
        }
    };

    useEffect(() => {
        refreshBranding();
    }, []);

    // Apply branding whenever config or theme changes
    useEffect(() => {
        if (config) {
            applyBranding(config);
        }
    }, [config, theme]);

    const applyBranding = (data: BrandingConfig) => {
        const root = document.documentElement;

        if (data.primary_color) root.style.setProperty('--primary', hexToHsl(data.primary_color));
        if (data.secondary_color) root.style.setProperty('--secondary', hexToHsl(data.secondary_color));
        if (data.accent_color) root.style.setProperty('--accent', hexToHsl(data.accent_color));

        // Background & Text Logic
        let bgColor = '#ffffff';
        let sidebarColor = '#ffffff';
        let textColor = '222.2 84% 4.9%'; // Default Light Foreground (HSL)
        let headingColor = '222.2 84% 4.9%'; // Default Light Heading (HSL)

        // Check if system is dark
        const systemIsDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

        if (theme === 'dark') {
            // Forced Dark - Colors handled by .dark class mostly, but we set base vars for safety if needed
            bgColor = '#020817';
            sidebarColor = '#0f172a';
            // We do NOT override text colors here, relying on .dark class in CSS
        } else if (theme === 'light') {
            // Forced Light - White BG, Standard Text
            bgColor = '#ffffff';
            sidebarColor = '#ffffff';
        } else if (theme === 'custom') {
            // Forced Custom
            // Use Custom Color explicitly
            bgColor = data.background_color || '#ffffff';
            sidebarColor = bgColor;

            // Convert Custom Text Colors to HSL
            if (data.text_color) textColor = hexToHsl(data.text_color);
            if (data.heading_color) headingColor = hexToHsl(data.heading_color);
        } else if (theme === 'system') {
            if (systemIsDark) {
                // System Dark
                bgColor = '#020817';
                sidebarColor = '#0f172a';
            } else {
                // System Light -> Use Custom Background
                bgColor = data.background_color || '#ffffff';
                sidebarColor = bgColor;

                // Use Custom Text in System Light too
                if (data.text_color) textColor = hexToHsl(data.text_color);
                if (data.heading_color) headingColor = hexToHsl(data.heading_color);
            }
        }

        root.style.setProperty('--app-bg', bgColor);
        root.style.setProperty('--app-sidebar', sidebarColor);

        // Only set text colors if NOT in forced Dark Mode
        // If Custom or Light (System), set them.
        // If Dark (System or Forced), REMOVE them to let CSS handle it.
        const shouldSetText = (theme === 'custom' || theme === 'light' || (theme === 'system' && !systemIsDark));

        if (shouldSetText) {
            root.style.setProperty('--app-foreground', textColor);
            root.style.setProperty('--app-heading-foreground', headingColor);
        } else {
            root.style.removeProperty('--app-foreground');
            root.style.removeProperty('--app-heading-foreground');
        }

        if (data.border_radius) root.style.setProperty('--radius', data.border_radius);

        if (data.font_family) {
            root.style.setProperty('--font-sans', data.font_family);
            document.body.style.fontFamily = data.font_family;
        }

        if (data.custom_css) {
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
