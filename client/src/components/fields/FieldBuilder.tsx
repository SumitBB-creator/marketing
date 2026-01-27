// import React from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PlatformField } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { GripVertical, Trash2 } from 'lucide-react';

interface SortableFieldItemProps {
    id: string;
    field: PlatformField;
    onDelete: (id: string) => void;
}

function SortableFieldItem({ id, field, onDelete }: SortableFieldItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="mb-2">
            <Card>
                <CardContent className="p-3 flex items-center gap-3">
                    <div {...attributes} {...listeners} className="cursor-move text-gray-400 hover:text-gray-600">
                        <GripVertical size={20} />
                    </div>
                    <div className="flex-1">
                        <div className="font-medium">{field.field_name}</div>
                        <div className="text-xs text-muted-foreground flex gap-2">
                            <span className="bg-gray-100 dark:bg-gray-800 px-1 rounded uppercase text-[10px]">{field.field_type}</span>
                            {field.is_required && <span className="text-red-500">Required</span>}
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(field.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                        <Trash2 size={16} />
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

interface FieldBuilderProps {
    fields: PlatformField[];
    onReorder: (fields: PlatformField[]) => void;
    onDelete: (id: string) => void;
}

export default function FieldBuilder({ fields, onReorder, onDelete }: FieldBuilderProps) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = fields.findIndex((f) => f.id === active.id);
            const newIndex = fields.findIndex((f) => f.id === over.id);
            onReorder(arrayMove(fields, oldIndex, newIndex));
        }
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                    {fields.map((field) => (
                        <SortableFieldItem key={field.id} id={field.id} field={field} onDelete={onDelete} />
                    ))}
                    {fields.length === 0 && <div className="text-center text-sm text-gray-500 italic py-4">No fields added yet.</div>}
                </div>
            </SortableContext>
        </DndContext>
    );
}
