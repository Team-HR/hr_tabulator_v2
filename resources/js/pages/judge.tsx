import { useToast } from '@/context/ToastContext';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Event, EventUser, Score } from '@/types/types';
import { router, usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import axios from 'axios';
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';

interface Props {
    eventUsers: EventUser[];
}

const DECIMAL_WARNING = 'Decimals are not allowed. Enter whole numbers only.';
const DECIMAL_KEYS = new Set(['.', ',', 'e', 'E', '+']);
const AUTOSAVE_DELAY_MS = 5000;
const DUPLICATE_RANK_COLORS = [
    'bg-warning/30 font-bold text-warning',
    'bg-info/30 font-bold text-info',
    'bg-error/30 font-bold text-error',
    'bg-success/30 font-bold text-success',
    'bg-secondary/30 font-bold text-secondary',
    'bg-accent/30 font-bold text-accent',
    'bg-primary/30 font-bold text-primary',
];

const EventUpdatedListener = ({ eventId, onUpdated }: { eventId: number; onUpdated: (eventId: number) => void }) => {
    useEcho(
        `event-updated.${eventId}`,
        'EventUpdated',
        () => {
            onUpdated(eventId);
        },
        [eventId, onUpdated],
    );

    return null;
};

const getEventIdFromUrl = (): number | null => {
    const raw = new URLSearchParams(window.location.search).get('event');
    if (!raw) return null;

    const eventId = Number(raw);
    return Number.isInteger(eventId) && eventId > 0 ? eventId : null;
};

const resolveEventUser = (eventUsers: EventUser[], eventId: number | null): EventUser | undefined => {
    if (eventId == null) return eventUsers[0];

    return eventUsers.find((eventUser) => eventUser.event?.id === eventId) ?? eventUsers[0];
};

const replaceEventQuery = (eventId: number | undefined) => {
    if (eventId == null) return;

    const url = new URL(window.location.href);
    url.searchParams.set('event', String(eventId));
    window.history.replaceState(window.history.state, '', url);
};

const judge = ({ eventUsers }: Props) => {
    const { showToast } = useToast();
    const { user } = usePage<PageProps>().props.auth;
    const lastDecimalWarningAt = useRef(0);
    const autosaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const initialEventUser = resolveEventUser(eventUsers, getEventIdFromUrl());
    const [assignedEvents, setAssignedEvents] = useState(eventUsers);
    const [activeEvent, setActiveEvent] = useState<Event | undefined>(initialEventUser?.event);
    const [activeScores, setActiveScores] = useState(initialEventUser?.event?.scores);
    const [activeCriteria, setActiveCriteria] = useState(initialEventUser?.event?.criteria);
    const [activeContestants, setActiveContestants] = useState(initialEventUser?.event?.contestants);

    const [prevScores, setPrevScores] = useState(initialEventUser?.event?.scores);

    const activeEventRef = useRef(activeEvent);
    const activeScoresRef = useRef(activeScores);
    const prevScoresRef = useRef(prevScores);

    activeEventRef.current = activeEvent;
    activeScoresRef.current = activeScores;
    prevScoresRef.current = prevScores;

    useEffect(() => {
        setAssignedEvents(eventUsers);
    }, [eventUsers]);

    const warnDecimalsNotAllowed = () => {
        const now = Date.now();
        if (now - lastDecimalWarningAt.current < 1500) return;
        lastDecimalWarningAt.current = now;
        showToast(DECIMAL_WARNING, 'warning');
    };

    const clearAutosave = () => {
        if (autosaveTimeoutRef.current) {
            clearTimeout(autosaveTimeoutRef.current);
            autosaveTimeoutRef.current = null;
        }
    };

    const scoresChanged = (arr1: Score[], arr2: Score[]): boolean => {
        if (arr1.length !== arr2.length) return true;

        return arr1.some((score, idx) => score.id !== arr2[idx].id || score.score !== arr2[idx].score);
    };

    const handleUpdateScores = async (scores = activeScores) => {
        clearAutosave();

        await router.patch(
            route('update.scores', { scores }),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setPrevScores(scores);
                    showToast('Scores Saved', 'success');
                },
            },
        );
    };

    const applyEventUser = (eventUser: EventUser) => {
        const updatedEvent = eventUser.event;
        if (!updatedEvent) return;

        setAssignedEvents((current) =>
            current.map((assigned) => (assigned.event_id === eventUser.event_id ? { ...assigned, event: updatedEvent } : assigned)),
        );

        if (activeEventRef.current?.id !== updatedEvent.id) {
            return;
        }

        setActiveEvent(updatedEvent);
        setActiveCriteria(updatedEvent.criteria);
        setActiveContestants(updatedEvent.contestants);
        setActiveScores(updatedEvent.scores);
        setPrevScores(updatedEvent.scores);
    };

    const fetchUpdatedJudgeEvent = useCallback(async (eventId: number) => {
        try {
            if (activeEventRef.current?.id === eventId && scoresChanged(prevScoresRef.current ?? [], activeScoresRef.current ?? [])) {
                await handleUpdateScores(activeScoresRef.current);
            }

            const { data } = await axios.get(route('judge.updated.event', eventId));
            applyEventUser(data);
            showToast('Event updated', 'info');
        } catch {
            showToast('Could not refresh event', 'error');
        }
    }, [showToast]);

    const handleEventSwitching = async (eventToSwitch: EventUser) => {
        clearAutosave();
        setActiveScores(eventToSwitch.event?.scores);
        setPrevScores(eventToSwitch.event?.scores);
        setActiveEvent(eventToSwitch.event);
        setActiveCriteria(eventToSwitch.event?.criteria);
        setActiveContestants(eventToSwitch.event?.contestants);
        replaceEventQuery(eventToSwitch.event?.id);
    };

    const handleScoreChange = (scoreId: number, newScore: number | null, maxScore: number) => {
        setActiveScores((prevScores) => {
            if (!prevScores) return prevScores;

            return prevScores.map((score) => {
                if (score.id === scoreId) {
                    return {
                        ...score,
                        score: newScore === null ? null : Math.min(Math.trunc(newScore), maxScore),
                    };
                }
                return score;
            });
        });
    };

    const handleScoreInputChange = (scoreId: number, rawValue: string, maxScore: number) => {
        if (rawValue === '') {
            handleScoreChange(scoreId, null, maxScore);
            return;
        }

        if (/[.,eE+]/.test(rawValue)) {
            warnDecimalsNotAllowed();
        }

        const parsed = parseInt(rawValue, 10);
        if (Number.isNaN(parsed)) return;

        handleScoreChange(scoreId, parsed, maxScore);
    };

    const handleScoreKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (DECIMAL_KEYS.has(e.key)) {
            e.preventDefault();
            warnDecimalsNotAllowed();
        }
    };

    useEffect(() => {
        if (!scoresChanged(prevScores ?? [], activeScores ?? [])) {
            clearAutosave();
            return;
        }

        clearAutosave();
        autosaveTimeoutRef.current = setTimeout(() => {
            void handleUpdateScores(activeScores);
        }, AUTOSAVE_DELAY_MS);

        return clearAutosave;
    }, [activeScores, prevScores]);

    const getContestantTotal = (contestantId: number): number => {
        if (!activeCriteria || !activeScores) return 0;

        return activeCriteria.reduce((sum, criterion) => {
            const score =
                activeScores.find((s) => s.criterion_id === criterion.id && s.contestant_id === contestantId)?.score ?? 0;
            return sum + score;
        }, 0);
    };

    // Rank contestants by this judge's total score (higher is better; ties share rank)
    const { contestantRanks, duplicateRankColors } = (() => {
        const contestants = activeContestants ?? [];
        const indexedTotals = contestants.map((contestant, i) => ({
            id: contestant.id,
            total: getContestantTotal(contestant.id),
            i,
        }));

        indexedTotals.sort((a, b) => b.total - a.total);

        const ranks = new Map<number, number>();
        const rankCounts = new Map<number, number>();
        let lastTotal: number | null = null;
        let lastRank = 0;
        let skipRank = 1;

        indexedTotals.forEach(({ id, total }) => {
            if (lastTotal === null || total < lastTotal) {
                lastRank += skipRank;
                skipRank = 1;
            } else {
                skipRank++;
            }
            ranks.set(id, lastRank);
            rankCounts.set(lastRank, (rankCounts.get(lastRank) ?? 0) + 1);
            lastTotal = total;
        });

        const colors = new Map<number, string>();
        let colorIndex = 0;
        [...rankCounts.entries()]
            .sort(([a], [b]) => a - b)
            .forEach(([rank, count]) => {
                if (count > 1) {
                    colors.set(rank, DUPLICATE_RANK_COLORS[colorIndex % DUPLICATE_RANK_COLORS.length]);
                    colorIndex++;
                }
            });

        return { contestantRanks: ranks, duplicateRankColors: colors };
    })();

    return (
        <AuthenticatedLayout className="p-4">
            {assignedEvents.map((eventUser) =>
                eventUser.event_id ? (
                    <EventUpdatedListener key={eventUser.event_id} eventId={eventUser.event_id} onUpdated={fetchUpdatedJudgeEvent} />
                ) : null,
            )}
            <div className="join">
                {assignedEvents.map((eventUser, index) => (
                    <button
                        className={`btn join-item ${eventUser.event?.id === activeEvent?.id && 'btn-neutral'}`}
                        onClick={async () => {
                            if (scoresChanged(prevScores ?? [], activeScores ?? [])) {
                                await handleUpdateScores();
                            }
                            await handleEventSwitching(eventUser);
                        }}
                        key={index}
                    >
                        {eventUser.event?.icon ? `${eventUser.event.icon} ` : ''}
                        {eventUser.event?.name}
                    </button>
                ))}
            </div>
            <div
                className="my-4 p-4 text-center text-4xl font-bold uppercase"
                style={activeEvent?.name_color ? { backgroundColor: activeEvent.name_color, color: '#ffffff' } : undefined}
            >
                {activeEvent?.icon && <span className="mr-3">{activeEvent.icon}</span>}
                {activeEvent?.name}
            </div>

            <div className="overflow-x-auto border border-base-content/5 bg-base-100 shadow">
                <table className="table w-full table-fixed">
                    {/* head */}
                    <thead>
                        <tr>
                            <th className="text-center">Contestant</th>
                            {activeCriteria?.map((criterion, index) => (
                                <th key={index} className="text-center text-wrap uppercase">
                                    <div className="flex flex-col">
                                        <div>{criterion.name}</div>
                                        <div>(1 - {criterion.weight})</div>
                                    </div>
                                </th>
                            ))}
                            <th className="text-center">Total Score</th>
                            <th className="text-center">Rank</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activeContestants?.map((contestant, index) => {
                            const rank = contestantRanks.get(contestant.id);
                            const duplicateColor = rank !== undefined ? duplicateRankColors.get(rank) : undefined;

                            return (
                                <tr key={index} className="border-t border-base-content/15 hover:bg-base-200">
                                    <th className={`text-center`}>{contestant.name}</th>
                                    {activeCriteria?.map((criterion, index) => {
                                        let scoreId = activeScores?.find(
                                            (score) => score.criterion_id === criterion.id && contestant.id === score.contestant_id,
                                        )?.id;
                                        let score =
                                            activeScores?.find(
                                                (score) => score.criterion_id === criterion.id && contestant.id === score.contestant_id,
                                            )?.score ?? 0;

                                        return (
                                            <th key={index} className={`text-center`}>
                                                <input
                                                    type="number"
                                                    step={1}
                                                    min={0}
                                                    max={criterion.weight}
                                                    className="input max-w-32 text-center"
                                                    value={score > 0 ? score : ''}
                                                    onKeyDown={handleScoreKeyDown}
                                                    onChange={(e) => handleScoreInputChange(scoreId!, e.target.value, criterion.weight)}
                                                />
                                            </th>
                                        );
                                    })}
                                    <th className="text-center">{getContestantTotal(contestant.id)}</th>
                                    <th
                                        className={`text-center ${duplicateColor ?? ''}`}
                                        title={duplicateColor ? 'Tied rank' : undefined}
                                    >
                                        {rank ?? '-'}
                                    </th>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                <div className="flex items-center justify-between border-t border-base-300 bg-base-300/50 p-4">
                    <div className="ml-8 font-bold text-base-content/75 uppercase">Judged by: {user.name}</div>
                    <button
                        className="btn btn-wide btn-success"
                        disabled={!scoresChanged(activeScores ?? [], prevScores ?? [])}
                        onClick={() => {
                            void handleUpdateScores();
                        }}
                    >
                        Save
                    </button>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default judge;
