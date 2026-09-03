import { useToast } from '@/context/ToastContext';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { Criterion, Event } from '@/types/types';
import { Link, router } from '@inertiajs/react';
import { Pencil, X } from 'lucide-react';
import { type KeyboardEvent, useRef, useState } from 'react';

const welcome = ({ events }: { events: Event[] }) => {
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [eventName, setEventName] = useState('');
    const [icon, setIcon] = useState('');
    const [nameColor, setNameColor] = useState('');
    const [criteria, setCriteria] = useState<Criterion[]>([]);
    const [criterion, setCriterion] = useState<Criterion>({ name: '', weight: 0, id: 0 });
    const criterionNameRef = useRef<HTMLInputElement>(null);

    const { showToast } = useToast();

    const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
    const remainingWeight = Math.max(0, 100 - totalWeight);
    const isDisabled = totalWeight !== 100;

    const resetForm = () => {
        setEditingEvent(null);
        setEventName('');
        setIcon('');
        setNameColor('');
        setCriteria([]);
        setCriterion({ name: '', weight: 0, id: 0 });
    };

    const startEdit = (event: Event) => {
        const existingCriteria = Array.isArray(event.criteria) ? event.criteria : Object.values(event.criteria ?? {});

        setEditingEvent({ ...event, criteria: existingCriteria });
        setEventName(event.name);
        setIcon(event.icon ?? '');
        setNameColor(event.name_color ?? '');
        setCriteria(existingCriteria);
        setCriterion({ name: '', weight: 0, id: 0 });
    };

    const onAddCriterion = () => {
        if (!criterion.name.trim() || criterion.weight === 0) return;

        setCriteria((prevData) => [
            ...prevData,
            {
                ...criterion,
                id: Date.now(),
            },
        ]);

        setCriterion({ name: '', weight: 0, id: 0 });
        criterionNameRef.current?.focus();
    };

    const handleCriterionKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            onAddCriterion();
        }
    };

    const onRemoveCriterion = (id: number) => {
        setCriteria((prev) => prev.filter((item) => item.id !== id));
    };

    const onUpdateCriterion = (id: number, patch: Partial<Criterion>) => {
        setCriteria((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    };

    const remainingWeightFor = (id: number) => 100 - criteria.filter((item) => item.id !== id).reduce((sum, item) => sum + item.weight, 0);

    const handleEventSubmit = async () => {
        if (nameColor && !/^#[0-9A-Fa-f]{6}$/.test(nameColor)) {
            showToast('Name color must be a 6-digit hex value', 'error');
            return;
        }

        const payload = {
            event_name: eventName,
            icon: icon || null,
            name_color: nameColor || null,
            criteria: criteria.map((item) => {
                const isExisting = editingEvent?.criteria?.some((orig) => orig.id === item.id);

                return isExisting ? item : { name: item.name, weight: item.weight };
            }),
            ...(editingEvent ? { event_id: editingEvent.id } : {}),
        };

        const options = {
            onSuccess: () => {
                resetForm();
                showToast(editingEvent ? 'Event updated successfully' : 'Event Created Successfully', 'success');
            },
        };

        if (editingEvent) {
            await router.patch(route('event.update'), payload, options);
            return;
        }

        await router.post(route('event.create'), payload, options);
    };

    return (
        <AuthenticatedLayout className="flex min-h-0 items-start justify-evenly overflow-y-auto p-8">
            <div className="card h-fit max-h-full w-full max-w-xl overflow-y-auto bg-base-100 shadow-xl">
                <div className="card-body">
                    <div className="text-lg font-bold">{editingEvent ? 'Edit Event' : 'New Event'}</div>
                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">Event Name</legend>
                        <input type="text" className="input" value={eventName} onChange={(e) => setEventName(e.target.value)} />
                    </fieldset>

                    <div className="flex gap-2">
                        <fieldset className="fieldset w-28">
                            <legend className="fieldset-legend">Icon</legend>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    className="input w-full"
                                    placeholder="🏆"
                                    value={icon}
                                    onChange={(e) => setIcon(e.target.value)}
                                />
                                {icon && <span className="text-2xl leading-none">{icon}</span>}
                            </div>
                        </fieldset>
                        <fieldset className="fieldset flex-1">
                            <legend className="fieldset-legend">Background</legend>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    className="h-10 w-12 cursor-pointer rounded border border-base-300 bg-base-100 p-1"
                                    value={nameColor || '#000000'}
                                    onChange={(e) => setNameColor(e.target.value)}
                                />
                                <input
                                    type="text"
                                    className="input w-full"
                                    placeholder="Default"
                                    value={nameColor}
                                    onChange={(e) => setNameColor(e.target.value)}
                                />
                                {nameColor && (
                                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setNameColor('')}>
                                        Default
                                    </button>
                                )}
                            </div>
                        </fieldset>
                    </div>

                    {(eventName || icon) && (
                        <div
                            className="rounded-box border border-base-300 bg-base-200 px-4 py-2 text-center text-xl font-bold uppercase"
                            style={nameColor ? { backgroundColor: nameColor, color: '#ffffff' } : undefined}
                        >
                            {icon && <span className="mr-2">{icon}</span>}
                            <span>{eventName || 'Event name'}</span>
                        </div>
                    )}

                    <div className="text-lg font-bold">Criteria</div>

                    {criteria.length > 0 && (
                        <div className="max-h-64 overflow-auto bg-base-200">
                            <table className="table-pin-rows table table-sm">
                                <thead>
                                    <tr>
                                        <th>Criterion</th>
                                        <th>Weight</th>
                                        <th className="text-end">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {criteria.map((item) => {
                                        const maxWeight = remainingWeightFor(item.id);

                                        return (
                                            <tr key={item.id}>
                                                <td>
                                                    <input
                                                        type="text"
                                                        className="input input-sm w-full"
                                                        value={item.name}
                                                        onChange={(e) => onUpdateCriterion(item.id, { name: e.target.value })}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        className="input input-sm w-20"
                                                        value={item.weight}
                                                        onChange={(e) => {
                                                            const next = Number(e.target.value);
                                                            onUpdateCriterion(item.id, {
                                                                weight: next <= 0 ? 0 : next > maxWeight ? maxWeight : next,
                                                            });
                                                        }}
                                                    />
                                                    <span className="ml-1">%</span>
                                                </td>
                                                <td className="text-end">
                                                    <button className="btn btn-square btn-xs btn-error" onClick={() => onRemoveCriterion(item.id)}>
                                                        <X />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="flex w-full gap-2">
                        <fieldset className="fieldset w-full">
                            <legend className="fieldset-legend">Criterion</legend>
                            <input
                                ref={criterionNameRef}
                                type="text"
                                className="input w-full"
                                value={criterion.name}
                                onChange={(e) => setCriterion({ ...criterion, name: e.target.value })}
                                onKeyDown={handleCriterionKeyDown}
                            />
                        </fieldset>
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">Weight</legend>
                            <div className="flex">
                                <input
                                    type="number"
                                    className="input w-32"
                                    value={criterion.weight === 0 ? '' : criterion.weight > remainingWeight ? remainingWeight : criterion.weight}
                                    onChange={(e) =>
                                        setCriterion({
                                            ...criterion,
                                            weight:
                                                Number(e.target.value) === 0
                                                    ? 0
                                                    : Number(e.target.value) > remainingWeight
                                                      ? remainingWeight
                                                      : Number(e.target.value),
                                        })
                                    }
                                    onKeyDown={handleCriterionKeyDown}
                                />

                                <button
                                    className="btn ml-4 btn-success"
                                    onClick={onAddCriterion}
                                    disabled={criterion.name === '' || criterion.weight === 0 || remainingWeight === 0}
                                >
                                    Add
                                </button>
                            </div>
                        </fieldset>
                    </div>

                    <div className="mt-8 flex justify-end gap-2">
                        {editingEvent && (
                            <button type="button" className="btn" onClick={resetForm}>
                                Cancel
                            </button>
                        )}
                        <button className="btn btn-neutral" disabled={isDisabled || !eventName} onClick={() => handleEventSubmit()}>
                            {editingEvent ? 'Save Event' : 'Add Event'}
                        </button>
                    </div>
                </div>
            </div>
            <div className="card h-fit w-full max-w-xl bg-base-100 shadow-xl">
                <div className="card-body">
                    <div className="text-lg font-bold">Events</div>
                    {events.length === 0 ? (
                        <div className="w-full border-2 border-base-300 bg-base-200 py-2 text-center"> No record found </div>
                    ) : (
                        <div className="overflow-x-auto border border-base-content/5 bg-base-100">
                            <table className="table table-zebra">
                                <tbody>
                                    {events.map((event) => (
                                        <tr key={event.id}>
                                            <td>
                                                <span className="inline-flex items-center gap-2">
                                                    {event.icon && <span className="text-xl leading-none">{event.icon}</span>}
                                                    <span
                                                        className="rounded px-2 py-0.5"
                                                        style={event.name_color ? { backgroundColor: event.name_color, color: '#ffffff' } : undefined}
                                                    >
                                                        {event.name}
                                                    </span>
                                                </span>
                                            </td>
                                            <td className="text-end">
                                                <div className="flex justify-end gap-1">
                                                    <button
                                                        type="button"
                                                        className="btn btn-square btn-sm btn-info"
                                                        title="Edit"
                                                        aria-label="Edit"
                                                        onClick={() => startEdit(event)}
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                    <Link href={route('admin', event.id)} className="btn btn-sm btn-neutral">
                                                        View
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default welcome;
