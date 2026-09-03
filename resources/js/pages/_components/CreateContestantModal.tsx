import { useToast } from '@/context/ToastContext';
import { router } from '@inertiajs/react';
import { useState } from 'react';

interface ComponentProps {
    btn_className?: string;
    event_id: number;
}

const CreateContestantModal = ({ btn_className, event_id }: ComponentProps) => {
    const [contestant, setContestant] = useState('');
    const { showToast } = useToast();

    const closeModal = () => {
        const modal = document.getElementById('createContestantModal') as HTMLDialogElement | null;

        if (modal) {
            modal.close();
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        await router.post(
            route('create.contestant'),
            { name: contestant, event_id },
            {
                onSuccess: () => {
                    closeModal();
                    showToast('Contestant added successully', 'success');
                    setContestant('');
                },
            },
        );
    };

    return (
        <>
            {/* Open the modal using document.getElementById('ID').showModal() method */}
            <button
                className={`btn btn-success ${btn_className}`}
                onClick={() => {
                    const modal = document.getElementById('createContestantModal') as HTMLDialogElement | null;

                    if (modal) {
                        modal.showModal();
                    }
                }}
            >
                New Contestant
            </button>
            <dialog id="createContestantModal" className="modal">
                <form onSubmit={(e) => handleSubmit(e)} className="modal-box max-w-sm">
                    <h3 className="text-lg font-bold">Create Contestant</h3>
                    <div className="flex flex-col">
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">Contestant name</legend>
                            <input type="text" className="input w-full" required value={contestant} onChange={(e) => setContestant(e.target.value)} />
                        </fieldset>
                    </div>
                    <div className="divider"></div>
                    <div className="text-end">
                        <button
                            type="button"
                            className="btn"
                            onClick={() => {
                                closeModal();
                                // clearInputs();
                            }}
                        >
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-success">
                            Create
                        </button>
                    </div>
                </form>
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>
        </>
    );
};

export default CreateContestantModal;
