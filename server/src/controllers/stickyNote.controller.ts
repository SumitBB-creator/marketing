import { Request, Response } from 'express';
import prisma from '../config/database';

export const getNotes = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.id;
        const notes = await prisma.stickyNote.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' }
        });
        res.json(notes);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createNote = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.id;
        const { content, color, position_x, position_y } = req.body;

        const note = await prisma.stickyNote.create({
            data: {
                user_id: userId,
                content: content || 'New Note',
                color: color || 'yellow',
                position_x: position_x || 0,
                position_y: position_y || 0
            }
        });
        res.status(201).json(note);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const updateNote = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        // @ts-ignore
        const userId = req.user.id;
        const { content, color, position_x, position_y } = req.body;

        // Ensure user owns note
        const existing = await prisma.stickyNote.findFirst({
            where: { id, user_id: userId }
        });

        if (!existing) {
            return res.status(404).json({ message: 'Note not found' });
        }

        const note = await prisma.stickyNote.update({
            where: { id },
            data: {
                content,
                color,
                position_x,
                position_y
            }
        });
        res.json(note);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteNote = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        // @ts-ignore
        const userId = req.user.id;

        const result = await prisma.stickyNote.deleteMany({
            where: { id, user_id: userId }
        });

        if (result.count === 0) {
            return res.status(404).json({ message: 'Note not found' });
        }

        res.json({ message: 'Note deleted' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
