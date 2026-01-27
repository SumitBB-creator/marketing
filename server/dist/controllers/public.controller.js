"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicLead = void 0;
const database_1 = __importDefault(require("../config/database"));
const getPublicLead = async (req, res) => {
    try {
        const { token } = req.params;
        const sharedLink = await database_1.default.sharedLink.findUnique({
            where: { token: token },
            include: {
                lead: {
                    include: {
                        platform: {
                            select: { name: true, fields: true }
                        },
                        marketer: {
                            select: { full_name: true }
                        },
                        activities: {
                            orderBy: { created_at: 'desc' },
                            include: {
                                marketer: {
                                    select: { full_name: true }
                                }
                            }
                        }
                    }
                }
            }
        });
        if (!sharedLink) {
            return res.status(404).json({ message: 'Invalid or expired link' });
        }
        if (sharedLink.expires_at && new Date() > sharedLink.expires_at) {
            return res.status(410).json({ message: 'Link expired' });
        }
        // Return limited data for public view
        const lead = sharedLink.lead;
        res.json({
            id: lead.id,
            lead_data: lead.lead_data,
            current_status: lead.current_status,
            created_at: lead.created_at,
            platform_name: lead.platform.name,
            fields: lead.platform.fields,
            marketer_name: lead.marketer.full_name,
            activities: lead.activities // Type assertion needed until generation update
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getPublicLead = getPublicLead;
