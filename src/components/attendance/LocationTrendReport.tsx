import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { MapPin, TrendingUp, Calendar, Building2 } from 'lucide-react';
import { Attendance } from '@/hooks/useAttendance';
import { getLocationDisplayName, WorkLocation } from '@/utils/geolocation';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subWeeks, parseISO } from 'date-fns';

interface LocationTrendReportProps {
  attendance: Attendance[];
}

const LOCATION_COLORS: Record<string, string> = {
  krishnagiri: 'hsl(var(--primary))',
  chennai: 'hsl(var(--success))',
  bangalore: 'hsl(var(--warning))',
  wfh: 'hsl(var(--muted-foreground))',
  unknown: 'hsl(var(--destructive))',
};

const LocationTrendReport = ({ attendance }: LocationTrendReportProps) => {
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  // Calculate location distribution
  const locationDistribution = useMemo(() => {
    const distribution: Record<string, number> = {
      krishnagiri: 0,
      chennai: 0,
      bangalore: 0,
      wfh: 0,
    };

    attendance.forEach((record) => {
      if (record.status === 'present' || record.half_day) {
        const loc = record.work_location || 'unknown';
        if (loc in distribution) {
          distribution[loc] += record.half_day ? 0.5 : 1;
        }
      }
    });

    return Object.entries(distribution)
      .filter(([_, count]) => count > 0)
      .map(([location, count]) => ({
        name: getLocationDisplayName(location as WorkLocation),
        value: count,
        location,
      }));
  }, [attendance]);

  // Calculate daily trends for the selected period
  const dailyTrends = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    if (period === 'week') {
      startDate = startOfWeek(now, { weekStartsOn: 1 });
      endDate = endOfWeek(now, { weekStartsOn: 1 });
    } else {
      // Last 4 weeks
      startDate = subWeeks(startOfWeek(now, { weekStartsOn: 1 }), 3);
    }

    const days = eachDayOfInterval({ start: startDate, end: endDate > now ? now : endDate });
    
    return days.map((day) => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayRecords = attendance.filter((r) => r.date === dayStr);
      
      const locationCounts: Record<string, number> = {
        krishnagiri: 0,
        chennai: 0,
        bangalore: 0,
        wfh: 0,
      };

      dayRecords.forEach((record) => {
        if (record.status === 'present' || record.half_day) {
          const loc = record.work_location || 'unknown';
          if (loc in locationCounts) {
            locationCounts[loc] += record.half_day ? 0.5 : 1;
          }
        }
      });

      return {
        date: format(day, period === 'week' ? 'EEE' : 'MMM dd'),
        ...locationCounts,
        total: Object.values(locationCounts).reduce((a, b) => a + b, 0),
      };
    });
  }, [attendance, period]);

  // Weekly location breakdown
  const weeklyBreakdown = useMemo(() => {
    const weeks: Record<string, Record<string, number>> = {};
    
    attendance.forEach((record) => {
      if (record.status === 'present' || record.half_day) {
        const weekStart = format(startOfWeek(parseISO(record.date), { weekStartsOn: 1 }), 'MMM dd');
        const loc = record.work_location || 'unknown';
        
        if (!weeks[weekStart]) {
          weeks[weekStart] = { krishnagiri: 0, chennai: 0, bangalore: 0, wfh: 0 };
        }
        
        if (loc in weeks[weekStart]) {
          weeks[weekStart][loc] += record.half_day ? 0.5 : 1;
        }
      }
    });

    return Object.entries(weeks)
      .slice(-4)
      .map(([week, counts]) => ({
        week,
        ...counts,
        total: Object.values(counts).reduce((a, b) => a + b, 0),
      }));
  }, [attendance]);

  const totalAttendance = locationDistribution.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Location-Based Attendance Trends
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="distribution" className="w-full">
          <TabsList className="grid w-full grid-cols-3 text-xs">
            <TabsTrigger value="distribution" className="text-xs">
              <MapPin className="h-3 w-3 mr-1 hidden sm:inline" />
              Distribution
            </TabsTrigger>
            <TabsTrigger value="daily" className="text-xs">
              <Calendar className="h-3 w-3 mr-1 hidden sm:inline" />
              Daily
            </TabsTrigger>
            <TabsTrigger value="weekly" className="text-xs">
              <Building2 className="h-3 w-3 mr-1 hidden sm:inline" />
              Weekly
            </TabsTrigger>
          </TabsList>

          {/* Location Distribution Pie Chart */}
          <TabsContent value="distribution" className="mt-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-full sm:w-1/2 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={locationDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      label={({ name, percent }) => 
                        `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {locationDistribution.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={LOCATION_COLORS[entry.location] || LOCATION_COLORS.unknown}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full sm:w-1/2 space-y-2">
                <p className="text-sm font-medium text-muted-foreground mb-3">
                  Total: {totalAttendance} attendance days
                </p>
                {locationDistribution.map((item) => (
                  <div key={item.location} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: LOCATION_COLORS[item.location] }}
                      />
                      <span className="text-xs">{item.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {item.value} days
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Daily Trends Bar Chart */}
          <TabsContent value="daily" className="mt-4">
            <div className="flex gap-2 mb-3">
              <Badge 
                variant={period === 'week' ? 'default' : 'outline'}
                className="cursor-pointer text-xs"
                onClick={() => setPeriod('week')}
              >
                This Week
              </Badge>
              <Badge 
                variant={period === 'month' ? 'default' : 'outline'}
                className="cursor-pointer text-xs"
                onClick={() => setPeriod('month')}
              >
                Last 4 Weeks
              </Badge>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyTrends}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }}
                    className="fill-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    className="fill-muted-foreground"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="krishnagiri" stackId="a" fill={LOCATION_COLORS.krishnagiri} name="Krishnagiri" />
                  <Bar dataKey="chennai" stackId="a" fill={LOCATION_COLORS.chennai} name="Chennai" />
                  <Bar dataKey="bangalore" stackId="a" fill={LOCATION_COLORS.bangalore} name="Bangalore" />
                  <Bar dataKey="wfh" stackId="a" fill={LOCATION_COLORS.wfh} name="WFH" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          {/* Weekly Breakdown */}
          <TabsContent value="weekly" className="mt-4">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis 
                    dataKey="week" 
                    type="category" 
                    tick={{ fontSize: 10 }}
                    width={60}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Bar dataKey="krishnagiri" fill={LOCATION_COLORS.krishnagiri} name="Krishnagiri" />
                  <Bar dataKey="chennai" fill={LOCATION_COLORS.chennai} name="Chennai" />
                  <Bar dataKey="bangalore" fill={LOCATION_COLORS.bangalore} name="Bangalore" />
                  <Bar dataKey="wfh" fill={LOCATION_COLORS.wfh} name="WFH" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default LocationTrendReport;
