<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\EventUser;
use App\Models\User;
use Illuminate\Database\Seeder;

class EventUserSeeder extends Seeder
{
    /**
     * Assign existing judges to events from the current CSC 2026 tabulator database.
     */
    public function run(): void
    {
        $judgeUsernames = [
            'mebabor',
            'ergargar',
            'jdpordaliza',
        ];

        $eventNames = [
            'PASUNDING',
            'CSC AMBASSADOR',
            'CSC AMBASSADRESS',
        ];

        $judges = User::whereIn('username', $judgeUsernames)->get()->keyBy('username');
        $events = Event::whereIn('name', $eventNames)->get()->keyBy('name');

        foreach ($eventNames as $eventName) {
            $event = $events->get($eventName);

            foreach ($judgeUsernames as $username) {
                $judge = $judges->get($username);

                EventUser::updateOrCreate(
                    [
                        'event_id' => $event->id,
                        'user_id' => $judge->id,
                    ],
                    [
                        'status' => 'active',
                    ],
                );
            }
        }
    }
}
