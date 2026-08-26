<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class DevCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'dev
        {--t|tabs : Start in tabs mode}
        {--s|stream : Start in stream mode}
        {--i|inline : Print output inline instead of rendering the TUI}
        {--timestamps : Prefix every line with a timestamp}
        {--no-restart : Disable auto-restart on crash}
        {--json : Emit newline-delimited JSON events}
        {--buffer-size= : Max lines kept per command buffer}
        {--stream-buffer-size= : Max lines kept in stream buffer}
        {--ssr : Run the Inertia SSR stack instead of Vite and Reverb}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Start the local development processes in a tabbed TUI';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $processes = $this->processes();

        return PHP_OS_FAMILY === 'Windows'
            ? $this->runViaConcurrently($processes)
            : $this->runViaMultiplex($processes);
    }

    /**
     * @return list<array{name: string, color: string, command: string}>
     */
    public function processes(): array
    {
        if ($this->option('ssr')) {
            return [
                ['name' => 'server', 'color' => '#93c5fd', 'command' => 'php artisan serve'],
                ['name' => 'queue', 'color' => '#c4b5fd', 'command' => 'php artisan queue:listen --tries=1'],
                ['name' => 'logs', 'color' => '#fb7185', 'command' => 'php artisan pail --timeout=0'],
                ['name' => 'ssr', 'color' => '#fdba74', 'command' => 'php artisan inertia:start-ssr'],
            ];
        }

        $host = getenv('SERVER_HOST') ?: getenv('VITE_NETWORK_URL') ?: '127.0.0.1';
        $port = getenv('APP_PORT') ?: '8069';

        return [
            [
                'name' => 'server',
                'color' => '#93c5fd',
                'command' => sprintf('php artisan serve --host=%s --port=%s', $host, $port),
            ],
            ['name' => 'vite', 'color' => '#c4b5fd', 'command' => 'npm run dev -- --host'],
            ['name' => 'reverb', 'color' => '#fb7185', 'command' => 'php artisan reverb:start'],
        ];
    }

    /**
     * @param  list<array{name: string, color: string, command: string}>  $processes
     */
    public function multiplexCommand(array $processes): string
    {
        $args = collect($processes)
            ->map(fn (array $process) => implode(',', [
                $process['name'].'@'.$process['color'],
                $process['command'],
            ]))
            ->map(escapeshellarg(...));

        $title = 'artisan dev · '.(config('app.name') === 'Laravel' ? basename(base_path()) : config('app.name'));

        $flags = collect([
            'stream' => $this->option('stream') && ! $this->option('tabs'),
            'inline' => $this->option('inline') && ! $this->option('tabs') && ! $this->option('stream'),
            'timestamps' => $this->option('timestamps'),
            'no-restart' => $this->option('no-restart'),
            'json' => $this->option('json'),
        ])
            ->filter()
            ->keys()
            ->map(fn (string $flag) => "--{$flag}");

        if ($bufferSize = $this->option('buffer-size')) {
            $flags->push('--buffer-size='.escapeshellarg($bufferSize));
        }

        if ($streamBufferSize = $this->option('stream-buffer-size')) {
            $flags->push('--stream-buffer-size='.escapeshellarg($streamBufferSize));
        }

        $command = '@laravel/multiplex --title '.escapeshellarg($title);

        if ($flags->isNotEmpty()) {
            $command .= ' '.$flags->implode(' ');
        }

        return $command.' '.$args->implode(' ');
    }

    /**
     * @param  list<array{name: string, color: string, command: string}>  $processes
     */
    protected function runViaMultiplex(array $processes): int
    {
        if (! is_dir(base_path('node_modules/@laravel/multiplex'))) {
            $node = trim((string) shell_exec('node -v 2>/dev/null')) ?: 'unknown';

            $this->error('@laravel/multiplex is not installed. Run npm install with Node 22.13+ (current: '.$node.').');

            return self::FAILURE;
        }

        $command = 'npx --no-install '.$this->multiplexCommand($processes);

        if (extension_loaded('pcntl')) {
            pcntl_exec('/usr/bin/env', ['sh', '-c', $command]);
        }

        passthru($command, $exitCode);

        return $exitCode;
    }

    /**
     * @param  list<array{name: string, color: string, command: string}>  $processes
     */
    protected function runViaConcurrently(array $processes): int
    {
        if (! is_dir(base_path('node_modules/concurrently'))) {
            $this->error('concurrently is not installed. Run npm install.');

            return self::FAILURE;
        }

        $names = array_column($processes, 'name');
        $commands = array_column($processes, 'command');
        $colors = array_column($processes, 'color');

        $command = sprintf(
            'npx --no-install concurrently -c "%s" "%s" --names=%s',
            implode(',', $colors),
            implode('" "', $commands),
            implode(',', $names),
        );

        if (! $this->option('no-restart')) {
            $command .= ' --restart-tries=5 --restart-after=1000';
        } else {
            $command .= ' --kill-others-on-fail';
        }

        if ($this->option('timestamps')) {
            $command .= ' --timestamp-format="HH:mm:ss" -p "{time} [{name}]"';
        }

        passthru($command, $exitCode);

        return $exitCode;
    }
}
