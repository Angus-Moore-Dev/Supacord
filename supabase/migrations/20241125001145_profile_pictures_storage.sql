create policy "Users can create new photos under their folder yoj3ru_0"
on "storage"."objects"
as permissive
for insert
to authenticated
with check (((bucket_id = 'profile.pictures'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));


create policy "Users can create new photos under their folder yoj3ru_1"
on "storage"."objects"
as permissive
for update
to authenticated
using (((bucket_id = 'profile.pictures'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));


create policy "Users can create new photos under their folder yoj3ru_2"
on "storage"."objects"
as permissive
for delete
to authenticated
using (((bucket_id = 'profile.pictures'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));


create policy "Users can create new photos under their folder yoj3ru_3"
on "storage"."objects"
as permissive
for select
to authenticated
using (((bucket_id = 'profile.pictures'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));




