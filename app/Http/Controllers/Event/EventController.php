<?php

namespace App\Http\Controllers\Event;

use App\Events\EventUpdated;
use App\Events\ScoresUpdated;
use App\Http\Controllers\Controller;
use App\Models\Contestant;
use App\Models\Criterion;
use App\Models\Event;
use App\Models\EventUser;
use App\Models\Score;
use App\Models\SpecialAward;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    public function home(): Response|RedirectResponse
    {
        $user = Auth::user();

        if ($user->role !== 'administrator') {
            return to_route('judge');
        }

        return Inertia::render('welcome', [
            'events' => Event::where('status', 'active')
                ->with('criteria')
                ->get()
                ->map(fn (Event $event) => [
                    'id' => $event->id,
                    'name' => $event->name,
                    'icon' => $event->icon,
                    'name_color' => $event->name_color,
                    'status' => $event->status,
                    'criteria' => $event->criteria
                        ->map(fn ($criterion) => [
                            'id' => $criterion->id,
                            'name' => $criterion->name,
                            'weight' => $criterion->weight,
                        ])
                        ->values()
                        ->all(),
                ]),
        ]);
    }

    public function admin(int $id): Response|RedirectResponse
    {
        $user = Auth::user();

        if ($user->role !== 'administrator') {
            return to_route('judge');
        }

        $userIds = EventUser::where('event_id', $id)->where('status', 'active')->pluck('user_id')->toArray();
        $judges = User::where('status', 'active')
            ->whereNotIn('id', $userIds)
            ->whereNot('username', 'admin')
            ->get();

        return Inertia::render('admin', [
            'judges_to_choose_from' => $judges,
            'event' => $this->loadEventForAdmin($id),
        ]);
    }

    public function updated_event(int $id)
    {
        return response()->json($this->loadEventForAdmin($id));
    }

    public function event_create(Request $request)
    {
        $validated = $this->validateEventPayload($request);

        $this->assertCriteriaWeightsSumTo100($validated['criteria']);

        $event = Event::create([
            'name' => $validated['event_name'],
            'icon' => $validated['icon'] ?? null,
            'name_color' => $validated['name_color'] ?? null,
        ]);

        foreach ($validated['criteria'] as $criterion) {
            Criterion::create([
                'event_id' => $event->id,
                'name' => $criterion['name'],
                'weight' => $criterion['weight'],
            ]);
        }

        return back()->with('success', 'Event created successfully.');
    }

    public function event_update(Request $request)
    {
        $validated = $this->validateEventPayload($request, true);

        $this->assertCriteriaWeightsSumTo100($validated['criteria']);

        $event = Event::findOrFail($validated['event_id']);

        DB::transaction(function () use ($event, $validated) {
            $event->update([
                'name' => $validated['event_name'],
                'icon' => $validated['icon'] ?? null,
                'name_color' => $validated['name_color'] ?? null,
            ]);

            $existingIds = $event->criteria()->pluck('id')->map(fn ($id) => (int) $id)->all();
            $keptIds = [];

            foreach ($validated['criteria'] as $criterionData) {
                $id = isset($criterionData['id']) ? (int) $criterionData['id'] : 0;

                if ($id && in_array($id, $existingIds, true)) {
                    Criterion::where('id', $id)
                        ->where('event_id', $event->id)
                        ->update([
                            'name' => $criterionData['name'],
                            'weight' => $criterionData['weight'],
                        ]);
                    $keptIds[] = $id;
                    continue;
                }

                $created = Criterion::create([
                    'event_id' => $event->id,
                    'name' => $criterionData['name'],
                    'weight' => $criterionData['weight'],
                ]);

                $this->createScoresForCriterion($event, $created);
                $keptIds[] = $created->id;
            }

            Criterion::where('event_id', $event->id)
                ->whereNotIn('id', $keptIds)
                ->delete();
        });

        ScoresUpdated::dispatch();
        EventUpdated::dispatch($event->id);

        return back()->with('success', 'Event updated successfully.');
    }

    public function update_scores(Request $request)
    {
        $validated = $request->validate([
            'scores' => 'required|array',
            'scores.*.id' => 'required|integer|exists:scores,id',
            'scores.*.score' => 'nullable|integer|min:0',
        ]);

        foreach ($validated['scores'] as $score) {
            $score = (array) $score;

            if (! array_key_exists('score', $score)) {
                continue;
            }

            $scoreToUpdate = Score::find($score['id']);

            if ($scoreToUpdate) {
                $scoreToUpdate->update([
                    'score' => $score['score'],
                ]);
            }
        }

        ScoresUpdated::dispatch();
    }

    public function judge_updated_event(int $id)
    {
        $user = request()->user();

        if ($user->role !== 'judge') {
            abort(403);
        }

        $eventUser = EventUser::where('user_id', $user->id)
            ->where('event_id', $id)
            ->where('status', 'active')
            ->with([
                'event.contestants',
                'event.scores' => function ($query) use ($user) {
                    $query->whereIn('event_user_id', function ($sub) use ($user) {
                        $sub->select('id')
                            ->from('event_user')
                            ->where('user_id', $user->id)
                            ->where('status', 'active');
                    });
                },
                'event.criteria',
            ])
            ->firstOrFail();

        return response()->json($eventUser);
    }

    public function create_award(Request $request)
    {
        SpecialAward::create([
            'title' => $request->input('award_title'),
            'description' => $request->input('award_description'),
            'event_id' => $request->input('event_id'),
            'contestant_id' => $request->input('contestant_id'),
        ]);

        ScoresUpdated::dispatch();
    }

    public function remove_award(Request $request)
    {
        $award = SpecialAward::find($request->input('special_award_id'));

        $award->update([
            'status' => 'in-active',
        ]);

        return to_route('admin', $award->event_id);

        ScoresUpdated::dispatch();
    }

    /**
     * @return array{event_id?: int, event_name: string, icon: ?string, name_color: ?string, criteria: array<int, array{id?: int, name: string, weight: float|int}>}
     */
    private function validateEventPayload(Request $request, bool $updating = false): array
    {
        $rules = [
            'event_name' => 'required|string',
            'icon' => 'nullable|string|max:32',
            'name_color' => ['nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'criteria' => 'required|array|min:1',
            'criteria.*.id' => 'nullable|integer',
            'criteria.*.name' => 'required|string',
            'criteria.*.weight' => 'required|numeric|min:1',
        ];

        if ($updating) {
            $rules['event_id'] = 'required|integer|exists:events,id';
        }

        return $request->validate($rules);
    }

    /**
     * @param  array<int, array{weight: float|int}>  $criteria
     */
    private function assertCriteriaWeightsSumTo100(array $criteria): void
    {
        $totalWeight = collect($criteria)->sum('weight');

        if ((int) round($totalWeight) !== 100) {
            throw ValidationException::withMessages([
                'criteria' => 'Criteria weights must sum to 100.',
            ]);
        }
    }

    private function loadEventForAdmin(int $id): Event
    {
        return Event::with([
            'criteria',
            'judges.eventUsers',
            'judges.scoresGiven',
            'contestants.scores.criterion',
            'specialAwards' => function ($query) {
                $query->where('status', 'active')
                    ->with('contestant');
            },
        ])->findOrFail($id);
    }

    private function createScoresForCriterion(Event $event, Criterion $criterion): void
    {
        $judges = EventUser::where('event_id', $event->id)->get();
        $contestants = Contestant::where('event_id', $event->id)->get();

        foreach ($judges as $judge) {
            foreach ($contestants as $contestant) {
                Score::create([
                    'event_id' => $event->id,
                    'event_user_id' => $judge->id,
                    'contestant_id' => $contestant->id,
                    'criterion_id' => $criterion->id,
                    'judge_id' => $judge->user_id,
                ]);
            }
        }
    }
}
