"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.brandingController = exports.BrandingController = void 0;
const zod_1 = require("zod");
const branding_service_1 = require("../services/branding.service");
// Zod schema for updating branding
const updateBrandingSchema = zod_1.z.object({
    primary_color: zod_1.z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid Hex Color").optional(),
    secondary_color: zod_1.z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid Hex Color").optional(),
    accent_color: zod_1.z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid Hex Color").optional(),
    sidebar_color: zod_1.z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid Hex Color").optional(),
    background_color: zod_1.z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid Hex Color").optional(),
    text_color: zod_1.z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid Hex Color").optional(),
    heading_color: zod_1.z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid Hex Color").optional(),
    company_name: zod_1.z.string().min(1).optional(),
    logo_url: zod_1.z.string().url().optional().or(zod_1.z.literal("")),
    favicon_url: zod_1.z.string().url().optional().or(zod_1.z.literal("")),
    font_family: zod_1.z.string().optional(),
    font_size_base: zod_1.z.string().optional(),
    border_radius: zod_1.z.string().optional(),
    custom_css: zod_1.z.string().optional().or(zod_1.z.literal("")),
});
class BrandingController {
    /**
     * Get branding configuration
     */
    async getBranding(req, res) {
        try {
            const config = await branding_service_1.brandingService.getBrandingConfig();
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
        }
        catch (error) {
            console.error("Error fetching branding:", error);
            res.status(500).json({ error: "Failed to fetch branding configuration" });
        }
    }
    /**
     * Update branding configuration
     */
    async updateBranding(req, res) {
        try {
            // Validate body
            const validation = updateBrandingSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    error: "Validation failed",
                    details: validation.error.errors
                });
            }
            // @ts-ignore - req.user is populated by auth middleware
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }
            const updatedConfig = await branding_service_1.brandingService.updateBrandingConfig(validation.data, userId);
            res.json(updatedConfig);
        }
        catch (error) {
            console.error("Error updating branding:", error);
            res.status(500).json({ error: "Failed to update branding configuration" });
        }
    }
    /**
     * Reset branding to defaults
     */
    async resetBranding(req, res) {
        try {
            // @ts-ignore
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Unauthorized" });
            const resetConfig = await branding_service_1.brandingService.resetBrandingConfig(userId);
            res.json(resetConfig);
        }
        catch (error) {
            console.error("Error resetting branding:", error);
            res.status(500).json({ error: "Failed to reset branding" });
        }
    }
}
exports.BrandingController = BrandingController;
exports.brandingController = new BrandingController();
