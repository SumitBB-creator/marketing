"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFile = exports.uploadFile = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const database_1 = require("../config/database");
// Configure Multer Storage (Memory for DB storage handling)
const storage = multer_1.default.memoryStorage();
exports.upload = (0, multer_1.default)({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        // Allowed file types
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
        const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        else {
            cb(new Error('Only images and documents are allowed!'));
        }
    }
});
const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path_1.default.extname(req.file.originalname)}`;
        // Save to Database
        await database_1.prisma.fileStorage.create({
            data: {
                data: req.file.buffer, // Cast to any to satisfy Prisma Bytes type
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
    }
    catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ message: error.message });
    }
};
exports.uploadFile = uploadFile;
const getFile = async (req, res) => {
    try {
        const { filename } = req.params;
        const fileRecord = await database_1.prisma.fileStorage.findUnique({
            where: { filename: filename }
        });
        if (!fileRecord) {
            return res.status(404).json({ message: 'File not found' });
        }
        res.setHeader('Content-Type', fileRecord.mimeType);
        res.setHeader('Content-Length', fileRecord.size);
        res.send(fileRecord.data);
    }
    catch (error) {
        console.error("File retrieval error:", error);
        res.status(500).json({ message: error.message });
    }
};
exports.getFile = getFile;
