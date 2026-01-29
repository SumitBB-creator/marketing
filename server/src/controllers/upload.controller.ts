import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { prisma } from '../config/database';

// Configure Multer Storage (Memory for DB storage handling)
const storage = multer.memoryStorage();

export const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        // Allowed file types
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only images and documents are allowed!'));
        }
    }
});

export const uploadFile = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(req.file.originalname)}`;

        // Save to Database
        await prisma.fileStorage.create({
            data: {
                filename: filename,
                mimeType: req.file.mimetype,
                data: req.file.buffer as any, // Cast to any to satisfy Prisma Bytes type
                size: req.file.size
            }
        });

        // Return the accessible URL
        const protocol = req.protocol;
        const host = req.get('host');
        // If Vercel, host might need https
        const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
        const fileUrl = `${isSecure ? 'https' : 'http'}://${host}/api/upload/${filename}`;

        res.json({
            url: fileUrl,
            filename: filename,
            originalName: req.file.originalname
        });
    } catch (error: any) {
        console.error("Upload error:", error);
        res.status(500).json({ message: error.message });
    }
};

export const getFile = async (req: Request, res: Response) => {
    try {
        const { filename } = req.params;

        const fileRecord = await prisma.fileStorage.findUnique({
            where: { filename: filename as string }
        });

        if (!fileRecord) {
            return res.status(404).json({ message: 'File not found' });
        }

        res.setHeader('Content-Type', fileRecord.mimeType);
        res.setHeader('Content-Length', fileRecord.size);
        res.send(fileRecord.data);
    } catch (error: any) {
        console.error("File retrieval error:", error);
        res.status(500).json({ message: error.message });
    }
};
