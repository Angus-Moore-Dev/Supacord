alter table "public"."user_macros" drop column "macroTextPrompt";

alter table "public"."user_macros" drop column "storedSQLQueries";

alter table "public"."user_macros" add column "isAutonomouslyActive" boolean not null default false;

alter table "public"."user_macros" add column "pollingRate" text not null default ''::text;

alter table "public"."user_macros" add column "queryData" jsonb not null default '[]'::jsonb;

alter table "public"."user_macros" add column "textPrompt" text not null;



