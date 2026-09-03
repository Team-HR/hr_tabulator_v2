<?php

namespace App\Http\Controllers\Contestant;

use App\Events\EventUpdated;
use App\Http\Controllers\Controller;
use App\Models\Contestant;
use App\Models\Criterion;
use App\Models\EventUser;
use App\Models\Score;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ContestantController extends Controller
{
    public function create_contestant (Request $request) {
       $validated = $request->validate([
            'name' => 'required|string',
            'event_id' => 'required|integer',
        ]);

        $maxSortOrder = Contestant::where('event_id', $validated['event_id'])->max('sort_order');

        $contestant = Contestant::create([
            'name' => $validated['name'],
            'event_id' => $validated['event_id'],
            'sort_order' => $maxSortOrder === null ? 0 : ((int) $maxSortOrder + 1),
        ]);

        $judges = EventUser::where('event_id',$validated['event_id'])->get();
        $criteria = Criterion::where('event_id',$validated['event_id'])->get();

        foreach($judges as $judge){
            foreach($criteria as $criterion){
                Score::create([
                    'event_id' => $validated['event_id'],
                    'event_user_id' => $judge->id,
                    'contestant_id' => $contestant->id,
                    'criterion_id' => $criterion->id,
                    'judge_id' => $judge->user_id,
                ]);
            }
        }

        EventUpdated::dispatch((int) $validated['event_id']);

        return back()->with('success', 'Contestant created successfully.');
    }

    public function remove_contestant (Request $request) {
        $validated = $request->validate([
            'contestant_id' => 'required|integer',
        ]);

        $contestant = Contestant::find($validated['contestant_id']);
        $eventId = $contestant?->event_id;
        $contestant->delete();

        if ($eventId) {
            EventUpdated::dispatch((int) $eventId);
        }

        return back()->with('success', 'Contestant removed successfully.');
    }

    public function update_contestant (Request $request) {
        $validated = $request->validate([
            'contestant_id' => 'required|integer|exists:contestants,id',
            'name' => 'required|string',
        ]);

        $contestant = Contestant::findOrFail($validated['contestant_id']);
        $contestant->update([
            'name' => $validated['name'],
        ]);

        EventUpdated::dispatch((int) $contestant->event_id);

        return back()->with('success', 'Contestant updated successfully.');
    }

    public function reorder_contestants(Request $request)
    {
        $validated = $request->validate([
            'event_id' => 'required|integer|exists:events,id',
            'contestant_ids' => 'required|array|min:1',
            'contestant_ids.*' => 'required|integer|distinct',
        ]);

        $existingIds = Contestant::where('event_id', $validated['event_id'])
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->sort()
            ->values()
            ->all();

        $payloadIds = collect($validated['contestant_ids'])
            ->map(fn ($id) => (int) $id)
            ->sort()
            ->values()
            ->all();

        if ($existingIds !== $payloadIds) {
            throw ValidationException::withMessages([
                'contestant_ids' => 'Contestant list must match this event.',
            ]);
        }

        DB::transaction(function () use ($validated) {
            foreach ($validated['contestant_ids'] as $index => $contestantId) {
                Contestant::where('id', $contestantId)
                    ->where('event_id', $validated['event_id'])
                    ->update(['sort_order' => $index]);
            }
        });

        EventUpdated::dispatch((int) $validated['event_id']);

        return back()->with('success', 'Contestant order updated successfully.');
    }
}
