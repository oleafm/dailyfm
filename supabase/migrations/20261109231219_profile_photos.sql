begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-photos', 'profile-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

create policy "Read own profile photo"
on storage.objects for select to authenticated
using (bucket_id = 'profile-photos' and name = (select auth.uid())::text || '/profile');

create policy "Upload own profile photo"
on storage.objects for insert to authenticated
with check (bucket_id = 'profile-photos' and name = (select auth.uid())::text || '/profile');

create policy "Replace own profile photo"
on storage.objects for update to authenticated
using (bucket_id = 'profile-photos' and name = (select auth.uid())::text || '/profile')
with check (bucket_id = 'profile-photos' and name = (select auth.uid())::text || '/profile');

commit;
