<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use RuntimeException;

class UserSeeder extends Seeder
{
    /**
     * Seed users from the current CSC 2026 tabulator database.
     */
    public function run(): void
    {
        $adminPassword = env('SEED_ADMIN_PASSWORD');
        $judgePassword = env('SEED_JUDGE_PASSWORD');

        if (! is_string($adminPassword) || $adminPassword === '' || ! is_string($judgePassword) || $judgePassword === '') {
            throw new RuntimeException(
                'Set SEED_ADMIN_PASSWORD and SEED_JUDGE_PASSWORD in the environment before seeding.',
            );
        }

        $users = [
            [
                'name' => 'administrator',
                'username' => 'admin',
                'password' => $adminPassword,
                'plain_password' => $adminPassword,
                'role' => 'administrator',
                'status' => 'active',
            ],
            [
                'name' => 'MARIVIC E. BABOR',
                'username' => 'mebabor',
                'password' => $judgePassword,
                'plain_password' => $judgePassword,
                'role' => 'judge',
                'status' => 'active',
            ],
            [
                'name' => 'EMMALYN R. GARGAR',
                'username' => 'ergargar',
                'password' => $judgePassword,
                'plain_password' => $judgePassword,
                'role' => 'judge',
                'status' => 'active',
            ],
            [
                'name' => 'JUNIE D. PORDALIZA',
                'username' => 'jdpordaliza',
                'password' => $judgePassword,
                'plain_password' => $judgePassword,
                'role' => 'judge',
                'status' => 'active',
            ],
        ];

        foreach ($users as $user) {
            User::updateOrCreate(
                ['username' => $user['username']],
                $user,
            );
        }
    }
}
