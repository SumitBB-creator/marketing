import { Request, Response } from 'express';
import { platformService } from '../services/platform.service';
import { leadService } from '../services/lead.service';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

export const downloadTemplate = async (req: Request, res: Response) => {
    try {
        const platformId = req.params.platformId as string;
        const platform = await platformService.getPlatformById(platformId);

        if (!platform) {
            return res.status(404).json({ message: 'Platform not found' });
        }

        // 1. Define Headers from Platform Configuration ONLY
        // We do NOT add hardcoded system fields like Phone/Address anymore.
        // It relies entirely on what admin configured.

        const headers = platform.fields
            ? (platform.fields as any[]).map((f: any) => f.field_name)
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
            const exampleRow = (platform.fields as any[]).map((f: any) => {
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

    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const importLeads = async (req: Request, res: Response) => {
    try {
        const platformId = req.params.platformId as string;
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // @ts-ignore
        const userId = req.user.id; // Marketer or Admin who is importing

        // 1. Read File
        const workbook = XLSX.readFile(req.file.path, { cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet);

        // 2. Process Rows
        let importedCount = 0;
        let failedCount = 0;
        const errors: any[] = [];

        // Get Platform to validate fields if needed
        const platform = await platformService.getPlatformById(platformId);
        if (!platform) return res.status(404).json({ message: 'Platform not found' });

        for (const [index, row] of rows.entries()) {
            try {
                // Map row data to our Lead structure
                // Assume row keys match headers exactly

                // Extract System Fields if they are in the row
                // We fallback to checking variants like "Full Name", "name", etc.
                // But for now, let's assume valid mapping from template

                const leadData: any = {};

                // Copy all row data first
                Object.assign(leadData, row);

                // Create Lead
                await leadService.createLead({
                    platform_id: platformId,
                    lead_data: leadData,
                    current_status: 'New', // Default status
                    // If assignToPool is true, marketer_id is undefined (common pool)
                    // If not, assign to uploader
                    marketer_id: req.body.assignToPool === 'true' ? undefined : userId
                });
                importedCount++;
            } catch (err: any) {
                failedCount++;
                errors.push({ row: index + 2, error: err.message }); // +2 for header and 0-index
            }
        }

        // Cleanup file
        fs.unlinkSync(req.file.path);

        res.json({
            message: 'Import processed',
            imported: importedCount,
            failed: failedCount,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
