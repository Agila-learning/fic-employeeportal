import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date().toISOString().split("T")[0];

    // Check if today is Sunday (0 = Sunday)
    const dayOfWeek = new Date().getDay();
    if (dayOfWeek === 0) {
      return new Response(
        JSON.stringify({ message: "Skipped: Sunday" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if today is a holiday
    const { data: holiday } = await supabase
      .from("holidays")
      .select("id")
      .eq("date", today)
      .maybeSingle();

    if (holiday) {
      return new Response(
        JSON.stringify({ message: "Skipped: Holiday" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all active employees
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("is_active", true);

    if (profilesError) throw profilesError;

    // Get all attendance records for today
    const { data: todayAttendance, error: attendanceError } = await supabase
      .from("attendance")
      .select("user_id")
      .eq("date", today);

    if (attendanceError) throw attendanceError;

    const markedUserIds = new Set(todayAttendance?.map((a) => a.user_id) || []);

    // Find employees who haven't marked attendance
    const unmarkedEmployees = (profiles || []).filter(
      (p) => !markedUserIds.has(p.user_id)
    );

    if (unmarkedEmployees.length === 0) {
      return new Response(
        JSON.stringify({ message: "All employees have marked attendance", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert absent records for unmarked employees
    const absentRecords = unmarkedEmployees.map((emp) => ({
      user_id: emp.user_id,
      status: "absent",
      date: today,
      leave_reason: "Failed to mark attendance",
      half_day: false,
      location_verified: false,
    }));

    const { error: insertError } = await supabase
      .from("attendance")
      .insert(absentRecords);

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({
        message: `Auto-marked ${unmarkedEmployees.length} employee(s) as absent`,
        count: unmarkedEmployees.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
