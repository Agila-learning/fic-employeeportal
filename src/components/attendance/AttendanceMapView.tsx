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
    chennai: <Building2 className="h-5 w-5" />,
    bangalore: <Building2 className="h-5 w-5" />,
    wfh: <Home className="h-5 w-5" />,
    unknown: <MapPin className="h-5 w-5" />,
  };

  const locationColors: Record<string, string> = {
    krishnagiri: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="h-5 w-5 text-primary" />
          Location Overview {selectedDate && `- ${new Date(selectedDate).toLocaleDateString()}`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {locationsToShow.map(([location, stats]) => (
            <div
              key={location}
              className={cn(
                "p-4 rounded-xl border-2 transition-all hover:shadow-md",
                locationColors[location]
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-white/50 dark:bg-black/20">
                  {locationIcons[location]}
                </div>
                <span className="text-2xl font-bold">{stats.count}</span>
              </div>
              <h3 className="font-medium text-sm">
                {OFFICE_LOCATIONS[location as WorkLocation]?.name || 'Legacy Records'}
              </h3>
              {stats.employees.length > 0 && (
                <div className="mt-2 max-h-20 overflow-y-auto">
                  {stats.employees.slice(0, 3).map((name, idx) => (
                    <div key={idx} className="flex items-center gap-1 text-xs opacity-80">
                      <CheckCircle className="h-3 w-3" />
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

        {/* Simulated Map View */}
        <div className="mt-4 p-4 rounded-xl bg-muted/50 border border-border">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Office Locations</span>
          </div>
          <div className="relative h-40 bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950/30 dark:to-green-950/30 rounded-lg overflow-hidden">
            {/* Simplified map markers */}
            <div className="absolute inset-0 flex items-center justify-center gap-8 flex-wrap p-4">
              {Object.entries(OFFICE_LOCATIONS)
                .filter(([key]) => key !== 'wfh')
                .map(([key, location]) => (
                  <div
                    key={key}
                    className={cn(
                      "flex flex-col items-center p-2 rounded-lg transition-all",
                      locationStats[key]?.count > 0 
                        ? "bg-white dark:bg-gray-800 shadow-lg scale-110" 
                        : "opacity-50"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      locationColors[key]
                    )}>
                      {locationIcons[key]}
                    </div>
                    <span className="text-xs font-medium mt-1">{location.name.split(' ')[0]}</span>
                    {locationStats[key]?.count > 0 && (
                      <span className="text-xs font-bold text-primary">
                        {locationStats[key].count}
                      </span>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceMapView;
