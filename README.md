# CSC Tabulator

Laravel 12 + Inertia/React scoring app with live updates via Laravel Reverb. Production runs as a Docker Compose stack (Nginx, PHP-FPM, Reverb, queue worker, MariaDB, phpMyAdmin).

---

## Production: fresh host (Docker)

Use this path on a new server. You do **not** need PHP, Composer, Node, or MariaDB installed on the host.

### Prerequisites

Install on the host before cloning:

- **Git**
- **Docker Engine** 24+ with the **Compose plugin** (`docker compose version` should work)
- Free TCP ports for the app (**8069** by default) and phpMyAdmin (**8081** by default)
- Outbound network access to pull images (`php`, `nginx`, `mariadb`, `phpmyadmin`, `node`) on first build

On Debian/Ubuntu:

```bash
sudo apt-get update
sudo apt-get install -y git docker.io docker-compose-v2
sudo usermod -aG docker "$USER"
# log out and back in so the docker group applies
```

Confirm:

```bash
docker --version
docker compose version
```

### 1. Clone

```bash
git clone https://github.com/kimpoy31/hr_tabulator_v2.git
cd hr_tabulator_v2
```

### 2. Environment file

```bash
cp .env.example .env
```

Edit `.env` for **this** host before the first `compose up`. Values that must change per machine:

| Variable | What to set |
| --- | --- |
| `VITE_NETWORK_URL` | This host’s LAN IP or hostname (example: `192.168.50.51`) |
| `APP_URL` | Public URL, including port: `http://<host>:8069` |
| `APP_PORT` | Host port to publish (default `8069`) |
| `PHPMYADMIN_PORT` | phpMyAdmin host port (default `8081`) |
| `APP_KEY` | Generated in the next step (leave empty until then) |
| `DB_PASSWORD` | App database password (required; do not leave as `changeme` on a real host) |
| `DB_ROOT_PASSWORD` | MariaDB root password (required) |
| `DB_DATABASE` / `DB_USERNAME` | Optional; defaults are `hr_tabulator_v2` / `tabulator` |

Leave `DB_HOST=db`. Compose points Laravel at the MariaDB service. PHP talks to Reverb on the internal Docker network; browsers use the page origin for WebSockets, so you do not expose port 8025.

### 3. Application key

If PHP is **not** installed on the host:

```bash
docker compose run --rm --no-deps app php artisan key:generate --show
```

Paste the printed `base64:...` value into `APP_KEY` in `.env`.

If PHP **is** installed:

```bash
php artisan key:generate
```

`APP_KEY` must be set or the app container will refuse to start.

### 4. Build and start

```bash
docker compose up -d --build
```

First boot waits for MariaDB, runs migrations, then starts Nginx, PHP-FPM, Reverb, the queue worker, and phpMyAdmin. Check:

```bash
docker compose ps
docker compose logs -f app
```

### 5. Seed the admin user

```bash
docker compose exec app php artisan db:seed
```

Default login comes from `.env`: username `admin` and `SEED_ADMIN_PASSWORD`. Set `SEED_JUDGE_PASSWORD` for the seeded judge accounts. Change these after first login on a real host.

### 6. Open the app

`http://<VITE_NETWORK_URL>:8069` — for example `http://192.168.50.51:8069`.

Judges on the LAN should use that same URL. Live score updates share that origin (`ws://<host>:8069/app`); no extra websocket port is published.

### 7. phpMyAdmin

`http://<VITE_NETWORK_URL>:8081` — for example `http://192.168.50.51:8081`.

Log in with the MariaDB user from `.env`:

- App user: `DB_USERNAME` / `DB_PASSWORD` (default `tabulator`)
- Root: `root` / `DB_ROOT_PASSWORD`

The server field is pre-filled (`db`). Do not expose this port beyond the LAN.

### Useful commands

```bash
docker compose ps
docker compose logs -f
docker compose restart
docker compose down          # stop; keep database volume
docker compose down -v       # stop and delete MariaDB data
```

Data lives in the `mariadb_data` volume; logs in the `storage` volume.

---

## Local development (without Docker)

Needs PHP 8.2+, Composer, Node **22.13+**, and MariaDB already running.

```bash
git clone https://github.com/kimpoy31/hr_tabulator_v2.git
cd hr_tabulator_v2
composer install
npm install
cp .env.example .env
```

Point `.env` at your local/dev database (`DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`). For `composer run dev`, set `APP_ENV=local`, `APP_DEBUG=true`, and Reverb on **8025**:

```
REVERB_PORT=8025
REVERB_SERVER_PORT=8025
VITE_REVERB_PORT=8025
```

`php artisan serve` binds to `VITE_NETWORK_URL` / `APP_PORT` (override with `SERVER_HOST`).

```bash
php artisan key:generate
php artisan migrate --seed
composer run dev
```

That starts Laravel, Vite, and Reverb in [`@laravel/multiplex`](https://www.npmjs.com/package/@laravel/multiplex) (one tab per process). `php artisan dev` is the same command.

| Key | Action |
| --- | --- |
| `1`–`9` | Jump to a tab |
| `/` | Search (`n` / `N` for next / previous) |
| `r` | Restart the focused process |
| `c` | Clear that tab’s output |
| `s` / `t` | Stream mode / tabs |
| `q` | Quit |

Flags: `--stream`, `--inline`, `--timestamps`, `--no-restart`. Windows falls back to `concurrently`. The app URL follows `APP_URL` in `.env`.

---

## Troubleshooting

- **`Set DB_PASSWORD in .env` / `Set DB_ROOT_PASSWORD in .env`** — both must be non-empty before `docker compose up`.
- **`APP_KEY is not set`** — generate a key (step 3) and restart: `docker compose up -d`.
- **Port already in use** — stop `composer run dev` or anything else on 8069 / 8081, or change `APP_PORT` / `PHPMYADMIN_PORT`.
- **`@laravel/multiplex is not installed`** — local `composer run dev` needs Node **22.13+** (`nvm use` if you have `.nvmrc`); then `npm install` again.
- **Blank page / 502** — wait until `docker compose ps` shows `app` healthy; then `docker compose logs nginx app`.
- **WebSockets not updating scores** — open the app via the host IP/hostname in `APP_URL`, not `localhost`, if judges are on other machines.
