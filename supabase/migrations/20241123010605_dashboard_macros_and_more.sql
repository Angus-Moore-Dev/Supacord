create table "public"."dashboard_macros" (
    "id" uuid not null default gen_random_uuid(),
    "createdAt" timestamp with time zone not null default now(),
    "projectId" uuid not null,
    "macroId" uuid not null,
    "size" text not null
);


alter table "public"."dashboard_macros" enable row level security;

CREATE UNIQUE INDEX dashboard_macros_pkey ON public.dashboard_macros USING btree (id);

alter table "public"."dashboard_macros" add constraint "dashboard_macros_pkey" PRIMARY KEY using index "dashboard_macros_pkey";

alter table "public"."dashboard_macros" add constraint "dashboard_macros_macroId_fkey" FOREIGN KEY ("macroId") REFERENCES user_macros(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."dashboard_macros" validate constraint "dashboard_macros_macroId_fkey";

alter table "public"."dashboard_macros" add constraint "dashboard_macros_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES projects(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."dashboard_macros" validate constraint "dashboard_macros_projectId_fkey";

grant delete on table "public"."dashboard_macros" to "anon";

grant insert on table "public"."dashboard_macros" to "anon";

grant references on table "public"."dashboard_macros" to "anon";

grant select on table "public"."dashboard_macros" to "anon";

grant trigger on table "public"."dashboard_macros" to "anon";

grant truncate on table "public"."dashboard_macros" to "anon";

grant update on table "public"."dashboard_macros" to "anon";

grant delete on table "public"."dashboard_macros" to "authenticated";

grant insert on table "public"."dashboard_macros" to "authenticated";

grant references on table "public"."dashboard_macros" to "authenticated";

grant select on table "public"."dashboard_macros" to "authenticated";

grant trigger on table "public"."dashboard_macros" to "authenticated";

grant truncate on table "public"."dashboard_macros" to "authenticated";

grant update on table "public"."dashboard_macros" to "authenticated";

grant delete on table "public"."dashboard_macros" to "service_role";

grant insert on table "public"."dashboard_macros" to "service_role";

grant references on table "public"."dashboard_macros" to "service_role";

grant select on table "public"."dashboard_macros" to "service_role";

grant trigger on table "public"."dashboard_macros" to "service_role";

grant truncate on table "public"."dashboard_macros" to "service_role";

grant update on table "public"."dashboard_macros" to "service_role";



