import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // 1. Trouver les jobs expirés qui ont encore un storage_path
  const { data: expiredJobs, error: fetchError } = await supabase
    .from('export_jobs')
    .select('id, storage_path')
    .lt('expires_at', new Date().toISOString())
    .not('storage_path', 'is', null)
    .neq('status', 'expired')

  if (fetchError) {
    return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 })
  }

  if (!expiredJobs || expiredJobs.length === 0) {
    return new Response(JSON.stringify({ message: "No expired jobs to clean" }), { status: 200 })
  }

  const pathsToDelete = expiredJobs.map(j => j.storage_path).filter(Boolean) as string[]

  // 2. Supprimer les fichiers de Storage
  const { error: storageError } = await supabase.storage
    .from('documents')
    .remove(pathsToDelete)

  if (storageError) {
    console.error("Storage deletion error:", storageError)
  }

  // 3. Mettre à jour le statut dans la DB
  const { error: updateError } = await supabase
    .from('export_jobs')
    .update({ status: 'expired', storage_path: null })
    .in('id', expiredJobs.map(j => j.id))

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ 
    message: `Cleaned up ${expiredJobs.length} exports`,
    deleted_files: pathsToDelete.length
  }), { status: 200 })
})

