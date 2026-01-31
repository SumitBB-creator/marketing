import { Request, Response } from 'express';
import { z } from 'zod';
import { brandingService } from '../services/branding.service';

// Zod schema for updating branding
const updateBrandingSchema = z.object({
    primary_color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid Hex Color").optional(),
    secondary_color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid Hex Color").optional(),
    accent_color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid Hex Color").optional(),
    sidebar_color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid Hex Color").optional(),
    background_color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid Hex Color").optional(),
    card_background_color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid Hex Color").optional(),
    text_color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid Hex Color").optional(),
    heading_color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid Hex Color").optional(),
    company_name: z.string().min(1).optional(),
    logo_url: z.string().url().optional().or(z.literal("")),
    favicon_url: z.string().url().optional().or(z.literal("")),
    font_family: z.string().optional(),
    font_size_base: z.string().optional(),
    border_radius: z.string().optional(),
    custom_css: z.string().optional().or(z.literal("")),
});

export class BrandingController {

    /**
     * Get branding configuration
     */
    async getBranding(req: Request, res: Response) {
        try {
            const config = await brandingService.getBrandingConfig();
            // If no config found, return null or a default structure
            // Service handles "first" logic, but if completely empty DB, might return null.
            // Ideally service creates one or returns defaults if null, but let's handle it here safely.
            if (!config) {
                // Return defaults if nothing saved yet
                return res.json({
                    primary_color: "#3B82F6",
                    secondary_color: "#10B981",
                    accent_color: "#F59E0B",
                    company_name: "LeadTrack Pro",
                    // ... other defaults
                });
            }
            res.json(config);
        } catch (error) {
            console.error("Error fetching branding:", error);
            res.status(500).json({ error: "Failed to fetch branding configuration" });
        }
    }

    /**
     * Update branding configuration
     */
    async updateBranding(req: Request, res: Response) {
        try {
            // Validate body
            const validation = updateBrandingSchema.safeParse(req.body);

            if (!validation.success) {
                return res.status(400).json({
                    error: "Validation failed",
                    details: (validation as any).error.errors
                });
            }

            // @ts-ignore - req.user is populated by auth middleware
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const updatedConfig = await brandingService.updateBrandingConfig(validation.data, userId);
            res.json(updatedConfig);
        } catch (error) {
            console.error("Error updating branding:", error);
            res.status(500).json({ error: "Failed to update branding configuration" });
        }
    }

    /**
     * Reset branding to defaults
     */
    async resetBranding(req: Request, res: Response) {
        try {
            // @ts-ignore
            const userId = req.user?.id;
            if (!userId) return res.status(401).json({ error: "Unauthorized" });

            const resetConfig = await brandingService.resetBrandingConfig(userId);
            res.json(resetConfig);
        } catch (error) {
            console.error("Error resetting branding:", error);
            res.status(500).json({ error: "Failed to reset branding" });
        }
    }
}

export const brandingController = new BrandingController();
