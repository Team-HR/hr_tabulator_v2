import { useToast } from '@/context/ToastContext';
import { User } from '@/types';
import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface ComponentProps {
    judge: User | null;
    open: boolean;
    onClose: () => void;
}

const EditJudgeModal = ({ judge, open, onClose }: ComponentProps) => {
    const { showToast } = useToast();

    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmpassword, setConfirmPassword] = useState('');
    const [usernameError, setUsernameError] = useState('');

    useEffect(() => {
        if (judge && open) {
            setName(judge.name);
            setUsername(judge.username);
            setPassword(judge.plain_password ?? '');
            setConfirmPassword(judge.plain_password ?? '');
            setUsernameError('');
        }
    }, [judge, open]);

    useEffect(() => {
        const modal = document.getElementById('editJudgeModal') as HTMLDialogElement | null;
        if (!modal) return;

        if (open) {
            modal.showModal();
        } else {
            modal.close();
        }
    }, [open]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!judge || password !== confirmpassword) return;

        await router.patch(
            route('event.update.judge'),
            {
                user_id: judge.id,
                fullname: name,
                username,
                password,
            },
            {
                onSuccess: () => {
                    showToast('Successfully updated judge account', 'success');
                    onClose();
                },
                onError: (pageErrors) => {
                    if (pageErrors.username) {
                        setUsernameError(pageErrors.username);
                    }
                },
            },
        );
    };

    return (
        <dialog
            id="editJudgeModal"
            className="modal"
            onClose={onClose}
        >
            <form onSubmit={(e) => handleSubmit(e)} className="modal-box max-w-sm">
                <h3 className="text-lg font-bold">Edit judge account</h3>
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
                    <button type="button" className="btn" onClick={onClose}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-success" disabled={password !== confirmpassword}>
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

export default EditJudgeModal;
