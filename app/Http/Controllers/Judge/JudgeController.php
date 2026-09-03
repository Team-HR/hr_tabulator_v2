<?php

namespace App\Http\Controllers\Judge;

use App\Http\Controllers\Controller;
use App\Models\Contestant;
use App\Models\Criterion;
use App\Models\Event;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use App\Models\EventUser;
use App\Models\Score;
use App\Models\User;
use Exception;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class JudgeController extends Controller
{
    public function index(): Response|RedirectResponse
    {
        $user = Auth::user();

        if ($user->role !== 'judge') {
            return to_route('home');
        }

        $events = EventUser::where('user_id', $user->id)
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
            ->get();

        return Inertia::render('judge', [
            'eventUsers' => $events,
        ]);
    }

    public function add_judge (Request $request) {
       $validated = $request->validate([
            'event_id' => 'required|integer',
            'user_id' => 'required|integer',
        ]);

        $judge = EventUser::create([
            'event_id' => $validated['event_id'],
            'user_id' => $validated['user_id'],
        ]);

        $contestants = Contestant::where('event_id',$validated['event_id'])->get();
        $criteria = Criterion::where('event_id',$validated['event_id'])->get();

        foreach($contestants as $contestant){
            foreach($criteria as $criterion){
                Score::create([
                    'event_id' => $validated['event_id'],
                    'event_user_id' => $judge->id,
                    'contestant_id' => $contestant->id,
                    'criterion_id' => $criterion->id,
                    'judge_id' => $validated['user_id'],
                ]);
            }
        }

        return back()->with('success', 'Judge added successfully.');
    }

    public function remove_judge (Request $request) {
        try {
            $validated = $request->validate([
                'event_id' => 'required|integer',
                'user_id' => 'required|integer',
            ]);

            $event = EventUser::where('user_id', $validated['user_id'])
                ->where('event_id', $validated['event_id'])
                ->where('status', 'active')
                ->first();

            if ($event) {
                $event->delete();
            }

            return back()->with('success', 'Judge removed successfully.');
        } catch (ValidationException $e) {
            return back()->withErrors($e->validator)->withInput();
        } catch (Exception $e) {
            return back()->with('error', 'An unexpected error occurred. Please try again.');
        }
    }

    public function create_judge(Request $request)
    {
        try {
            $validated = $request->validate([
                'fullname' => 'required|string',
                'username' => 'required|string|unique:users',
                'password' => 'required|string',
            ]);

            User::create([
                'name' => $validated['fullname'],
                'username' => $validated['username'],
                'password' => Hash::make($validated['password']),
                'plain_password' => $validated['password'], // Consider encrypting this if needed
                'role' => 'judge', // Add role if needed
            ]);

            return back()->with('success', 'Judge created successfully.');
        } catch (ValidationException $e) {
            return back()->withErrors($e->validator)->withInput();
        } catch (Exception $e) {
            return back()->with('error', 'An unexpected error occurred. Please try again.');
        }
    }

    public function update_judge(Request $request)
    {
        try {
            $validated = $request->validate([
                'user_id' => 'required|integer|exists:users,id',
                'fullname' => 'required|string',
                'username' => 'required|string|unique:users,username,' . $request->input('user_id'),
                'password' => 'required|string',
            ]);

            $user = User::findOrFail($validated['user_id']);

            $user->update([
                'name' => $validated['fullname'],
                'username' => $validated['username'],
                'password' => $validated['password'],
                'plain_password' => $validated['password'],
            ]);

            return back()->with('success', 'Judge updated successfully.');
        } catch (ValidationException $e) {
            return back()->withErrors($e->validator)->withInput();
        } catch (Exception $e) {
            return back()->with('error', 'An unexpected error occurred. Please try again.');
        }
    }
}
