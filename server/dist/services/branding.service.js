"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.brandingService = exports.BrandingService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class BrandingService {
    /**
     * Get the current branding configuration.
     * If none exists, return a default configuration object (or create one).
     */
    async getBrandingConfig() {
        // There should theoretically be only one active config, or we take the latest.
        // For this system, we can assume a singleton config row, or always fetch the most recent one.
        // Let's fetch the most recently updated one.
        const config = await prisma.brandingConfig.findFirst({
            orderBy: {
                updated_at: 'desc'
            },
            include: {
                updater: {
                    select: {
                        full_name: true,
                        email: true
                    }
                }
            }
        });
        return config;
    }
    /**
     * Update or Create branding configuration.
     * @param data Partial branding config data
     * @param userId ID of the user performing the update
     */
    async updateBrandingConfig(data, userId) {
        // Check if a config already exists
        const existingConfig = await prisma.brandingConfig.findFirst({
            orderBy: {
                updated_at: 'desc'
            }
        });
        if (existingConfig) {
            // Update existing
            return await prisma.brandingConfig.update({
                where: { id: existingConfig.id },
                data: {
                    ...data,
                    updated_by: userId
                }
            });
        }
        else {
            // Create new
            return await prisma.brandingConfig.create({
                data: {
                    ...data,
                    updated_by: userId
                }
            });
        }
    }
    /**
     * Reset branding to defaults
     */
    async resetBrandingConfig(userId) {
        // We can either delete the row or update it to defaults.
        // updating to defaults allows keeping the 'updated_by' trail.
        const defaults = {
            primary_color: "#3B82F6",
            secondary_color: "#10B981",
            accent_color: "#F59E0B",
            logo_url: null,
            favicon_url: null,
            company_name: "LeadTrack Pro",
            font_family: "Inter",
            font_size_base: "14px",
            border_radius: "8px",
            custom_css: null,
        };
        return await this.updateBrandingConfig(defaults, userId);
    }
}
exports.BrandingService = BrandingService;
exports.brandingService = new BrandingService();
