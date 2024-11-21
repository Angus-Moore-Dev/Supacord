

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "pgaudit";


ALTER SCHEMA "pgaudit" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgaudit" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."preferredLLMVendor" AS ENUM (
    'OpenAI',
    'Anthropic',
    'Self-Hosted'
);


ALTER TYPE "public"."preferredLLMVendor" OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."notebook_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "createdAt" timestamp with time zone DEFAULT "now"() NOT NULL,
    "notebookId" "uuid" NOT NULL,
    "userPrompt" "text" NOT NULL,
    "sqlQueries" "text"[] NOT NULL,
    "outputs" "jsonb"[] NOT NULL,
    "attachedMacroId" "uuid"
);


ALTER TABLE "public"."notebook_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notebooks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "createdAt" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title" "text" NOT NULL,
    "projectId" "uuid" NOT NULL
);


ALTER TABLE "public"."notebooks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "createdAt" timestamp with time zone DEFAULT "now"() NOT NULL,
    "firstName" "text" NOT NULL,
    "lastName" "text" NOT NULL,
    "country" "text" NOT NULL,
    "industry" "text",
    "purposeOfUse" "text",
    "openAIKey" "text",
    "anthropicKey" "text",
    "preferredLLMVendor" "public"."preferredLLMVendor" DEFAULT 'OpenAI'::"public"."preferredLLMVendor" NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "createdAt" timestamp with time zone DEFAULT "now"() NOT NULL,
    "profileId" "uuid" NOT NULL,
    "databaseName" "text" NOT NULL,
    "organisationId" "text" NOT NULL,
    "projectId" "text" NOT NULL,
    "databaseStructure" "jsonb"[] NOT NULL
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."supabase_access_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "createdAt" timestamp with time zone DEFAULT "now"() NOT NULL,
    "accessToken" "text" NOT NULL,
    "refreshToken" "text" NOT NULL,
    "accessTokenExpirationUTC" bigint NOT NULL,
    "profileId" "uuid" NOT NULL,
    "organisationId" "text" NOT NULL,
    "organisationName" "text" NOT NULL
);


ALTER TABLE "public"."supabase_access_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."supabase_oauth_auth_flow" (
    "state" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "createdAt" timestamp with time zone DEFAULT "now"() NOT NULL,
    "profileId" "uuid" NOT NULL,
    "requestingOrigin" "text" DEFAULT ''::"text" NOT NULL
);


ALTER TABLE "public"."supabase_oauth_auth_flow" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_macro_invocation_results" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "createdAt" timestamp with time zone DEFAULT "now"() NOT NULL,
    "macroId" "uuid" NOT NULL,
    "sqlQueries" "text"[] NOT NULL,
    "outputs" "jsonb"[] NOT NULL
);


ALTER TABLE "public"."user_macro_invocation_results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_macros" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "createdAt" timestamp with time zone DEFAULT "now"() NOT NULL,
    "profileId" "uuid" NOT NULL,
    "projectId" "uuid" NOT NULL,
    "macroTextPrompt" "text" NOT NULL,
    "storedSQLQueries" "text"[] NOT NULL
);


ALTER TABLE "public"."user_macros" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."waitlist_emails" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "createdAt" timestamp with time zone DEFAULT "now"() NOT NULL,
    "email" "text" NOT NULL,
    "location" "text" NOT NULL
);


ALTER TABLE "public"."waitlist_emails" OWNER TO "postgres";


ALTER TABLE ONLY "public"."notebook_entries"
    ADD CONSTRAINT "conversation_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notebooks"
    ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_macros"
    ADD CONSTRAINT "saved_user_macros_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."supabase_access_tokens"
    ADD CONSTRAINT "supabase_access_tokens_organisationId_key" UNIQUE ("organisationId");



ALTER TABLE ONLY "public"."supabase_access_tokens"
    ADD CONSTRAINT "supabase_access_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."supabase_oauth_auth_flow"
    ADD CONSTRAINT "supabase_oauth_auth_flow_pkey" PRIMARY KEY ("state");



ALTER TABLE ONLY "public"."user_macro_invocation_results"
    ADD CONSTRAINT "user_macro_invocation_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."waitlist_emails"
    ADD CONSTRAINT "waitlist_emails_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."waitlist_emails"
    ADD CONSTRAINT "waitlist_emails_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notebook_entries"
    ADD CONSTRAINT "conversation_messages_conversationId_fkey" FOREIGN KEY ("notebookId") REFERENCES "public"."notebooks"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notebooks"
    ADD CONSTRAINT "conversations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notebook_entries"
    ADD CONSTRAINT "notebook_entries_attachedMacroId_fkey" FOREIGN KEY ("attachedMacroId") REFERENCES "public"."user_macros"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_macros"
    ADD CONSTRAINT "saved_user_macros_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_macros"
    ADD CONSTRAINT "saved_user_macros_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."supabase_access_tokens"
    ADD CONSTRAINT "supabase_access_tokens_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."supabase_oauth_auth_flow"
    ADD CONSTRAINT "supabase_oauth_auth_flow_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_macro_invocation_results"
    ADD CONSTRAINT "user_macro_invocation_results_macroId_fkey" FOREIGN KEY ("macroId") REFERENCES "public"."user_macros"("id") ON UPDATE CASCADE ON DELETE CASCADE;



CREATE POLICY "Anyone can CRUD their own token stuff" ON "public"."supabase_access_tokens" TO "authenticated" USING (("auth"."uid"() = "profileId"));



CREATE POLICY "Anyone can create new forms" ON "public"."waitlist_emails" FOR INSERT WITH CHECK (true);



CREATE POLICY "People can CRUD their own details" ON "public"."profiles" TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "People can CRUD their own projects" ON "public"."projects" TO "authenticated" USING (("auth"."uid"() = "profileId"));



CREATE POLICY "People can select results from their macro invocations" ON "public"."user_macro_invocation_results" FOR SELECT TO "authenticated" USING (("auth"."uid"() IN ( SELECT "u"."profileId"
   FROM "public"."user_macros" "u"
  WHERE ("u"."id" = "user_macro_invocation_results"."macroId"))));



CREATE POLICY "Users can CRUD their own conversation messages" ON "public"."notebook_entries" TO "authenticated" USING (("auth"."uid"() IN ( SELECT "p"."profileId"
   FROM "public"."projects" "p"
  WHERE ("p"."id" IN ( SELECT "c"."projectId"
           FROM "public"."notebooks" "c"
          WHERE ("c"."id" = "notebook_entries"."notebookId"))))));



CREATE POLICY "Users can CRUD their own conversations" ON "public"."notebooks" TO "authenticated" USING (("auth"."uid"() IN ( SELECT "p"."profileId"
   FROM "public"."projects" "p"
  WHERE ("p"."id" = "notebooks"."projectId"))));



CREATE POLICY "Users can CRUD their own macros" ON "public"."user_macros" TO "authenticated" USING (("auth"."uid"() = "profileId"));



ALTER TABLE "public"."notebook_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notebooks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."supabase_access_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."supabase_oauth_auth_flow" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_macro_invocation_results" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_macros" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."waitlist_emails" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."notebook_entries";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."notebooks";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."user_macro_invocation_results";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";









































































































































































































GRANT ALL ON TABLE "public"."notebook_entries" TO "anon";
GRANT ALL ON TABLE "public"."notebook_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."notebook_entries" TO "service_role";



GRANT ALL ON TABLE "public"."notebooks" TO "anon";
GRANT ALL ON TABLE "public"."notebooks" TO "authenticated";
GRANT ALL ON TABLE "public"."notebooks" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."supabase_access_tokens" TO "anon";
GRANT ALL ON TABLE "public"."supabase_access_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."supabase_access_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."supabase_oauth_auth_flow" TO "anon";
GRANT ALL ON TABLE "public"."supabase_oauth_auth_flow" TO "authenticated";
GRANT ALL ON TABLE "public"."supabase_oauth_auth_flow" TO "service_role";



GRANT ALL ON TABLE "public"."user_macro_invocation_results" TO "anon";
GRANT ALL ON TABLE "public"."user_macro_invocation_results" TO "authenticated";
GRANT ALL ON TABLE "public"."user_macro_invocation_results" TO "service_role";



GRANT ALL ON TABLE "public"."user_macros" TO "anon";
GRANT ALL ON TABLE "public"."user_macros" TO "authenticated";
GRANT ALL ON TABLE "public"."user_macros" TO "service_role";



GRANT ALL ON TABLE "public"."waitlist_emails" TO "anon";
GRANT ALL ON TABLE "public"."waitlist_emails" TO "authenticated";
GRANT ALL ON TABLE "public"."waitlist_emails" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
