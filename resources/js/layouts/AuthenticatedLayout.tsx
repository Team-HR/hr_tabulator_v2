import { router } from '@inertiajs/react';
import { LogOut, MoveLeft } from 'lucide-react';
import { ReactNode } from 'react';

const AuthenticatedLayout = ({ children, className }: { children: ReactNode; className?: string }) => {
    return (
        <div className="flex min-h-screen flex-col">
            {/* Navbar */}
            <div
                className={`flex h-[64px] w-full ${route().current('home') || route().current('judge') ? 'justify-end' : 'justify-between'} items-center bg-base-200 px-8 shadow`}
            >
                {!route().current('home') && !route().current('judge') && (
                    <button
                        className="btn btn-sm btn-neutral"
                        onClick={() => {
                            window.history.back();
                        }}
                    >
                        <MoveLeft size={18} />
                    </button>
                )}

                <button
                    className="btn btn-sm"
                    onClick={() => {
                        const modal = document.getElementById('logoutModal') as HTMLDialogElement | null;
                        if (modal) {
                            modal.showModal();
                        }
                    }}
                >
                    <LogOut size={14} /> Logout
                </button>
                <dialog id="logoutModal" className="modal">
                    <div className="modal-box">
                        <h3 className="text-lg font-bold">Sign out?</h3>
                        <p className="py-4">Are you sure you want to sign-out?</p>
                        <div className="flex justify-end">
                            <button
                                className="btn btn-ghost"
                                onClick={() => {
                                    const modal = document.getElementById('logoutModal') as HTMLDialogElement | null;
                                    if (modal) {
                                        modal.close();
                                    }
                                }}
                            >
                                Cancel
                            </button>
                            <button className="btn" onClick={() => router.post(route('logout'))}>
                                Confirm
                            </button>
                        </div>
                    </div>
                    <form method="dialog" className="modal-backdrop">
                        <button>close</button>
                    </form>
                </dialog>
            </div>

            {/* Main content fills remaining space */}
            <main className={`${route().current('judge') ? 'flex-1' : 'h-[calc(100vh-64px)]'} ${className}`}>{children}</main>

            {/* Footer */}
            {route().current('judge') && (
                <footer className="footer-fade-long footer flex items-center justify-evenly bg-base-200/50 p-2 text-base-content sm:footer-horizontal">
                    <img src="assets/LOGO.png" alt="logos" className="max-h-40" />
                    <img src="assets/CSCBPLOGOS.webp" alt="logos" className="max-h-32" />
                    <img src="assets/PCSATHEME.webp" alt="logos" className="max-h-16" />
                </footer>
            )}
        </div>
    );
};

export default AuthenticatedLayout;
