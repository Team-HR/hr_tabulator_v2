import { useToast } from '@/context/ToastContext';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { PageProps, User } from '@/types';
import { Event, SpecialAward } from '@/types/types';
import { router, usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import axios from 'axios';
import { Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import ContestantsComponent from './_components/ContestantsComponent';
import JudgesComponent from './_components/JudgesComponent';
import SpecialAwardComponent from './_components/SpecialAwardComponent';
// LOGOS
import Logo from '../../../public/assets/LOGO.png';
import CSCBPLogo from '../../../public/assets/CSCBPLOGOS.webp';
import PCSATheme from '../../../public/assets/PCSATHEME.webp';
import CriterionWinnersTable from './_components/CriterionWinnersTable';
import JudgeScoresheet2 from './_components/JudgeScoresheet2';
import OverallWinnersTable from './_components/OverallWinnersTable';

interface Props {
    event: Event;
    judges_to_choose_from: User[];
}

const Admin = ({ event: eventFromProps, judges_to_choose_from }: Props) => {
    const { user } = usePage<PageProps>().props.auth;
    const [isPrinting, setIsPrinting] = useState(false);
    const [pointBased, setPointBased] = useState(true);
    const { showToast } = useToast();

    // EVENT STATE
    const [event, setEvent] = useState<Event>(eventFromProps);

    // NEW AWARD STATES
    const [specialAwards, setSpecialAwards] = useState<SpecialAward[]>(event.special_awards ?? []);
    const [awardTitle, setAwardTitle] = useState('');
    const [awardDescription, setAwardDescription] = useState('');
    const [awardAwardee, setAwardAwardee] = useState<number | null>(null);

    // PRINTING STATES
    const contentToPrint = useRef<HTMLDivElement>(null);
    const promiseResolveRef = useRef<((value?: void | PromiseLike<void>) => void) | null>(null);

    const fetchUpdatedEvent = async () => {
        await axios.get(route('get.updated.event', event.id)).then((res) => {
            setEvent(res.data);
            setSpecialAwards(res.data.special_awards);
        });
    };

    // Keep local event in sync when Inertia props refresh after mutations
    useEffect(() => {
        setEvent(eventFromProps);
        setSpecialAwards(eventFromProps.special_awards ?? []);
    }, [eventFromProps]);

    useEcho(`scores-updated.${user.id}`, 'ScoresUpdated', () => {
        fetchUpdatedEvent();
    });

    useEffect(() => {
        if (isPrinting && promiseResolveRef.current) {
            // Resolves the Promise, letting `react-to-print` know that the DOM updates are completed
            promiseResolveRef.current?.();
        }
    }, [isPrinting]);

    const handlePrint = useReactToPrint({
        contentRef: contentToPrint,
        onBeforePrint: () => {
            return new Promise((resolve) => {
                promiseResolveRef.current = resolve;
                setIsPrinting(true);
            });
        },
        onAfterPrint: () => {
            // Reset the Promise resolve so we can print again
            promiseResolveRef.current = null;
            setIsPrinting(false);
        },
    });

    const handleAwardeeSelection = (id: number) => {
        setAwardAwardee((prevId) => (prevId === id ? null : id));
    };

    const openNewAwardModal = () => {
        const modal = document.getElementById('newAwardModal') as HTMLDialogElement | null;
        if (modal) {
            modal.showModal();
        }
    };

    const closeNewAwardModal = () => {
        const modal = document.getElementById('newAwardModal') as HTMLDialogElement | null;
        if (modal) {
            modal.close();
        }
    };

    const handleCreateAward = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        await router.post(
            route('create.award', { award_title: awardTitle, award_description: awardDescription, event_id: event.id, contestant_id: awardAwardee }),
            {},
            {
                onSuccess: () => {
                    closeNewAwardModal();
                    clearForm();
                    showToast('Successfully added award!', 'success');
                },
            },
        );
    };

    const clearForm = () => {
        setAwardAwardee(null);
        setAwardTitle('');
        setAwardDescription('');
    };

    return (
        <AuthenticatedLayout className="flex">
            {/* SCROLLABLE LONG CONTENT */}
            <div className="w-full max-w-md overflow-auto bg-base-200 p-4 shadow-lg">
                <JudgesComponent event={event} judges={judges_to_choose_from} />
                <div className="divider" />
                <ContestantsComponent event={event} />
            </div>

            <div className="flex h-full w-full flex-col">
                {/* Fixed Top Controls */}
                <div className="flex items-center justify-between gap-2 bg-base-100 p-4">
                    <div className="flex items-center gap-2">
                        <fieldset className="fieldset w-fit rounded-box border border-base-300 bg-base-100 p-4">
                            <label className="label cursor-pointer gap-2">
                                <input type="checkbox" checked={pointBased} onChange={() => setPointBased(!pointBased)} className="toggle" />
                                <span className="label-text">{pointBased ? 'Point' : 'Rank'} based</span>
                            </label>
                        </fieldset>
                        <button className="btn bg-base-200" onClick={openNewAwardModal}>
                            Add award <Plus size={14} />{' '}
                        </button>
                    </div>

                    <button className="btn btn-success" onClick={() => handlePrint()}>
                        Print
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="block gap-4 overflow-y-auto bg-white p-8" ref={contentToPrint}>
                    <div className="print-avoid-break space-y-4">
                        {/* <TotalScoreSheetComponent event={event} pointBased={pointBased} /> */}
                        <OverallWinnersTable
                            pointBased={pointBased}
                            judges={event.judges ?? []}
                            contestants={event.contestants ?? []}
                            criteria={event.criteria ?? []}
                        />
                        {/* <CategoricalWinnersComponents event={event} pointBased={pointBased} /> */}
                        <CriterionWinnersTable pointBased={pointBased} contestants={event.contestants ?? []} criteria={event.criteria ?? []} />
                        {specialAwards.length > 0 && (
                            <div className="print-avoid-break">
                                <SpecialAwardComponent awards={specialAwards} isPrinting={isPrinting} />
                            </div>
                        )}
                    </div>
                    <div className={`${!isPrinting && 'my-4'}`}>
                        {event.judges?.map((judge, index) => (
                            <div key={index} className={`page-break judge-print card w-full card-xs ${isPrinting ? 'bg-none' : 'h-fit'}`}>
                                <div className={`card-body ${isPrinting ? 'flex h-screen flex-col justify-between pt-16' : 'flex flex-col gap-8'}`}>
                                    <div className="flex flex-col gap-8">
                                        <JudgeScoresheet2
                                            judge={judge}
                                            pointBased={pointBased}
                                            contestants={event.contestants ?? []}
                                            criteria={event.criteria ?? []}
                                        />
                                    </div>

                                    {isPrinting && (
                                        <footer className="footer flex items-center justify-between bg-base-200/50 p-2 text-base-content sm:footer-horizontal">
                                            <img src={Logo} alt="logos" className="max-h-40" />
                                            <img src={CSCBPLogo} alt="logos" className="max-h-32" />
                                            <img src={PCSATheme} alt="logos" className="max-h-16" />
                                        </footer>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {/* <div className="block space-y-4" ref={contentToPrint}>
                        <TotalScoreSheetComponent event={event} pointBased={pointBased} />
                        <CategoricalWinnersComponents event={event} pointBased={pointBased} />
                        {specialAwards.length > 0 && <SpecialAwardComponent awards={specialAwards} isPrinting={isPrinting} />}
                    </div> */}
            {/* <div className={`card ${isPrinting ? 'h-auto bg-none' : 'h-fit'} w-full card-xs`} ref={contentToPrint}>
                        <div className="card-body">
                            <div className="flex flex-col gap-8">
                                <TotalScoreSheetComponent event={event} pointBased={pointBased} />
                                <CategoricalWinnersComponents event={event} pointBased={pointBased} />
                                {specialAwards.length > 0 && <SpecialAwardComponent awards={specialAwards} isPrinting={isPrinting} />}
                            </div>
                        </div>
                    </div> */}

            {/* <div className={`${isPrinting ? 'flex flex-col' : 'h-fit'}`}>
                        {event.judges?.map((judge, index) => (
                            <div className={`card ${isPrinting ? 'h-auto bg-none' : 'h-fit'} judge-print w-full card-xs`} key={index}>
                                <div className="card-body">
                                    <div className="flex flex-col gap-8">
                                        <JudgeScoresheet
                                            key={index}
                                            judge={judge}
                                            criteria={event.criteria ?? []}
                                            contestants={event.contestants ?? []}
                                            pointBased={pointBased}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div> */}
            <dialog id="newAwardModal" className="modal">
                <form onSubmit={(e) => handleCreateAward(e)} className="modal-box max-w-sm">
                    <h3 className="text-lg font-bold">Special award</h3>
                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">Award</legend>
                        <input required type="text" className="input w-full" value={awardTitle} onChange={(e) => setAwardTitle(e.target.value)} />
                    </fieldset>
                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">Description</legend>
                        <textarea
                            className="textarea w-full"
                            placeholder="( Optional )"
                            value={awardDescription}
                            onChange={(e) => setAwardDescription(e.target.value)}
                        ></textarea>
                    </fieldset>
                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">Select awardee</legend>
                        {event.contestants?.map((contestant, index) => (
                            <div
                                key={index}
                                className={`cursor-pointer rounded p-2 capitalize hover:bg-base-300 ${awardAwardee === contestant.id ? 'bg-base-300' : 'bg-base-300/50'}`}
                                onClick={() => handleAwardeeSelection(contestant.id)}
                            >
                                {contestant.name}
                            </div>
                        ))}
                    </fieldset>
                    <div className="divider" />
                    <div className="text-end">
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => {
                                closeNewAwardModal();
                                clearForm();
                            }}
                        >
                            Cancel
                        </button>
                        <button className="btn btn-success" type="submit" disabled={!awardAwardee}>
                            Save
                        </button>
                    </div>
                </form>
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>
        </AuthenticatedLayout>
    );
};

export default Admin;
