import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  getCurrentLocation, 
  isWithinLocation, 
  getMinDistanceFromLocation, 
  OFFICE_LOCATIONS,
  WorkLocation 
} from '@/utils/geolocation';

export type AttendanceStatus = 'present' | 'absent' | 'half_day';

export interface Attendance {
  id: string;
  user_id: string;
  date: string;
  status: 'present' | 'absent';
  marked_at: string;
  leave_reason?: string | null;
  user_name?: string;
  half_day?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  location_verified?: boolean;
  work_location?: WorkLocation | null;
}

export interface AttendanceSummary {
  totalPresent: number;
  totalAbsent: number;
  totalHalfDays: number;
  currentMonthPresent: number;
  currentMonthAbsent: number;
  currentMonthHalfDays: number;
}

export const useAttendance = () => {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [myAttendance, setMyAttendance] = useState<Attendance[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary>({
    totalPresent: 0,
    totalAbsent: 0,
    totalHalfDays: 0,
    currentMonthPresent: 0,
    currentMonthAbsent: 0,
    currentMonthHalfDays: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAttendance = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      // For admin, fetch all attendance
      if (user.role === 'admin') {
        const { data, error } = await supabase
          .from('attendance')
          .select('*')
          .order('date', { ascending: false });

        if (error) throw error;

        // Fetch user names
        const userIds = [...new Set(data?.map(a => a.user_id) || [])];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, name')
          .in('user_id', userIds);

        const attendanceWithNames = data?.map(a => ({
          ...a,
          status: a.status as 'present' | 'absent',
          leave_reason: a.leave_reason,
          half_day: a.half_day ?? false,
          latitude: a.latitude,
          longitude: a.longitude,
          location_verified: a.location_verified,
          work_location: (a as any).work_location as WorkLocation | null,
          user_name: profiles?.find(p => p.user_id === a.user_id)?.name || 'Unknown'
        })) || [];

        setAttendance(attendanceWithNames);
      }

      // Fetch employee's own attendance history
      const { data: myData, error: myError } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (!myError && myData) {
        const myAttendanceData = myData.map(a => ({
          ...a,
          status: a.status as 'present' | 'absent',
          half_day: a.half_day ?? false,
          work_location: (a as any).work_location as WorkLocation | null
        }));
        setMyAttendance(myAttendanceData);

        // Calculate summary
        const totalPresent = myAttendanceData.filter(a => a.status === 'present' && !a.half_day).length;
        const totalAbsent = myAttendanceData.filter(a => a.status === 'absent').length;
        const totalHalfDays = myAttendanceData.filter(a => a.half_day === true).length;
        
        const currentMonthAttendance = myAttendanceData.filter(a => {
          const date = new Date(a.date);
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });
        
        const currentMonthPresent = currentMonthAttendance.filter(a => a.status === 'present' && !a.half_day).length;
        const currentMonthAbsent = currentMonthAttendance.filter(a => a.status === 'absent').length;
        const currentMonthHalfDays = currentMonthAttendance.filter(a => a.half_day === true).length;

        setAttendanceSummary({
          totalPresent,
          totalAbsent,
          totalHalfDays,
          currentMonthPresent,
          currentMonthAbsent,
          currentMonthHalfDays
        });
      }

      // Check if user has marked attendance today
      const { data: todayData, error: todayError } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (!todayError && todayData) {
        setTodayAttendance({
          ...todayData,
          status: todayData.status as 'present' | 'absent',
          work_location: (todayData as any).work_location as WorkLocation | null
        });
      } else {
        setTodayAttendance(null);
      }
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (
    status: 'present' | 'absent', 
    leaveReason?: string,
    workLocation?: WorkLocation,
    isHalfDay?: boolean,
    facePhotoData?: string
  ) => {
    if (!user) return { error: new Error('Not authenticated'), locationError: false };

    // Check if it's past 10:30 AM
    const now = new Date();
    const cutoffHour = 10;
    const cutoffMinute = 30;
    
    if (now.getHours() > cutoffHour || (now.getHours() === cutoffHour && now.getMinutes() >= cutoffMinute)) {
      toast({ 
        title: "Attendance window closed",
        description: "Attendance can only be marked before 10:30 AM",
        variant: "destructive"
      });
      return { error: new Error('Attendance window closed'), locationError: false };
    }

    // Check if already marked
    if (todayAttendance) {
      toast({ 
        title: 'Already Marked', 
        description: 'You have already marked your attendance for today', 
        variant: 'destructive' 
      });
      return { error: new Error('Already marked'), locationError: false };
    }

    // Require leave reason for absent status
    if (status === 'absent' && !leaveReason?.trim()) {
      toast({ 
        title: 'Reason Required', 
        description: 'Please provide a reason for leave', 
        variant: 'destructive' 
      });
      return { error: new Error('Leave reason required'), locationError: false };
    }

    // Require work location for present status only (not half-day or absent)
    if (status === 'present' && !isHalfDay && !workLocation) {
      toast({ 
        title: 'Location Required', 
        description: 'Please select your work location', 
        variant: 'destructive' 
      });
      return { error: new Error('Work location required'), locationError: false };
    }

    // Require face photo for present status only (not half-day or absent)
    if (status === 'present' && !isHalfDay && !facePhotoData) {
      toast({ 
        title: 'Face Photo Required', 
        description: 'Please capture your face photo', 
        variant: 'destructive' 
      });
      return { error: new Error('Face photo required'), locationError: false };
    }

    // For present/half-day status, verify GPS location if required
    let latitude: number | undefined;
    let longitude: number | undefined;
    let locationVerified = false;

    if (status === 'present' && !isHalfDay && workLocation) {
      const selectedLocation = OFFICE_LOCATIONS[workLocation];
      
      if (selectedLocation.requiresGPS) {
        toast({ 
          title: 'Checking Location', 
          description: `Verifying you are at ${selectedLocation.name}...` 
        });

        const locationResult = await getCurrentLocation();
        
        if (!locationResult.success) {
          toast({ 
            title: 'Location Required', 
            description: locationResult.error || 'Please enable location access to mark attendance', 
            variant: 'destructive' 
          });
          return { error: new Error(locationResult.error || 'Location access required'), locationError: true };
        }

        const isWithin = isWithinLocation(locationResult.latitude!, locationResult.longitude!, selectedLocation);
        
        if (!isWithin) {
          const { distance, closestPoint, allowedRadius } = getMinDistanceFromLocation(
            locationResult.latitude!, 
            locationResult.longitude!, 
            selectedLocation
          );
          toast({ 
            title: 'Outside Office Premises', 
            description: `You are ${Math.round(distance)}m away from nearest office (${closestPoint.split(',')[0]}). Must be within ${allowedRadius}m. Your coordinates: ${locationResult.latitude?.toFixed(6)}, ${locationResult.longitude?.toFixed(6)}`, 
            variant: 'destructive' 
          });
          return { error: new Error('Outside office premises'), locationError: true };
        }

        latitude = locationResult.latitude;
        longitude = locationResult.longitude;
        locationVerified = true;
      } else {
        // No GPS required for this location
        locationVerified = true;
      }
    }

    // Upload face photo if provided
    let facePhotoUrl: string | null = null;
    if (facePhotoData && status === 'present' && !isHalfDay) {
      try {
        // Convert base64 to blob
        const base64Data = facePhotoData.split(',')[1];
        const binaryData = atob(base64Data);
        const bytes = new Uint8Array(binaryData.length);
        for (let i = 0; i < binaryData.length; i++) {
          bytes[i] = binaryData.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'image/jpeg' });
        
        // Upload to storage
        const fileName = `${user.id}/${new Date().toISOString().split('T')[0]}_${Date.now()}.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('attendance-faces')
          .upload(fileName, blob, { contentType: 'image/jpeg' });
        
        if (uploadError) {
          console.error('Face photo upload error:', uploadError);
          toast({ 
            title: 'Photo Upload Failed', 
            description: 'Could not upload face photo. Please try again.', 
            variant: 'destructive' 
          });
          return { error: uploadError, locationError: false };
        }
        
        facePhotoUrl = uploadData.path;
      } catch (uploadErr) {
        console.error('Face photo processing error:', uploadErr);
        toast({ 
          title: 'Photo Processing Failed', 
          description: 'Could not process face photo. Please try again.', 
          variant: 'destructive' 
        });
        return { error: new Error('Photo processing failed'), locationError: false };
      }
    }

    const { error } = await supabase.from('attendance').insert({
      user_id: user.id,
      status,
      date: new Date().toISOString().split('T')[0],
      leave_reason: status === 'absent' ? leaveReason : null,
      latitude,
      longitude,
      location_verified: locationVerified,
      half_day: isHalfDay ?? false,
      work_location: workLocation || null,
      face_photo_url: facePhotoUrl
    } as any);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return { error, locationError: false };
    }

    const statusText = isHalfDay ? 'Half Day' : status;
    toast({ title: 'Success', description: `Attendance marked as ${statusText}` });
    fetchAttendance();
    return { error: null, locationError: false };
  };

  // Admin function to update attendance
  const updateAttendance = async (
    id: string, 
    status: 'present' | 'absent', 
    leaveReason?: string, 
    isHalfDay?: boolean,
    workLocation?: WorkLocation
  ) => {
    if (!user || user.role !== 'admin') {
      toast({ title: 'Error', description: 'Unauthorized', variant: 'destructive' });
      return { error: new Error('Unauthorized') };
    }

    // Require leave reason for absent status
    if (status === 'absent' && !leaveReason?.trim()) {
      toast({ 
        title: 'Reason Required', 
        description: 'Please provide a reason for leave', 
        variant: 'destructive' 
      });
      return { error: new Error('Leave reason required') };
    }

    const { error } = await supabase
      .from('attendance')
      .update({
        status,
        leave_reason: status === 'absent' ? leaveReason : null,
        half_day: isHalfDay ?? false,
        work_location: workLocation || null
      } as any)
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return { error };
    }

    toast({ title: 'Success', description: 'Attendance updated successfully' });
    fetchAttendance();
    return { error: null };
  };

  // Admin function to manually mark attendance for an employee (bypasses time restriction and location)
  const adminMarkAttendance = async (
    employeeId: string, 
    status: 'present' | 'absent', 
    date: string,
    leaveReason?: string,
    isHalfDay?: boolean,
    workLocation?: WorkLocation
  ) => {
    if (!user || user.role !== 'admin') {
      toast({ title: 'Error', description: 'Unauthorized', variant: 'destructive' });
      return { error: new Error('Unauthorized') };
    }

    // Require leave reason for absent status
    if (status === 'absent' && !leaveReason?.trim()) {
      toast({ 
        title: 'Reason Required', 
        description: 'Please provide a reason for leave', 
        variant: 'destructive' 
      });
      return { error: new Error('Leave reason required') };
    }

    // Check if attendance already exists for this employee on this date
    const { data: existing } = await supabase
      .from('attendance')
      .select('id')
      .eq('user_id', employeeId)
      .eq('date', date)
      .maybeSingle();

    if (existing) {
      // Update existing record
      const { error } = await supabase
        .from('attendance')
        .update({
          status,
          leave_reason: status === 'absent' ? leaveReason : null,
          half_day: isHalfDay ?? false,
          location_verified: false, // Admin marked, no GPS verification
          work_location: workLocation || null
        } as any)
        .eq('id', existing.id);

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return { error };
      }

      toast({ title: 'Success', description: 'Attendance updated successfully' });
    } else {
      // Create new record
      const { error } = await supabase.from('attendance').insert({
        user_id: employeeId,
        status,
        date,
        leave_reason: status === 'absent' ? leaveReason : null,
        half_day: isHalfDay ?? false,
        location_verified: false, // Admin marked, no GPS verification
        work_location: workLocation || null
      } as any);

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return { error };
      }

      toast({ title: 'Success', description: 'Attendance marked successfully' });
    }

    fetchAttendance();
    return { error: null };
  };

  const canMarkAttendance = () => {
    const now = new Date();
    const cutoffHour = 10;
    const cutoffMinute = 30;
    const isBeforeCutoff = now.getHours() < cutoffHour || 
      (now.getHours() === cutoffHour && now.getMinutes() < cutoffMinute);
    return isBeforeCutoff && !todayAttendance;
  };

  useEffect(() => {
    if (user) fetchAttendance();
  }, [user]);

  return { 
    attendance, 
    myAttendance,
    todayAttendance, 
    attendanceSummary,
    loading, 
    fetchAttendance, 
    markAttendance, 
    updateAttendance, 
    adminMarkAttendance,
    canMarkAttendance 
  };
};
