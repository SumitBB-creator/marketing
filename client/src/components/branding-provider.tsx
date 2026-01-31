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

        // Check if system is dark
        const systemIsDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

        // Logic: Apply Custom Branding ONLY if theme is 'custom' OR 'system' (and system is Light).
        // Explicit 'light' and 'dark' should use their Shadcn defaults (Standard).
        // System Dark should use Shadcn Dark defaults.
        const shouldApplyCustomColors = (theme === 'custom' || (theme === 'system' && !systemIsDark));

        if (shouldApplyCustomColors && data.primary_color) root.style.setProperty('--primary', hexToHsl(data.primary_color));
        else root.style.removeProperty('--primary');

        if (shouldApplyCustomColors && data.secondary_color) root.style.setProperty('--secondary', hexToHsl(data.secondary_color));
        else root.style.removeProperty('--secondary');

        if (shouldApplyCustomColors && data.accent_color) root.style.setProperty('--accent', hexToHsl(data.accent_color));
        else root.style.removeProperty('--accent');

        // Background & Text Logic
        let bgColor = '#ffffff';
        let sidebarColor = '#ffffff';
        let cardColor = '#ffffff';
        let textColor = '222.2 84% 4.9%'; // Default Light Foreground (HSL)
        let headingColor = '222.2 84% 4.9%'; // Default Light Heading (HSL)

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
            cardColor = data.card_background_color || '#ffffff';

            // Convert Custom Text Colors to HSL
            if (data.text_color) textColor = hexToHsl(data.text_color);
            if (data.heading_color) headingColor = hexToHsl(data.heading_color);
        } else if (theme === 'system') {
            if (systemIsDark) {
                // System Dark
                bgColor = '#020817';
                sidebarColor = '#0f172a';
                cardColor = '#020817';
            } else {
                // System Light -> Use Custom Background
                bgColor = data.background_color || '#ffffff';
                sidebarColor = bgColor;
                cardColor = data.card_background_color || '#ffffff';

                // Use Custom Text in System Light too
                if (data.text_color) textColor = hexToHsl(data.text_color);
                if (data.heading_color) headingColor = hexToHsl(data.heading_color);
            }
        }

        root.style.setProperty('--app-bg', bgColor);
        root.style.setProperty('--app-sidebar', sidebarColor);

        // Tailwind/Shadcn expects HSL variables for 'background' and 'sidebar' (if used as class)
        // Since we are overriding, we must convert our Hex/Color to HSL
        // Note: hexToHsl returns "H S L" (space separated)
        if (bgColor.startsWith('#')) {
            root.style.setProperty('--background', hexToHsl(bgColor));
        } else {
            root.style.setProperty('--background', hexToHsl(bgColor));
        }

        if (sidebarColor.startsWith('#')) {
            root.style.setProperty('--sidebar', hexToHsl(sidebarColor));
        }

        // Apply Card Background Logic
        if (cardColor && (theme === 'custom' || (theme === 'system' && !systemIsDark))) {
            const cardHsl = hexToHsl(cardColor.startsWith('#') ? cardColor : '#ffffff');
            root.style.setProperty('--card', cardHsl);
            root.style.setProperty('--popover', cardHsl);
        } else {
            root.style.removeProperty('--card');
            root.style.removeProperty('--popover');
        }

        // Only set text colors if NOT in forced Dark Mode
        // If Custom or Light (System), set them.
        // If Dark (System or Forced), REMOVE them to let CSS handle it.
        const shouldSetText = (theme === 'custom' || (theme === 'system' && !systemIsDark));

        if (shouldSetText) {
            root.style.setProperty('--foreground', textColor); // Update standard Shadcn var
            root.style.setProperty('--app-foreground', textColor);
            root.style.setProperty('--app-heading-foreground', headingColor);

            // Fix: Override muted-foreground to match custom text color (with opacity)
            // This ensures subheaders/descriptions are visible on custom backgrounds
            root.style.setProperty('--muted-foreground', `${textColor} / 0.7`);
        } else {
            // In dark mode, revert to defaults (let index.css handle it via .dark class)
            // But we are setting property on :root element which overrides .dark class!
            // So we must REMOVE the inline style to let class take over.
            root.style.removeProperty('--foreground');
            root.style.removeProperty('--app-foreground');
            root.style.removeProperty('--app-heading-foreground');
            root.style.removeProperty('--muted-foreground');
            // Also revert background if we are in dark mode (unless Custom theme allowed in dark?)
            // Logic: "Forced Dark" -> bgColor = '#020817'. hexToHsl('#020817') -> applied.
            // This works because we explicitly set dark colors in the logic above.
            // So we don't need to remove background property, just ensure the value is correct.
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
