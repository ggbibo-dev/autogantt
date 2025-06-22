### Setup with your database

## 1. Create a `.env` file
Create a `.env` file in the project root and add your Postgres connection string:

```
DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<database>"
```

## 2. Generate and Apply Migrations
Use Drizzle Kit to generate and apply database migrations:

```
npx drizzle-kit generate
npx drizzle-kit push
```

- `generate` will create migration files based on your schema in `db/schema.ts`.
- `push` will apply those migrations to your database.

## 3. Check Your Database
Verify that the tables have been created in your database using your preferred database client or dashboard.

## 4. Start the App
Run the app with:

```
npm start
```

---

**Troubleshooting:**
- If you see authentication errors, check your connection string and Postgres user permissions.
- For more details, see the Drizzle Kit documentation: https://orm.drizzle.team/kit-docs
