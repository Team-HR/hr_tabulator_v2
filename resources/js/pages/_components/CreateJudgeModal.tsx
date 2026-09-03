import { useToast } from '@/context/ToastContext';
import { router } from '@inertiajs/react';
import { useState } from 'react';

interface ComponentProps {
    event_id: number;
    btn_className?: string;
}

const CreateJudgeModal = ({ event_id, btn_className }: ComponentProps) => {
    const { showToast } = useToast();

    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmpassword, setConfirmPassword] = useState('');

    const [usernameError, setUsernameError] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        await router.post(
            route('event.create.judge'),
            { fullname: name, username, password },
            {
                onSuccess: () => {
                    showToast('Successfully created judge account', 'success');
                    closeModal();
                },
                onError: (pageErrors) => {
                    if (pageErrors.username) {
                        setUsernameError(pageErrors.username);
                    }
                },
            },
        );
    };

    const clearInputs = () => {
        setName('');
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setUsernameError('');
    };

    const closeModal = () => {
        const modal = document.getElementById('my_modal_2') as HTMLDialogElement | null;

        clearInputs();
        if (modal) {
            modal.close();
        }
    };

    return (
        <>
            <button
                className={`btn btn-success ${btn_className}`}
                onClick={() => {
                    const modal = document.getElementById('my_modal_2') as HTMLDialogElement | null;

                    if (modal) {
                        modal.showModal();
                    }
                }}
            >
                New judge
            </button>
            <dialog id="my_modal_2" className="modal">
                <form onSubmit={(e) => handleSubmit(e)} className="modal-box max-w-sm">
                    <h3 className="text-lg font-bold">Create judge account</h3>
                    <div className="flex flex-col">
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">Fullname</legend>
                            <input required type="text" className="input w-full" value={name} onChange={(e) => setName(e.target.value)} />
                        </fieldset>
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">Username</legend>
                            <input required type="text" className="input w-full" value={username} onChange={(e) => setUsername(e.target.value)} />
                            {usernameError && <p className="label text-error">{usernameError}</p>}
                        </fieldset>
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">Password</legend>
                            <input required type="password" className="input w-full" value={password} onChange={(e) => setPassword(e.target.value)} />
                        </fieldset>
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">Confirm password</legend>
                            <input
                                required
                                type="password"
                                className="input w-full"
                                value={confirmpassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                            {password !== confirmpassword && <p className="label text-error">Confirm password must match password</p>}
                        </fieldset>
                    </div>
                    <div className="divider"></div>
                    <div className="text-end">
                        <button
                            type="button"
                            className="btn"
                            onClick={() => {
                                closeModal();
                                clearInputs();
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
                    <button onClick={() => clearInputs()}>close</button>
                </form>
            </dialog>
        </>
    );
};

export default CreateJudgeModal;
