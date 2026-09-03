<?php

namespace Database\Seeders;

use App\Models\Criterion;
use App\Models\Event;
use Illuminate\Database\Seeder;

class EventSeeder extends Seeder
{
    /**
     * Seed events and criteria from the current CSC 2026 tabulator database.
     */
    public function run(): void
    {
        $events = [
            [
                'name' => 'PASUNDING',
                'icon' => '💃',
                'name_color' => '#30b300',
                'status' => 'active',
                'criteria' => [
                    ['name' => 'Paukay/Wow Factor', 'weight' => 50],
                    ['name' => 'Showmanship/Execution', 'weight' => 20],
                    ['name' => 'Costume', 'weight' => 10],
                    ['name' => 'Props', 'weight' => 10],
                    ['name' => 'Overall Impact', 'weight' => 10],
                ],
            ],
            [
                'name' => 'CSC AMBASSADOR',
                'icon' => '♂️',
                'name_color' => '#003beb',
                'status' => 'active',
                'criteria' => [
                    ['name' => 'Charm & Personality', 'weight' => 40],
                    ['name' => 'Interview', 'weight' => 50],
                    ['name' => 'Overall Impact', 'weight' => 10],
                ],
            ],
            [
                'name' => 'CSC AMBASSADRESS',
                'icon' => '♀️',
                'name_color' => '#ff0095',
                'status' => 'active',
                'criteria' => [
                    ['name' => 'CHARM & PERSONALITY', 'weight' => 40],
                    ['name' => 'INTERVIEW', 'weight' => 50],
                    ['name' => 'OVERALL IMPACT', 'weight' => 10],
                ],
            ],
        ];

        foreach ($events as $eventData) {
            $criteria = $eventData['criteria'];
            unset($eventData['criteria']);

            $event = Event::updateOrCreate(
                ['name' => $eventData['name']],
                $eventData,
            );

            foreach ($criteria as $criterion) {
                Criterion::updateOrCreate(
                    [
                        'event_id' => $event->id,
                        'name' => $criterion['name'],
                    ],
                    [
                        'weight' => $criterion['weight'],
                        'status' => 'active',
                    ],
                );
            }
        }
    }
}
