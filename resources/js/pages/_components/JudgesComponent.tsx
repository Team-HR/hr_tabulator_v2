import { User } from '@/types';
import { Event } from '@/types/types';
import { router } from '@inertiajs/react';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import CreateJudgeModal from './CreateJudgeModal';
import EditJudgeModal from './EditJudgeModal';

const JudgesComponent = ({ event, judges }: { event: Event; judges: User[] }) => {
    const [selectedJudge, setSelectedJudge] = useState<User | null>(null);
    const [editingJudge, setEditingJudge] = useState<User | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const handleJudgeRemoval = async () => {
        if (!selectedJudge) return;
        await router.delete(route('event.remove.judge'), {
            data: { event_id: event.id, user_id: selectedJudge.id },
        });
        setSelectedJudge(null);
    };

    const openEditModal = (judge: User) => {
        setEditingJudge(judge);
        setIsEditOpen(true);
    };

    const closeEditModal = () => {
        setIsEditOpen(false);
        setEditingJudge(null);
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="card w-full bg-base-100 shadow-lg">
                <div className="card-body">
                    <div className="flex justify-between">
                        <div className="text-lg font-bold">Judges</div>
                        <CreateJudgeModal btn_className="btn-xs" event_id={event.id} />
                    </div>

                    {/* Available judges list */}
                    {judges.length > 0 ? (
                        <div className="max-h-52 overflow-auto">
                            <table className="table-pin-rows table bg-base-200 table-xs">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Username</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {judges.map((judge, index) => (
                                        <tr key={index}>
                                            <th>{judge.name}</th>
                                            <td>{judge.username}</td>
                                            <td>
                                                <button
                                                    className="btn btn-xs btn-success"
                                                    onClick={() =>
                                                        router.post(route('event.add.judge'), {
                                                            event_id: event.id,
                                                            user_id: judge.id,
                                                        })
                                                    }
                                                >
                                                    Add
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="bg-base-200 py-2 text-center text-xs font-bold text-base-content/25 uppercase">No Judge available</div>
                    )}

                    <div className="divider my-0" />
                    <div className="text-lg font-bold">{event.name} Judges</div>

                    {(event.judges?.length ?? 0) > 0 ? (
                        <div className="max-h-52 overflow-auto">
                            <table className="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Username</th>
                                        <th>Password</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {event.judges?.map((judge: User, index) => (
                                        <tr key={index}>
                                            <th>{judge.name}</th>
                                            <td>{judge.username}</td>
                                            <td>{judge.plain_password}</td>
                                            <td className="flex gap-1">
                                                <button
                                                    type="button"
                                                    className="btn btn-square btn-xs btn-info"
                                                    title="Edit"
                                                    aria-label="Edit"
                                                    onClick={() => openEditModal(judge)}
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-square btn-xs btn-error"
                                                    title="Remove"
                                                    aria-label="Remove"
                                                    onClick={() => {
                                                        setSelectedJudge(judge);
                                                        const modal = document.getElementById('deleteJudgeModal') as HTMLDialogElement | null;
                                                        modal?.showModal();
                                                    }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="bg-base-200 py-2 text-center text-xs font-bold text-base-content/25 uppercase">No Judges selected</div>
                    )}
                </div>
            </div>

            {/* Single reusable delete modal */}
            <dialog id="deleteJudgeModal" className="modal">
                <div className="modal-box max-w-sm">
                    <h3 className="text-lg font-bold">Remove Judge</h3>
                    <h1 className="mt-2 text-sm">
                        Are you sure you want to remove <span className="font-bold">{selectedJudge?.name}</span> as Judge for {event.name}?
                    </h1>
                    <div className="modal-action">
                        <form method="dialog">
                            <button className="btn" onClick={() => setSelectedJudge(null)}>
                                Cancel
                            </button>
                            <button className="btn btn-error" onClick={handleJudgeRemoval}>
                                Remove
                            </button>
                        </form>
                    </div>
                </div>
            </dialog>

            <EditJudgeModal judge={editingJudge} open={isEditOpen} onClose={closeEditModal} />
        </div>
    );
};

export default JudgesComponent;
