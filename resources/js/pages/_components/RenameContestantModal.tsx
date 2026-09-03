import { useToast } from '@/context/ToastContext';
import { Contestant } from '@/types/types';
import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface ComponentProps {
    contestant: Contestant | null;
    open: boolean;
    onClose: () => void;
}

const RenameContestantModal = ({ contestant, open, onClose }: ComponentProps) => {
    const { showToast } = useToast();
    const [name, setName] = useState('');

    useEffect(() => {
        if (contestant && open) {
            setName(contestant.name);
        }
    }, [contestant, open]);

    useEffect(() => {
        const modal = document.getElementById('renameContestantModal') as HTMLDialogElement | null;
        if (!modal) return;

        if (open) {
            modal.showModal();
        } else {
            modal.close();
        }
    }, [open]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!contestant) return;

        await router.patch(
            route('update.contestant'),
            {
                contestant_id: contestant.id,
                name,
            },
            {
                onSuccess: () => {
                    showToast('Contestant renamed successfully', 'success');
                    onClose();
                },
            },
        );
    };

    return (
        <dialog id="renameContestantModal" className="modal" onClose={onClose}>
            <form onSubmit={(e) => handleSubmit(e)} className="modal-box max-w-sm">
                <h3 className="text-lg font-bold">Rename Contestant</h3>
                <div className="flex flex-col">
                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">Contestant name</legend>
                        <input required type="text" className="input w-full" value={name} onChange={(e) => setName(e.target.value)} />
                    </fieldset>
                </div>
                <div className="divider"></div>
                <div className="text-end">
                    <button type="button" className="btn" onClick={onClose}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-success">
                        Save
                    </button>
                </div>
            </form>

            <form method="dialog" className="modal-backdrop">
                <button onClick={onClose}>close</button>
            </form>
        </dialog>
    );
};

export default RenameContestantModal;
