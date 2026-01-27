import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import api from '@/lib/axios';

interface StickyNote {
    id: string;
    content: string;
    color: string;
    position_x: number;
    position_y: number;
}

const COLORS = [
    { name: 'Yellow', value: 'bg-yellow-200 dark:bg-yellow-900/50 border-yellow-300' },
    { name: 'Blue', value: 'bg-blue-200 dark:bg-blue-900/50 border-blue-300' },
    { name: 'Green', value: 'bg-green-200 dark:bg-green-900/50 border-green-300' },
    { name: 'Pink', value: 'bg-pink-200 dark:bg-pink-900/50 border-pink-300' },
    { name: 'Purple', value: 'bg-purple-200 dark:bg-purple-900/50 border-purple-300' },
];

export default function StickyNoteBoard() {
    const [notes, setNotes] = useState<StickyNote[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotes = async () => {
        try {
            const res = await api.get('/notes');
            setNotes(res.data);
        } catch (error) {
            console.error("Failed to fetch notes", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotes();
    }, []);

    const addNote = async () => {
        try {
            const res = await api.post('/notes', {
                content: '',
                color: 'bg-yellow-200 dark:bg-yellow-900/50 border-yellow-300', // Default Value
                position_x: 0,
                position_y: 0
            });
            setNotes([res.data, ...notes]);
        } catch (error) {
            console.error("Failed to create note", error);
        }
    };

    const updateNote = async (id: string, updates: Partial<StickyNote>) => {
        // Optimistic update
        setNotes(notes.map(n => n.id === id ? { ...n, ...updates } : n));
        try {
            await api.put(`/notes/${id}`, updates);
        } catch (error) {
            console.error("Failed to update note", error);
            fetchNotes(); // Revert on error
        }
    };

    const deleteNote = async (id: string) => {
        setNotes(notes.filter(n => n.id !== id));
        try {
            await api.delete(`/notes/${id}`);
        } catch (error) {
            console.error("Failed to delete note", error);
            fetchNotes(); // Revert
        }
    };

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between py-4">
                <CardTitle className="text-lg">My Sticky Notes</CardTitle>
                <Button size="sm" onClick={addNote} className="gap-2">
                    <Plus size={16} /> Add Note
                </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-900/20 p-4">
                {loading ? (
                    <div className="text-center text-gray-500 py-10">Loading notes...</div>
                ) : notes.length === 0 ? (
                    <div className="text-center text-gray-400 py-10 italic">Click "Add Note" to create one.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {notes.map(note => (
                            <div
                                key={note.id}
                                className={`relative p-4 rounded-lg border shadow-sm transition-all hover:shadow-md ${note.color} h-[200px] flex flex-col group`}
                            >
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                    <div className="flex gap-1 bg-white/50 p-1 rounded-full dark:bg-black/20">
                                        {COLORS.map(c => (
                                            <button
                                                key={c.name}
                                                className={`w-3 h-3 rounded-full border border-gray-400 ${c.value.split(' ')[0]}`}
                                                onClick={() => updateNote(note.id, { color: c.value })}
                                                title={c.name}
                                            />
                                        ))}
                                    </div>
                                    <button
                                        className="text-red-500 bg-white/80 rounded-full p-1 hover:bg-white dark:bg-black/20"
                                        onClick={() => deleteNote(note.id)}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                                <textarea
                                    className="w-full h-full bg-transparent border-none resize-none focus:outline-none text-sm p-0 placeholder-gray-500/50"
                                    placeholder="Type your note here..."
                                    value={note.content}
                                    onChange={(e) => {
                                        const newContent = e.target.value;
                                        setNotes(notes.map(n => n.id === note.id ? { ...n, content: newContent } : n));
                                    }}
                                    onBlur={(e) => updateNote(note.id, { content: e.target.value })}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
