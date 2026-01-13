import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Retention periods in days
const RETENTION_PERIODS = {
  rejected_resume: 90, // 90 days for rejected candidates
  payment_slip: 365, // 12 months for payment slips (legal retention)
};

interface LeadToCleanup {
  id: string;
  status: string;
  resume_url: string | null;
  payment_slip_url: string | null;
  updated_at: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting file cleanup job...');

    const now = new Date();
    let deletedCount = 0;
    const errors: string[] = [];

    // 1. Clean up resumes for rejected candidates older than 90 days
    const rejectedCutoff = new Date(now.getTime() - RETENTION_PERIODS.rejected_resume * 24 * 60 * 60 * 1000);
    const rejectedStatuses = ['rejected', 'not_interested', 'not_interested_paid', 'different_domain'];

    console.log(`Looking for rejected leads older than ${rejectedCutoff.toISOString()}`);

    const { data: rejectedLeads, error: rejectedError } = await supabase
      .from('leads')
      .select('id, status, resume_url, updated_at')
      .in('status', rejectedStatuses)
      .not('resume_url', 'is', null)
      .lt('updated_at', rejectedCutoff.toISOString());

    if (rejectedError) {
      console.error('Error fetching rejected leads:', rejectedError);
      errors.push(`Rejected leads fetch error: ${rejectedError.message}`);
    } else if (rejectedLeads && rejectedLeads.length > 0) {
      console.log(`Found ${rejectedLeads.length} rejected leads with resumes to clean up`);

      for (const lead of rejectedLeads) {
        try {
          const resumePath = lead.resume_url;
          if (!resumePath) continue;

          // Parse stored path format "bucket:path"
          const [bucket, ...pathParts] = resumePath.split(':');
          const path = pathParts.join(':');

          if (bucket && path) {
            // Delete the file from storage
            const { error: deleteError } = await supabase.storage
              .from(bucket)
              .remove([path]);

            if (deleteError) {
              console.error(`Error deleting resume for lead ${lead.id}:`, deleteError);
              errors.push(`Resume delete error for ${lead.id}: ${deleteError.message}`);
            } else {
              // Clear the resume_url in the database
              const { error: updateError } = await supabase
                .from('leads')
                .update({ resume_url: null })
                .eq('id', lead.id);

              if (updateError) {
                console.error(`Error updating lead ${lead.id}:`, updateError);
                errors.push(`Lead update error for ${lead.id}: ${updateError.message}`);
              } else {
                console.log(`Deleted resume for rejected lead ${lead.id}`);
                deletedCount++;
              }
            }
          }
        } catch (e: unknown) {
          const errorMessage = e instanceof Error ? e.message : String(e);
          console.error(`Error processing lead ${lead.id}:`, e);
          errors.push(`Processing error for ${lead.id}: ${errorMessage}`);
        }
      }
    } else {
      console.log('No rejected leads with resumes to clean up');
    }

    // 2. Clean up old payment slips (older than 12 months)
    const paymentSlipCutoff = new Date(now.getTime() - RETENTION_PERIODS.payment_slip * 24 * 60 * 60 * 1000);
    
    console.log(`Looking for payment slips older than ${paymentSlipCutoff.toISOString()}`);

    const { data: oldPaymentLeads, error: paymentError } = await supabase
      .from('leads')
      .select('id, payment_slip_url, updated_at')
      .not('payment_slip_url', 'is', null)
      .lt('updated_at', paymentSlipCutoff.toISOString());

    if (paymentError) {
      console.error('Error fetching old payment slips:', paymentError);
      errors.push(`Payment slips fetch error: ${paymentError.message}`);
    } else if (oldPaymentLeads && oldPaymentLeads.length > 0) {
      console.log(`Found ${oldPaymentLeads.length} old payment slips to clean up`);

      for (const lead of oldPaymentLeads) {
        try {
          const paymentSlipPath = lead.payment_slip_url;
          if (!paymentSlipPath) continue;

          // Parse stored path format "bucket:path"
          const [bucket, ...pathParts] = paymentSlipPath.split(':');
          const path = pathParts.join(':');

          if (bucket && path) {
            // Delete the file from storage
            const { error: deleteError } = await supabase.storage
              .from(bucket)
              .remove([path]);

            if (deleteError) {
              console.error(`Error deleting payment slip for lead ${lead.id}:`, deleteError);
              errors.push(`Payment slip delete error for ${lead.id}: ${deleteError.message}`);
            } else {
              // Clear the payment_slip_url in the database
              const { error: updateError } = await supabase
                .from('leads')
                .update({ payment_slip_url: null })
                .eq('id', lead.id);

              if (updateError) {
                console.error(`Error updating lead ${lead.id}:`, updateError);
                errors.push(`Lead update error for ${lead.id}: ${updateError.message}`);
              } else {
                console.log(`Deleted payment slip for lead ${lead.id}`);
                deletedCount++;
              }
            }
          }
        } catch (e: unknown) {
          const errorMessage = e instanceof Error ? e.message : String(e);
          console.error(`Error processing payment slip for lead ${lead.id}:`, e);
          errors.push(`Processing error for ${lead.id}: ${errorMessage}`);
        }
      }
    } else {
      console.log('No old payment slips to clean up');
    }

    console.log(`Cleanup complete. Deleted ${deletedCount} files. Errors: ${errors.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Cleanup complete`,
        deletedCount,
        errors: errors.length > 0 ? errors : undefined,
        timestamp: now.toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Cleanup job failed:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
