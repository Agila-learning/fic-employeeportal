import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Navigation, Building2, Home, CheckCircle } from 'lucide-react';
import { Attendance } from '@/hooks/useAttendance';
import { OFFICE_LOCATIONS, getLocationDisplayName, WorkLocation } from '@/utils/geolocation';
import { cn } from '@/lib/utils';

interface AttendanceMapViewProps {
  attendance: Attendance[];
  selectedDate?: string;
}

const AttendanceMapView = ({ attendance, selectedDate }: AttendanceMapViewProps) => {
  const filteredAttendance = useMemo(() => {
    if (!selectedDate) return attendance;
    return attendance.filter(a => a.date === selectedDate);
  }, [attendance, selectedDate]);

  // Group by location
  const locationStats = useMemo(() => {
    const stats: Record<string, { count: number; employees: string[] }> = {
      krishnagiri: { count: 0, employees: [] },
      tirupattur: { count: 0, employees: [] },
      chennai: { count: 0, employees: [] },
      bangalore: { count: 0, employees: [] },
      wfh: { count: 0, employees: [] },
      unknown: { count: 0, employees: [] },
    };

    filteredAttendance.forEach(record => {
      if (record.status === 'present' || record.half_day) {
        const location = (record as any).work_location || 'unknown';
        if (stats[location]) {
          stats[location].count++;
          stats[location].employees.push(record.user_name || 'Unknown');
        } else {
          stats.unknown.count++;
          stats.unknown.employees.push(record.user_name || 'Unknown');
        }
      }
    });

    return stats;
  }, [filteredAttendance]);

  const locationIcons: Record<string, React.ReactNode> = {
    krishnagiri: <Navigation className="h-5 w-5" />,
    tirupattur: <Navigation className="h-5 w-5" />,
    chennai: <Building2 className="h-5 w-5" />,
    bangalore: <Building2 className="h-5 w-5" />,
    wfh: <Home className="h-5 w-5" />,
    unknown: <MapPin className="h-5 w-5" />,
  };

  const locationColors: Record<string, string> = {
    krishnagiri: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
    tirupattur: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
    chennai: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
    bangalore: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
    wfh: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
    unknown: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
  };

  const locationsToShow = Object.entries(locationStats).filter(([_, stats]) => stats.count > 0);

  if (locationsToShow.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-5 w-5 text-primary" />
            Location Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No attendance data with location info for this date
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          <span className="truncate">Location Overview</span>
          {selectedDate && <span className="text-xs text-muted-foreground hidden sm:inline">- {new Date(selectedDate).toLocaleDateString()}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6">
        {/* Location Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {locationsToShow.map(([location, stats]) => (
            <div
              key={location}
              className={cn(
                "p-2 sm:p-3 rounded-lg sm:rounded-xl border-2 transition-all hover:shadow-md",
                locationColors[location]
              )}
            >
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <div className="p-1 sm:p-1.5 rounded-md sm:rounded-lg bg-white/50 dark:bg-black/20">
                  {locationIcons[location]}
                </div>
                <span className="text-lg sm:text-xl font-bold">{stats.count}</span>
              </div>
              <h3 className="font-medium text-[10px] sm:text-xs leading-tight truncate">
                {OFFICE_LOCATIONS[location as WorkLocation]?.name || 'Legacy Records'}
              </h3>
              {stats.employees.length > 0 && (
                <div className="mt-1 sm:mt-2 max-h-12 sm:max-h-16 overflow-y-auto scrollbar-thin hidden sm:block">
                  {stats.employees.slice(0, 3).map((name, idx) => (
                    <div key={idx} className="flex items-center gap-1 text-xs opacity-80">
                      <CheckCircle className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{name}</span>
                    </div>
                  ))}
                  {stats.employees.length > 3 && (
                    <p className="text-xs opacity-60 mt-1">
                      +{stats.employees.length - 3} more
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Office Locations Visual */}
        <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-muted/50 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
            <span className="text-xs sm:text-sm font-medium">Office Locations</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {Object.entries(OFFICE_LOCATIONS)
              .filter(([key]) => key !== 'wfh')
              .map(([key, location]) => (
                <div
                  key={key}
                  className={cn(
                    "flex flex-col items-center p-1.5 sm:p-2 rounded-md sm:rounded-lg transition-all",
                    locationStats[key]?.count > 0 
                      ? "bg-white dark:bg-gray-800 shadow-md" 
                      : "bg-muted/30 opacity-60"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mb-0.5 sm:mb-1",
                    locationColors[key]
                  )}>
                    {locationIcons[key]}
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium text-center">{location.name.split(' ')[0]}</span>
                  <span className={cn(
                    "text-xs sm:text-sm font-bold",
                    locationStats[key]?.count > 0 ? "text-primary" : "text-muted-foreground"
                  )}>
                    {locationStats[key]?.count || 0}
                  </span>
                  {key === 'krishnagiri' && location.geoPoints && (
                    <span className="text-[8px] sm:text-[10px] text-muted-foreground mt-0.5">
                      {location.geoPoints.length} offices
                    </span>
                  )}
                </div>
              ))}
          </div>
          
          {/* Krishnagiri Details - Hidden on mobile for space */}
          {OFFICE_LOCATIONS.krishnagiri.geoPoints && (
            <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-border hidden sm:block">
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-1 sm:mb-2">Krishnagiri Office Locations (500m radius each):</p>
              <div className="space-y-1">
                {OFFICE_LOCATIONS.krishnagiri.geoPoints.map((point, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                    <Navigation className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground line-clamp-1">{point.address}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceMapView;
