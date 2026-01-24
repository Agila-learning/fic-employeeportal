import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useHolidays, HolidayType } from '@/hooks/useHolidays';
import { CalendarPlus, Trash2, Calendar, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const HolidayManagement = () => {
  const { holidays, loading, addHoliday, deleteHoliday } = useHolidays();
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<HolidayType>('govt');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !name.trim()) return;

    setSubmitting(true);
    const result = await addHoliday(date, name.trim(), type);
    setSubmitting(false);

    if (!result.error) {
      setDate('');
      setName('');
      setType('govt');
      setIsOpen(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteHoliday(id);
    setDeletingId(null);
  };

  const upcomingHolidays = holidays.filter(h => new Date(h.date) >= new Date());
  const pastHolidays = holidays.filter(h => new Date(h.date) < new Date());

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Holiday Management
        </CardTitle>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <CalendarPlus className="h-4 w-4" />
              Add Holiday
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Holiday</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="holiday-date">Date *</Label>
                <Input
                  id="holiday-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="holiday-name">Holiday Name *</Label>
                <Input
                  id="holiday-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Republic Day"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="holiday-type">Type *</Label>
                <Select value={type} onValueChange={(v) => setType(v as HolidayType)}>
                  <SelectTrigger id="holiday-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="govt">Government</SelectItem>
                    <SelectItem value="festival">Festival</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Holiday'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : holidays.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No holidays added yet</p>
            <p className="text-sm">Click "Add Holiday" to get started</p>
          </div>
        ) : (
          <div className="space-y-6">
            {upcomingHolidays.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Upcoming Holidays</h4>
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Date</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {upcomingHolidays.map((holiday) => (
                        <TableRow key={holiday.id}>
                          <TableCell className="font-medium">
                            {format(parseISO(holiday.date), 'dd MMM yyyy')}
                            <span className="text-xs text-muted-foreground ml-2">
                              ({format(parseISO(holiday.date), 'EEEE')})
                            </span>
                          </TableCell>
                          <TableCell>{holiday.name}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                holiday.type === 'govt'
                                  ? 'border-primary/50 text-primary bg-primary/10'
                                  : 'border-warning/50 text-warning bg-warning/10'
                              }
                            >
                              {holiday.type === 'govt' ? 'Government' : 'Festival'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(holiday.id)}
                              disabled={deletingId === holiday.id}
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              {deletingId === holiday.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {pastHolidays.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Past Holidays</h4>
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Date</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pastHolidays.map((holiday) => (
                        <TableRow key={holiday.id} className="opacity-60">
                          <TableCell className="font-medium">
                            {format(parseISO(holiday.date), 'dd MMM yyyy')}
                          </TableCell>
                          <TableCell>{holiday.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-muted text-muted-foreground">
                              {holiday.type === 'govt' ? 'Government' : 'Festival'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(holiday.id)}
                              disabled={deletingId === holiday.id}
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              {deletingId === holiday.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HolidayManagement;
