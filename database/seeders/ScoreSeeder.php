<?php

namespace Database\Seeders;

use App\Models\Contestant;
use App\Models\Criterion;
use App\Models\Event;
use App\Models\EventUser;
use App\Models\Score;
use Illuminate\Database\Seeder;

class ScoreSeeder extends Seeder
{
    /**
     * Create missing score rows from existing events, judges, contestants, and criteria.
     */
    public function run(): void
    {
        Event::query()->each(function (Event $event) {
            $eventUsers = EventUser::where('event_id', $event->id)->get();
            $contestants = Contestant::where('event_id', $event->id)->get();
            $criteria = Criterion::where('event_id', $event->id)->get();

            foreach ($eventUsers as $eventUser) {
                foreach ($contestants as $contestant) {
                    foreach ($criteria as $criterion) {
                        Score::firstOrCreate(
                            [
                                'event_id' => $event->id,
                                'event_user_id' => $eventUser->id,
                                'contestant_id' => $contestant->id,
                                'criterion_id' => $criterion->id,
                                'judge_id' => $eventUser->user_id,
                            ],
                        );
                    }
                }
            }
        });
    }
}
