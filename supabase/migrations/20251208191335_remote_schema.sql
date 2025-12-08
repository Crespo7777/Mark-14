


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


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."character_folders_rows" (
    "id" "text",
    "table_id" "text",
    "name" "text",
    "created_at" timestamp with time zone
);


ALTER TABLE "public"."character_folders_rows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."characters_rows" (
    "id" "text",
    "table_id" "text",
    "player_id" "text",
    "name" "text",
    "data" "jsonb",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "is_shared" boolean,
    "shared_with_players" "jsonb",
    "is_archived" boolean,
    "folder_id" "text"
);


ALTER TABLE "public"."characters_rows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "table_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "is_master_roll" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."chat_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_messages_rows" (
    "id" "text",
    "table_id" "text",
    "user_id" "text",
    "message" "text",
    "message_type" "text",
    "created_at" timestamp with time zone,
    "recipient_id" "text"
);


ALTER TABLE "public"."chat_messages_rows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."journal_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "table_id" "uuid" NOT NULL,
    "creator_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "is_private" boolean DEFAULT false NOT NULL,
    "is_shared_with_players" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."journal_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."npc_folders_rows" (
    "id" "text",
    "table_id" "text",
    "name" "text",
    "created_at" timestamp with time zone
);


ALTER TABLE "public"."npc_folders_rows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."npcs_rows" (
    "id" "text",
    "table_id" "text",
    "name" "text",
    "data" "jsonb",
    "is_shared" boolean,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "shared_with_players" "jsonb",
    "is_archived" boolean,
    "grupo" "text",
    "folder_id" "text"
);


ALTER TABLE "public"."npcs_rows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "display_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles_rows" (
    "id" "text",
    "display_name" "text",
    "created_at" timestamp with time zone
);


ALTER TABLE "public"."profiles_rows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."table_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "table_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'player'::"text" NOT NULL,
    "is_helper" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."table_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."table_members_rows" (
    "id" "text",
    "table_id" "text",
    "user_id" "text",
    "joined_at" timestamp with time zone
);


ALTER TABLE "public"."table_members_rows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tables" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "master_id" "uuid" NOT NULL,
    "password" "text",
    "image_url" "text"
);


ALTER TABLE "public"."tables" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tables_rows" (
    "id" "text",
    "name" "text",
    "description" "text",
    "master_id" "text",
    "created_at" timestamp with time zone,
    "discord_webhook_url" "text"
);


ALTER TABLE "public"."tables_rows" OWNER TO "postgres";


ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."journal_entries"
    ADD CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."table_members"
    ADD CONSTRAINT "table_member_unique" UNIQUE ("table_id", "user_id");



ALTER TABLE ONLY "public"."table_members"
    ADD CONSTRAINT "table_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tables"
    ADD CONSTRAINT "tables_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "public"."tables"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."journal_entries"
    ADD CONSTRAINT "journal_entries_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."journal_entries"
    ADD CONSTRAINT "journal_entries_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "public"."tables"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."table_members"
    ADD CONSTRAINT "table_members_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "public"."tables"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."table_members"
    ADD CONSTRAINT "table_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tables"
    ADD CONSTRAINT "tables_master_id_fkey" FOREIGN KEY ("master_id") REFERENCES "auth"."users"("id");



CREATE POLICY "Journal entry read access" ON "public"."journal_entries" FOR SELECT USING (((( SELECT "tables"."master_id"
   FROM "public"."tables"
  WHERE ("tables"."id" = "journal_entries"."table_id")) = "auth"."uid"()) OR (("is_private" = false) AND ("is_shared_with_players" = true) AND (EXISTS ( SELECT 1
   FROM "public"."table_members"
  WHERE (("table_members"."table_id" = "journal_entries"."table_id") AND ("table_members"."user_id" = "auth"."uid"()))))) OR ("creator_id" = "auth"."uid"())));



CREATE POLICY "Master and Creator can modify journal entries" ON "public"."journal_entries" FOR UPDATE USING (((( SELECT "tables"."master_id"
   FROM "public"."tables"
  WHERE ("tables"."id" = "journal_entries"."table_id")) = "auth"."uid"()) OR ("creator_id" = "auth"."uid"())));



CREATE POLICY "Master and players can insert journal entries" ON "public"."journal_entries" FOR INSERT WITH CHECK (((( SELECT "tables"."master_id"
   FROM "public"."tables"
  WHERE ("tables"."id" = "journal_entries"."table_id")) = "auth"."uid"()) OR (("creator_id" = "auth"."uid"()) AND ("is_private" = true))));



CREATE POLICY "Members can insert chat messages" ON "public"."chat_messages" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."table_members"
  WHERE (("table_members"."table_id" = "chat_messages"."table_id") AND ("table_members"."user_id" = "auth"."uid"())))));



CREATE POLICY "Members can view chat messages" ON "public"."chat_messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."table_members"
  WHERE (("table_members"."table_id" = "chat_messages"."table_id") AND ("table_members"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."character_folders_rows" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."characters_rows" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_messages_rows" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."journal_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."npc_folders_rows" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."npcs_rows" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles_rows" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."table_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."table_members_rows" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tables" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tables_rows" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";


















GRANT ALL ON TABLE "public"."character_folders_rows" TO "anon";
GRANT ALL ON TABLE "public"."character_folders_rows" TO "authenticated";
GRANT ALL ON TABLE "public"."character_folders_rows" TO "service_role";



GRANT ALL ON TABLE "public"."characters_rows" TO "anon";
GRANT ALL ON TABLE "public"."characters_rows" TO "authenticated";
GRANT ALL ON TABLE "public"."characters_rows" TO "service_role";



GRANT ALL ON TABLE "public"."chat_messages" TO "anon";
GRANT ALL ON TABLE "public"."chat_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_messages" TO "service_role";



GRANT ALL ON TABLE "public"."chat_messages_rows" TO "anon";
GRANT ALL ON TABLE "public"."chat_messages_rows" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_messages_rows" TO "service_role";



GRANT ALL ON TABLE "public"."journal_entries" TO "anon";
GRANT ALL ON TABLE "public"."journal_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."journal_entries" TO "service_role";



GRANT ALL ON TABLE "public"."npc_folders_rows" TO "anon";
GRANT ALL ON TABLE "public"."npc_folders_rows" TO "authenticated";
GRANT ALL ON TABLE "public"."npc_folders_rows" TO "service_role";



GRANT ALL ON TABLE "public"."npcs_rows" TO "anon";
GRANT ALL ON TABLE "public"."npcs_rows" TO "authenticated";
GRANT ALL ON TABLE "public"."npcs_rows" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."profiles_rows" TO "anon";
GRANT ALL ON TABLE "public"."profiles_rows" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles_rows" TO "service_role";



GRANT ALL ON TABLE "public"."table_members" TO "anon";
GRANT ALL ON TABLE "public"."table_members" TO "authenticated";
GRANT ALL ON TABLE "public"."table_members" TO "service_role";



GRANT ALL ON TABLE "public"."table_members_rows" TO "anon";
GRANT ALL ON TABLE "public"."table_members_rows" TO "authenticated";
GRANT ALL ON TABLE "public"."table_members_rows" TO "service_role";



GRANT ALL ON TABLE "public"."tables" TO "anon";
GRANT ALL ON TABLE "public"."tables" TO "authenticated";
GRANT ALL ON TABLE "public"."tables" TO "service_role";



GRANT ALL ON TABLE "public"."tables_rows" TO "anon";
GRANT ALL ON TABLE "public"."tables_rows" TO "authenticated";
GRANT ALL ON TABLE "public"."tables_rows" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "Allow authenticated user to delete"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'campaign-images'::text) AND (auth.uid() = owner)));



  create policy "Allow authenticated user to insert"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'campaign-images'::text) AND (auth.uid() = owner)));



  create policy "Allow authenticated user to update"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'campaign-images'::text) AND (auth.uid() = owner)));



  create policy "Allow public read access"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'campaign-images'::text));



  create policy "Allow select 12l5bla_0"
  on "storage"."objects"
  as permissive
  for select
  to anon, authenticated
using ((bucket_id = 'item_icons'::text));



  create policy "allow insert 12l5bla_0"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'item_icons'::text));



