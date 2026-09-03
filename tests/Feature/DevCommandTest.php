<?php

use App\Console\Commands\DevCommand;
use Symfony\Component\Console\Input\ArrayInput;

function makeDevCommand(array $options = []): DevCommand
{
    $command = app(DevCommand::class);
    $command->setLaravel(app());
    $command->setInput(new ArrayInput($options, $command->getDefinition()));

    return $command;
}

it('registers artisan dev with multiplex options', function () {
    $this->artisan('help', ['command_name' => 'dev'])
        ->expectsOutputToContain('--stream')
        ->expectsOutputToContain('--tabs')
        ->expectsOutputToContain('--timestamps')
        ->expectsOutputToContain('--no-restart')
        ->assertSuccessful();
});

it('runs server, vite, and reverb by default', function () {
    $names = array_column(makeDevCommand()->processes(), 'name');

    expect($names)->toBe(['server', 'vite', 'reverb']);
});

it('runs the inertia ssr stack when --ssr is passed', function () {
    $names = array_column(makeDevCommand(['--ssr' => true])->processes(), 'name');

    expect($names)->toBe(['server', 'queue', 'logs', 'ssr']);
});

it('builds a multiplex command with colors, flags, and the process list', function () {
    $command = makeDevCommand(['--timestamps' => true]);
    $built = $command->multiplexCommand($command->processes());

    expect($built)
        ->toContain('@laravel/multiplex')
        ->toContain('--timestamps')
        ->toContain('server@#93c5fd,')
        ->toContain('vite@#c4b5fd,')
        ->toContain('reverb@#fb7185,')
        ->toContain('php artisan reverb:start');
});
