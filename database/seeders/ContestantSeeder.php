<?php

namespace Database\Seeders;

use App\Models\Contestant;
use App\Models\Event;
use Illuminate\Database\Seeder;

class ContestantSeeder extends Seeder
{
    /**
     * Seed contestants from the current CSC 2026 tabulator database.
     */
    public function run(): void
    {
        $contestantsByEvent = [
            'PASUNDING' => [
                'Cluster 1',
                'Cluster 2',
                'Cluster 3',
                'Cluster 4',
                'Cluster 5',
                'Cluster 6',
            ],
            'CSC AMBASSADOR' => [
                'Cluster 1',
                'Cluster 4',
                'Cluster 3',
                'Cluster 6',
                'Cluster 5',
                'Cluster 2',
            ],
            'CSC AMBASSADRESS' => [
                'Cluster 1',
                'Cluster 4',
                'Cluster 3',
                'Cluster 6',
                'Cluster 5',
                'Cluster 2',
            ],
        ];

        foreach ($contestantsByEvent as $eventName => $names) {
            $event = Event::where('name', $eventName)->firstOrFail();

            foreach ($names as $index => $name) {
                Contestant::updateOrCreate(
                    [
                        'event_id' => $event->id,
                        'name' => $name,
                    ],
                    [
                        'sort_order' => $index,
                    ],
                );
            }
        }
    }
}
