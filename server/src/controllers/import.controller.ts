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

        // 1. Define Headers
        // System fields usually handled automatically or optional?
        // Let's include basic contact info + dynamic fields
        const systemHeaders = ['Name', 'Phone', 'Email', 'Address'];

        const dynamicHeaders = platform.fields
            ? (platform.fields as any[])
                .filter((f: any) => !['Name', 'Full Name'].includes(f.field_name)) // Avoid dupes if user created them
                .map((f: any) => f.field_name)
            : [];

        const headers = [...systemHeaders, ...dynamicHeaders];

        // 2. Create Workbook
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([headers]);

        // Add some instruction or example row?
        const exampleRow = headers.map(h => (h === 'Phone' ? '1234567890' : h === 'Email' ? 'example@mail.com' : `Test ${h}`));
        XLSX.utils.sheet_add_aoa(ws, [exampleRow], { origin: -1 });

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
        const workbook = XLSX.readFile(req.file.path);
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
                    marketer_id: userId // Assign to uploader (if marketer) - logic might need check logic if Admin import
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
