# Running on a server

- make sure apache/nginx is running
- make a rule for the directory in nginx/apache
- make a rule for the staging folder in systemd so it starts as a service
- chmod +x on index.js in staging/
- copy node shabang onto index.js in staging/
- profit

# Setup

- ensure mariadb, node, and, npm are installed
- create a mariadb user with read and write on a new database
- run npm install in the project directory
- create a .env file with the following:
 ```sh
DB_HOST=<mariadb IP>
DB_USER=<mariadb username>
DB_PASSWORD=<mariadb users password>
DB_NAME=<mariadb database name>
DB_CHARSET=utf8mb4
DB_PORT=<mariadb port (probably 3306)>

REVIEWER_PLUS_MASTER_API_KEY=<a master api key for the admin user>

REVIEWER_PLUS_BACKUP_DIR=<a backup path for database .json snapshots>
REVIEWER_PLUS_IMG_DIR=<a image path for stored images>

REVIEWER_PLUS_REGISTRATION_ENABLED=<true or false>

REVIEWER_PLUS_IGDB_CLIENT_ID=<IGDB api client key>
REVIEWER_PLUS_IGDB_SECRET_ID=<IGDB api secret key>

REVIEWER_PLUS_TMDB_READ_ACCESS_TOKEN=<TMDB api key>
 
 ```
- run ``npm install``
- run ``npm run dev`` or ``npm run build``
- profit

# Tech stack
- mariadb
- node
- svelte kit
- tailwind
- skeleton ui

# create-svelte

Everything you need to build a Svelte project, powered by [`create-svelte`](https://github.com/sveltejs/kit/tree/main/packages/create-svelte).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```bash
# create a new project in the current directory
npm create svelte@latest

# create a new project in my-app
npm create svelte@latest my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.
