alter table "public"."profiles" add column "profilePictureURL" text not null default ''::text;

alter table "public"."user_macros" add column "title" text not null;

alter table "public"."user_macros" alter column "pollingRate" drop default;

alter table "public"."user_macros" alter column "pollingRate" set data type jsonb using "pollingRate"::jsonb;



