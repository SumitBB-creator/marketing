"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNote = exports.updateNote = exports.createNote = exports.getNotes = void 0;
const database_1 = __importDefault(require("../config/database"));
const getNotes = async (req, res) => {
    try {
        // @ts-ignore
        const userId = req.user.id;
        const notes = await database_1.default.stickyNote.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' }
        });
        res.json(notes);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getNotes = getNotes;
const createNote = async (req, res) => {
    try {
        // @ts-ignore
        const userId = req.user.id;
        const { content, color, position_x, position_y } = req.body;
        const note = await database_1.default.stickyNote.create({
            data: {
                user_id: userId,
                content: content || 'New Note',
                color: color || 'yellow',
                position_x: position_x || 0,
                position_y: position_y || 0
            }
        });
        res.status(201).json(note);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.createNote = createNote;
const updateNote = async (req, res) => {
    try {
        const id = req.params.id;
        // @ts-ignore
        const userId = req.user.id;
        const { content, color, position_x, position_y } = req.body;
        // Ensure user owns note
        const existing = await database_1.default.stickyNote.findFirst({
            where: { id, user_id: userId }
        });
        if (!existing) {
            return res.status(404).json({ message: 'Note not found' });
        }
        const note = await database_1.default.stickyNote.update({
            where: { id },
            data: {
                content,
                color,
                position_x,
                position_y
            }
        });
        res.json(note);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.updateNote = updateNote;
const deleteNote = async (req, res) => {
    try {
        const id = req.params.id;
        // @ts-ignore
        const userId = req.user.id;
        const result = await database_1.default.stickyNote.deleteMany({
            where: { id, user_id: userId }
        });
        if (result.count === 0) {
            return res.status(404).json({ message: 'Note not found' });
        }
        res.json({ message: 'Note deleted' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.deleteNote = deleteNote;
