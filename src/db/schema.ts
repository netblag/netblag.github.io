import { bigserial, boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Local mirror of the production Supabase table `public.messages`.
 *
 * Source of truth: supabase/schema.sql
 *   id         bigint generated always as identity primary key
 *   name       text not null (1..80 chars, enforced in app + RLS with check)
 *   message    text not null (1..2000 chars, enforced in app + RLS with check)
 *   read       boolean not null default false
 *   created_at timestamptz not null default now()
 *
 * NOTE: there is intentionally NO email / subject column. The public contact
 * form only ever writes { name, message } so the two schemas stay compatible.
 */
export const messages = pgTable(
  "messages",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    name: text("name").notNull(),
    message: text("message").notNull(),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("messages_created_at_idx").on(table.createdAt)],
);

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
