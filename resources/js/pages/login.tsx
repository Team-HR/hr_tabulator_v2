import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';

const login = () => {
    const { errors } = usePage().props;
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        await router.post(
            route('login'),
            { username, password },
            {
                onError: () => {
                    setPassword('');
                },
            },
        );
    };

    return (
        <div className="flex h-screen flex-col items-center" style={{ backgroundImage: `url('/assets/BACKGROUND_IMAGE.webp')` }}>
            <img src="/assets/LOGO.png" alt="logo" className="mt-24 max-w-40" />
            <form onSubmit={(e) => handleSubmit(e)} className="fieldset w-xs rounded-box border border-base-300 bg-base-200 p-4">
                <legend className="fieldset-legend">Login</legend>

                <label className="label">Username</label>
                <input
                    type="text"
                    required
                    className={`input ${errors.username && 'input-error'}`}
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />

                <label className="label">Password</label>
                <input
                    type="password"
                    required
                    className="input"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                {errors.username && <p className="mt-4 text-center text-error">{errors.username}</p>}
                <button className="btn mt-4 btn-neutral" type="submit">
                    Login
                </button>
            </form>
        </div>
    );
};

export default login;
