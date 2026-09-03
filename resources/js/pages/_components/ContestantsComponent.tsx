import { Contestant, Event } from '@/types/types';
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { router } from '@inertiajs/react';
import { GripVertical, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import CreateContestantModal from './CreateContestantModal';
import RenameContestantModal from './RenameContestantModal';

const SortableParticipantRow = ({
    participant,
    disabled,
    onRename,
    onRemove,
}: {
    participant: Contestant;
    disabled: boolean;
    onRename: (participant: Contestant) => void;
    onRemove: (participant: Contestant) => void;
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: participant.id,
        disabled,
    });

    return (
        <tbody
            ref={setNodeRef}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
                opacity: isDragging ? 0.5 : 1,
                position: isDragging ? 'relative' : undefined,
                zIndex: isDragging ? 1 : undefined,
            }}
        >
            <tr>
                <td className="w-8">
                    <button
                        type="button"
                        className={`btn btn-square btn-ghost btn-xs ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-grab active:cursor-grabbing'}`}
                        title="Reorder"
                        aria-label={`Reorder ${participant.name}`}
                        disabled={disabled}
                        {...attributes}
                        {...(disabled ? {} : listeners)}
                    >
                        <GripVertical size={14} />
                    </button>
                </td>
                <th>{participant.name}</th>
                <td className="flex justify-end gap-1">
                    <button
                        type="button"
                        className="btn btn-square btn-xs btn-info"
                        title="Rename"
                        aria-label="Rename"
                        onClick={() => onRename(participant)}
                    >
                        <Pencil size={14} />
                    </button>
                    <button
                        type="button"
                        className="btn btn-square btn-xs btn-error"
                        title="Remove"
                        aria-label="Remove"
                        onClick={() => onRemove(participant)}
                    >
                        <Trash2 size={14} />
                    </button>
                </td>
            </tr>
        </tbody>
    );
};

const ContestantsComponent = ({ event }: { event: Event }) => {
    const [selectedParticipant, setSelectedParticipant] = useState<Contestant | null>(null);
    const [renamingParticipant, setRenamingParticipant] = useState<Contestant | null>(null);
    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const [orderedContestants, setOrderedContestants] = useState<Contestant[]>(event.contestants ?? []);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    useEffect(() => {
        setOrderedContestants(event.contestants ?? []);
    }, [event.contestants]);

    const handleDelete = async () => {
        if (!selectedParticipant) return;
        await router.delete(route('remove.contestant'), {
            data: { contestant_id: selectedParticipant.id },
        });
        setSelectedParticipant(null);
        const modal = document.getElementById('deleteContestantModal') as HTMLDialogElement | null;
        modal?.close();
    };

    const openRenameModal = (participant: Contestant) => {
        setRenamingParticipant(participant);
        setIsRenameOpen(true);
    };

    const closeRenameModal = () => {
        setIsRenameOpen(false);
        setRenamingParticipant(null);
    };

    const openRemoveModal = (participant: Contestant) => {
        setSelectedParticipant(participant);
        const modal = document.getElementById('deleteContestantModal') as HTMLDialogElement | null;
        modal?.showModal();
    };

    const handleDragEnd = (dragEvent: DragEndEvent) => {
        const { active, over } = dragEvent;
        if (!over || active.id === over.id) {
            return;
        }

        const oldIndex = orderedContestants.findIndex((contestant) => contestant.id === Number(active.id));
        const newIndex = orderedContestants.findIndex((contestant) => contestant.id === Number(over.id));
        if (oldIndex < 0 || newIndex < 0) {
            return;
        }

        const reordered = arrayMove(orderedContestants, oldIndex, newIndex);
        setOrderedContestants(reordered);

        router.patch(
            route('reorder.contestants'),
            {
                event_id: event.id,
                contestant_ids: reordered.map((contestant) => contestant.id),
            },
            { preserveScroll: true },
        );
    };

    const canReorder = orderedContestants.length > 1;

    return (
        <div className="card w-full bg-base-100 shadow-lg">
            <div className="card-body">
                <div className="flex justify-between">
                    <div className="text-lg font-bold">{event.name} Participants</div>
                    <CreateContestantModal event_id={event.id} btn_className="btn-xs" />
                </div>

                {orderedContestants.length > 0 ? (
                    <div className="max-h-52 overflow-auto">
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={orderedContestants.map((contestant) => contestant.id)} strategy={verticalListSortingStrategy}>
                                <table className="table table-sm">
                                    <thead>
                                        <tr>
                                            <th className="w-8"></th>
                                            <th>Name</th>
                                            <th className="text-end">Action</th>
                                        </tr>
                                    </thead>
                                    {orderedContestants.map((participant) => (
                                        <SortableParticipantRow
                                            key={participant.id}
                                            participant={participant}
                                            disabled={!canReorder}
                                            onRename={openRenameModal}
                                            onRemove={openRemoveModal}
                                        />
                                    ))}
                                </table>
                            </SortableContext>
                        </DndContext>
                    </div>
                ) : (
                    <div className="bg-base-200 py-2 text-center text-xs font-bold text-base-content/25 uppercase">No Participants</div>
                )}
            </div>

            {/* Single Delete Modal */}
            <dialog id="deleteContestantModal" className="modal">
                <div className="modal-box max-w-sm">
                    <h3 className="text-lg font-bold">Remove Participant</h3>

                    <h1 className="mt-2 text-sm">
                        Are you sure you want to remove <span className="font-bold">{selectedParticipant?.name}</span> as Participant for {event.name}
                        ?
                    </h1>

                    <div className="modal-action">
                        <form method="dialog">
                            <button className="btn">Cancel</button>
                            <button type="button" className="btn btn-error" onClick={handleDelete}>
                                Remove
                            </button>
                        </form>
                    </div>
                </div>
            </dialog>

            <RenameContestantModal contestant={renamingParticipant} open={isRenameOpen} onClose={closeRenameModal} />
        </div>
    );
};

export default ContestantsComponent;
