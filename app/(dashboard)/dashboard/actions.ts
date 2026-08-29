'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { generateApiKey } from '@/lib/apiAuth';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export type CreateProjectState = { error: string | null };

export async function createProject(
  _prev: CreateProjectState,
  formData: FormData,
): Promise<CreateProjectState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const name = String(formData.get('name') ?? '').trim();
  const appName = String(formData.get('app_name') ?? '').trim();
  if (!name || !appName) {
    return { error: 'Project name and "sends as" name are both required.' };
  }

  const { data: project, error } = await supabase
    .from('projects')
    .insert({ owner_id: user.id, name, app_name: appName })
    .select('id')
    .single();

  if (error || !project) {
    return { error: error?.message ?? 'Could not create the project — please try again.' };
  }

  revalidatePath('/dashboard');
  redirect(`/dashboard/projects/${project.id}`);
}

export type UpdateSenderState = { error: string | null; success: boolean };

const SENDER_ADDRESS_PATTERN = /^[a-z0-9]([a-z0-9._-]{0,62}[a-z0-9])?$/;

export async function updateSenderAddress(
  projectId: string,
  _prev: UpdateSenderState,
  formData: FormData,
): Promise<UpdateSenderState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const raw = String(formData.get('sender_address') ?? '').trim().toLowerCase();
  const senderAddress = raw === '' ? null : raw;

  if (senderAddress && !SENDER_ADDRESS_PATTERN.test(senderAddress)) {
    return {
      error: 'Use only lowercase letters, numbers, dots, hyphens, or underscores.',
      success: false,
    };
  }

  const { error } = await supabase.from('projects').update({ sender_address: senderAddress }).eq('id', projectId);
  if (error) return { error: error.message, success: false };

  revalidatePath(`/dashboard/projects/${projectId}`);
  return { error: null, success: true };
}

export type CreateKeyState = { rawKey: string | null; error: string | null };

export async function createApiKey(
  projectId: string,
  _prev: CreateKeyState,
  formData: FormData,
): Promise<CreateKeyState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const name = String(formData.get('name') ?? '').trim() || 'API key';
  const { raw, hash, displayPrefix } = generateApiKey();

  // api_keys has a full RLS policy (see migration 002), so the RLS-scoped client
  // can insert directly — it fails closed if projectId isn't owned by this user.
  const { error } = await supabase.from('api_keys').insert({
    project_id: projectId,
    name,
    key_hash: hash,
    key_prefix: displayPrefix,
  });

  if (error) return { rawKey: null, error: error.message };

  revalidatePath(`/dashboard/projects/${projectId}`);
  return { rawKey: raw, error: null };
}

export async function revokeApiKey(formData: FormData) {
  const supabase = await createClient();
  const keyId = String(formData.get('key_id'));
  const projectId = String(formData.get('project_id'));

  await supabase.from('api_keys').update({ revoked_at: new Date().toISOString() }).eq('id', keyId);
  revalidatePath(`/dashboard/projects/${projectId}`);
}

/**
 * email_jobs has no RLS write policy (writes normally go through the API-key
 * authenticated routes only — see migration 002), so dashboard job actions
 * verify project ownership through the RLS-scoped client first, then perform
 * the write with the service-role client, filtered by that same project_id.
 */
async function assertOwnsProject(projectId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: project } = await supabase.from('projects').select('id').eq('id', projectId).maybeSingle();
  if (!project) redirect('/login');
}

export async function toggleJobStatus(formData: FormData) {
  const jobId = String(formData.get('job_id'));
  const projectId = String(formData.get('project_id'));
  const nextStatus = String(formData.get('next_status'));

  await assertOwnsProject(projectId);
  await supabaseAdmin.from('email_jobs').update({ status: nextStatus }).eq('id', jobId).eq('project_id', projectId);
  revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function deleteJob(formData: FormData) {
  const jobId = String(formData.get('job_id'));
  const projectId = String(formData.get('project_id'));

  await assertOwnsProject(projectId);
  await supabaseAdmin.from('email_jobs').delete().eq('id', jobId).eq('project_id', projectId);
  revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
