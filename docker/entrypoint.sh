#!/bin/sh
set -e

cd /var/www/html

ensure_dirs() {
    mkdir -p \
        storage/app/public \
        storage/app/private \
        storage/framework/cache/data \
        storage/framework/sessions \
        storage/framework/views \
        storage/logs \
        bootstrap/cache
    chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true
}

wait_for_db() {
    echo "Waiting for database at ${DB_HOST:-db}:${DB_PORT:-3306}..."
    i=0
    until php -r "
        \$host = getenv('DB_HOST') ?: 'db';
        \$port = getenv('DB_PORT') ?: '3306';
        \$db   = getenv('DB_DATABASE') ?: 'hr_tabulator_v2';
        \$user = getenv('DB_USERNAME') ?: 'tabulator';
        \$pass = getenv('DB_PASSWORD') ?: '';
        try {
            new PDO(
                sprintf('mysql:host=%s;port=%s;dbname=%s', \$host, \$port, \$db),
                \$user,
                \$pass,
                [PDO::ATTR_TIMEOUT => 3]
            );
            exit(0);
        } catch (Throwable \$e) {
            fwrite(STDERR, \$e->getMessage() . PHP_EOL);
            exit(1);
        }
    "; do
        i=$((i + 1))
        if [ "$i" -ge 60 ]; then
            echo "Database did not become ready in time."
            exit 1
        fi
        sleep 2
    done
    echo "Database is ready."
}

ensure_dirs

if [ "${1:-}" = "php-fpm" ]; then
    wait_for_db

    if [ -z "${APP_KEY:-}" ]; then
        echo "APP_KEY is not set. Generate one and put it in .env:"
        echo "  php artisan key:generate"
        echo "  docker compose run --rm --no-deps app php artisan key:generate --show"
        exit 1
    fi

    php artisan migrate --force --no-interaction
    php artisan storage:link --force --no-interaction || true
    php artisan optimize --no-interaction

    touch /tmp/app-ready
elif [ "${CONTAINER_ROLE:-}" = "reverb" ] || [ "${CONTAINER_ROLE:-}" = "queue" ]; then
    wait_for_db
fi

exec "$@"
