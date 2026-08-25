# syntax=docker/dockerfile:1

# --- PHP dependencies ---
FROM php:8.4-cli-bookworm AS vendor

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
        git \
        unzip \
        libzip-dev \
    && docker-php-ext-install zip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

ENV COMPOSER_ALLOW_SUPERUSER=1 \
    COMPOSER_HOME=/tmp/composer

COPY composer.json composer.lock ./
RUN composer install \
    --no-dev \
    --no-scripts \
    --no-autoloader \
    --prefer-dist \
    --no-interaction \
    --no-progress

COPY . .
RUN composer dump-autoload --optimize --no-dev --no-scripts


# --- Frontend assets ---
FROM node:22-bookworm AS assets

WORKDIR /app

ARG VITE_APP_NAME="CSC TABULATOR"
ARG VITE_REVERB_APP_KEY="cjf9wuctt4oju4l6pky8"
ENV VITE_APP_NAME=${VITE_APP_NAME}
ENV VITE_REVERB_APP_KEY=${VITE_REVERB_APP_KEY}

COPY --from=vendor /app /app
RUN npm ci && npm run build


# --- Application (PHP-FPM) ---
FROM php:8.4-fpm-bookworm AS app

WORKDIR /var/www/html

RUN apt-get update && apt-get install -y --no-install-recommends \
        git \
        unzip \
        libicu-dev \
        libonig-dev \
        libzip-dev \
    && docker-php-ext-install -j"$(nproc)" \
        pdo_mysql \
        mbstring \
        pcntl \
        bcmath \
        intl \
        zip \
        sockets \
        opcache \
    && apt-get purge -y --auto-remove git \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY docker/php/conf.d/opcache.ini /usr/local/etc/php/conf.d/opcache.ini
COPY docker/php/conf.d/app.ini /usr/local/etc/php/conf.d/app.ini
COPY docker/php/zz-clear-env.conf /usr/local/etc/php-fpm.d/zz-clear-env.conf

COPY --from=vendor /app /var/www/html
COPY --from=assets /app/public/build /var/www/html/public/build
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh

RUN chmod +x /usr/local/bin/entrypoint.sh \
    && cp .env.example .env \
    && php artisan package:discover --ansi \
    && rm .env \
    && mkdir -p storage/app/public storage/app/private \
        storage/framework/cache/data storage/framework/sessions \
        storage/framework/views storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R ug+rwx storage bootstrap/cache

EXPOSE 9000

ENTRYPOINT ["entrypoint.sh"]
CMD ["php-fpm"]


# --- Nginx (static assets + reverse proxy) ---
FROM nginx:1.27-alpine AS nginx

COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=app /var/www/html/public /var/www/html/public
