"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importLeads = exports.downloadTemplate = void 0;
const platform_service_1 = require("../services/platform.service");
const lead_service_1 = require("../services/lead.service");
const XLSX = __importStar(require("xlsx"));
const fs_1 = __importDefault(require("fs"));
const downloadTemplate = async (req, res) => {
    try {
        const platformId = req.params.platformId;
        const platform = await platform_service_1.platformService.getPlatformById(platformId);
        if (!platform) {
            return res.status(404).json({ message: 'Platform not found' });
        }
        // 1. Define Headers from Platform Configuration ONLY
        // We do NOT add hardcoded system fields like Phone/Address anymore.
        // It relies entirely on what admin configured.
        const headers = platform.fields
            ? platform.fields.map((f) => f.field_name)
            : [];
        if (headers.length === 0) {
            // Fallback if no fields configured??
            // Maybe at least "Name"? But user said ONLY configured.
            // Let's assume there's at least one. If not, empty template is correct per request?
            // Or maybe just "Name" as absolute minimum identifier if schema requires it?
            // Schema LeadData is json.
            // Let's stick to strict configuration.
        }
        // 2. Create Workbook
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([headers]);
        // Add example row based on types
        if (headers.length > 0) {
            const exampleRow = platform.fields.map((f) => {
                switch (f.field_type) {
                    case 'number': return 12345;
                    case 'email': return 'example@mail.com';
                    case 'date': return '2023-01-01';
                    case 'datetime': return '2023-01-01 10:00';
                    default: return `Test ${f.field_name}`;
                }
            });
            XLSX.utils.sheet_add_aoa(ws, [exampleRow], { origin: -1 });
        }
        XLSX.utils.book_append_sheet(wb, ws, 'Template');
        // 3. Buffer
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Disposition', `attachment; filename="${platform.name}_Template.xlsx"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.downloadTemplate = downloadTemplate;
const importLeads = async (req, res) => {
    try {
        const platformId = req.params.platformId;
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        // @ts-ignore
        const userId = req.user.id; // Marketer or Admin who is importing
        // 1. Read File
        const workbook = XLSX.readFile(req.file.path, { cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet);
        // 2. Process Rows
        let importedCount = 0;
        let failedCount = 0;
        const errors = [];
        // Get Platform to validate fields if needed
        const platform = await platform_service_1.platformService.getPlatformById(platformId);
        if (!platform)
            return res.status(404).json({ message: 'Platform not found' });
        for (const [index, row] of rows.entries()) {
            try {
                // Map row data to our Lead structure
                // Assume row keys match headers exactly
                // Extract System Fields if they are in the row
                // We fallback to checking variants like "Full Name", "name", etc.
                // But for now, let's assume valid mapping from template
                const leadData = {};
                // Copy all row data first
                Object.assign(leadData, row);
                // Create Lead
                await lead_service_1.leadService.createLead({
                    platform_id: platformId,
                    lead_data: leadData,
                    current_status: 'New', // Default status
                    // If assignToPool is true, marketer_id is undefined (common pool)
                    // If not, assign to uploader
                    marketer_id: req.body.assignToPool === 'true' ? undefined : userId
                });
                importedCount++;
            }
            catch (err) {
                failedCount++;
                errors.push({ row: index + 2, error: err.message }); // +2 for header and 0-index
            }
        }
        // Cleanup file
        fs_1.default.unlinkSync(req.file.path);
        res.json({
            message: 'Import processed',
            imported: importedCount,
            failed: failedCount,
            errors: errors.length > 0 ? errors : undefined
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.importLeads = importLeads;
