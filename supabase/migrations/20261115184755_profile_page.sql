-- Profile page support:
--   1. Users can delete their own account.
--   2. Users can see the files in their own storage folders, which Supabase
--      Storage requires before it lets them delete those files.
--
-- Safe to run more than once.

-- 1. Delete my account ---------------------------------------------------
-- The browser can't delete from auth.users directly, so this function does it
-- for the logged-in user only. SECURITY DEFINER runs it with the owner's
-- rights; the auth.uid() check means it can only ever delete the caller.
-- Deleting auth.users cascades to public.users, and from there to their
-- listings, photos (rows), tags, conversations, messages, offers, and saves.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Log in to delete your account.';
  end if;

  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- 2. Read own files ------------------------------------------------------
-- Uploading and public viewing already work. Removing a file (old avatar,
-- deleted listing photo) also needs SELECT on the file, which nobody had.
-- Same folder rule as the existing upload/update/delete policies.

drop policy if exists "Users read their own files" on storage.objects;
create policy "Users read their own files" on storage.objects
  for select
  to authenticated
  using (
    bucket_id = any (array['listing-images', 'avatars'])
    and (storage.foldername(name))[1] = auth.uid()::text
  );
