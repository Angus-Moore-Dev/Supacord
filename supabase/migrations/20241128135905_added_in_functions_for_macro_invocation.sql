alter table "public"."notebook_entries" drop constraint "notebook_entries_attachedMacroId_fkey";

alter table "public"."notebook_entries" drop column "attachedMacroId";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_macros_due_for_invocation()
 RETURNS TABLE("like" user_macros)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    WITH last_invocations AS (
        -- Get the most recent invocation for each macro
        SELECT 
            "macroId",
            MAX("createdAt") as last_invoked_at
        FROM user_macro_invocation_results
        GROUP BY "macroId"
    ),
    polling_intervals AS (
        -- Calculate the total polling interval in seconds
        SELECT 
            um.id,
            COALESCE(
                (COALESCE((um."pollingRate"->>'days')::integer, 0) * 86400) +
                (COALESCE((um."pollingRate"->>'hours')::integer, 0) * 3600) +
                (COALESCE((um."pollingRate"->>'minutes')::integer, 0) * 60) +
                COALESCE((um."pollingRate"->>'seconds')::integer, 0),
                0
            ) as polling_interval_seconds
        FROM user_macros um
        WHERE um."isAutonomouslyActive" = true
    )
    SELECT um.*
    FROM user_macros um
    LEFT JOIN last_invocations li ON li."macroId" = um.id
    LEFT JOIN polling_intervals pi ON pi.id = um.id
    WHERE 
        um."isAutonomouslyActive" = true
        AND (
            -- Include macros that have never been invoked
            li."macroId" IS NULL
            OR
            -- Include macros where enough time has passed since last invocation
            EXTRACT(EPOCH FROM (NOW() - li.last_invoked_at)) >= pi.polling_interval_seconds
        );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.send_macros_for_invocation()
 RETURNS TABLE(request_id bigint)
 LANGUAGE plpgsql
AS $function$
DECLARE
    macro_array jsonb;
BEGIN
    -- Get the macros and convert them to a JSONB array
    SELECT jsonb_agg(to_jsonb(m.*))
    FROM get_macros_due_for_invocation() m
    INTO macro_array;

    -- Only proceed if we have macros to send
    IF macro_array IS NOT NULL AND jsonb_array_length(macro_array) > 0 THEN
        RETURN QUERY
        SELECT net.http_post(
            url := 'https://rihzzgzyrfvczehemtsw.supabase.co/functions/v1/macro_computation',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer supalytics_8144b465-ebfb-41be-913b-fbd2de78e801'
            ),
            body := macro_array,
            timeout_milliseconds := 5000
        ) as request_id;
    END IF;
END;
$function$
;



