import { useState, useMemo } from 'react';
import { Lead, STATUS_OPTIONS, SOURCE_OPTIONS, INTERESTED_DOMAIN_OPTIONS, InterestedDomain } from '@/types';
import { useLeads } from '@/hooks/useLeads';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import LeadStatusBadge from './LeadStatusBadge';
import LeadFormDialog from './LeadFormDialog';
import TypewriterPlaceholder from '@/components/ui/TypewriterPlaceholder';
import { MoreHorizontal, Pencil, Trash2, Eye, Download, Filter, Search, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { startOfDay, startOfWeek, startOfMonth, isAfter, parseISO } from 'date-fns';

const SEARCH_PLACEHOLDERS = [
  'Search by name...',
  'Search by email...',
  'Search by candidate ID...',
  'Search by phone...',
  'Search by status...',
];

interface LeadsTableProps {
  leads: Lead[];
  showAssignee?: boolean;
  onRefresh?: () => void;
}

type DateFilterType = 'all' | 'today' | 'this_week' | 'this_month';

const LeadsTable = ({ leads, showAssignee = false, onRefresh }: LeadsTableProps) => {
  const { deleteLead } = useLeads();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [successDateFilter, setSuccessDateFilter] = useState<DateFilterType>('all');
  const [rejectedDateFilter, setRejectedDateFilter] = useState<DateFilterType>('all');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);

  const getDateThreshold = (filter: DateFilterType): Date | null => {
    const now = new Date();
    switch (filter) {
      case 'today':
        return startOfDay(now);
      case 'this_week':
        return startOfWeek(now, { weekStartsOn: 1 });
      case 'this_month':
        return startOfMonth(now);
      default:
        return null;
    }
  };

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = 
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.candidate_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm);
      
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;
      
      // Date filter for success leads - only apply when success date filter is selected
      let matchesSuccessDate = true;
      if (successDateFilter !== 'all') {
        // Only show success leads that match the date filter
        if (lead.status === 'success') {
          const threshold = getDateThreshold(successDateFilter);
          if (threshold) {
            const leadDate = parseISO(lead.updated_at);
            matchesSuccessDate = isAfter(leadDate, threshold);
          }
        } else {
          // Hide non-success leads when filtering by success date
          matchesSuccessDate = false;
        }
      }

      // Date filter for rejected leads - only apply when rejected date filter is selected
      const rejectedStatuses = ['rejected', 'not_interested', 'not_interested_paid'];
      let matchesRejectedDate = true;
      if (rejectedDateFilter !== 'all') {
        // Only show rejected leads that match the date filter
        if (rejectedStatuses.includes(lead.status)) {
          const threshold = getDateThreshold(rejectedDateFilter);
          if (threshold) {
            const leadDate = parseISO(lead.updated_at);
            matchesRejectedDate = isAfter(leadDate, threshold);
          }
        } else {
          // Hide non-rejected leads when filtering by rejected date
          matchesRejectedDate = false;
        }
      }

      // Domain filter
      const matchesDomain = domainFilter === 'all' || lead.interested_domain === domainFilter;
      
      return matchesSearch && matchesStatus && matchesSource && matchesSuccessDate && matchesRejectedDate && matchesDomain;
    });
  }, [leads, searchTerm, statusFilter, sourceFilter, successDateFilter, rejectedDateFilter, domainFilter]);

  const handleDelete = async (id: string) => {
    const success = await deleteLead(id);
    if (success) {
      toast.success('Lead deleted successfully');
      onRefresh?.();
    }
  };

  const exportToExcel = () => {
    const headers = ['Candidate ID', 'Name', 'Email', 'Phone', 'Qualification', 'Experience', 'Current CTC', 'Expected CTC', 'Status', 'Payment Stage', 'Domain', 'Source'];
    const csvContent = [
      headers.join(','),
      ...filteredLeads.map(lead => [
        lead.candidate_id,
        lead.name,
        lead.email,
        lead.phone,
        lead.qualification || '',
        lead.past_experience || '',
        lead.current_ctc || '',
        lead.expected_ctc || '',
        STATUS_OPTIONS.find(s => s.value === lead.status)?.label || lead.status,
        lead.payment_stage || '',
        INTERESTED_DOMAIN_OPTIONS.find(d => d.value === lead.interested_domain)?.label || lead.interested_domain || '',
        SOURCE_OPTIONS.find(s => s.value === lead.source)?.label || lead.source,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `fic_leads_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Leads exported successfully');
  };

  // Count success and rejected leads (excluding different_domain from rejected)
  const successCount = leads.filter(l => l.status === 'success').length;
  const rejectedCount = leads.filter(l => ['rejected', 'not_interested', 'not_interested_paid'].includes(l.status)).length;
  
  // Domain-wise counts for paid leads (full_payment_done)
  const itPaidCount = leads.filter(l => l.payment_stage === 'full_payment_done' && l.interested_domain === 'it').length;
  const nonItPaidCount = leads.filter(l => l.payment_stage === 'full_payment_done' && l.interested_domain === 'non_it').length;
  const bankingPaidCount = leads.filter(l => l.payment_stage === 'full_payment_done' && l.interested_domain === 'banking').length;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-2xl bg-card p-4 sm:p-5 shadow-sm border border-border/50 hover:shadow-md transition-all duration-300">
        {/* Search with Typewriter effect */}
        <TypewriterPlaceholder
          placeholders={SEARCH_PLACEHOLDERS}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        {/* Filter Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 flex-1">
            <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px] transition-all duration-300 hover:border-primary/50">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUS_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-full sm:w-[150px] transition-all duration-300 hover:border-primary/50">
              <SelectValue placeholder="Filter by source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {SOURCE_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={exportToExcel} variant="outline" className="gap-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:shadow-md w-full sm:w-auto">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>

        {/* Date Filters and Domain Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2 border-t border-border/50">
          <div className="flex items-center gap-2 flex-1">
            <CalendarDays className="h-4 w-4 text-green-600 hidden sm:block" />
            <Select value={successDateFilter} onValueChange={(v) => setSuccessDateFilter(v as DateFilterType)}>
              <SelectTrigger className="w-full sm:w-[180px] transition-all duration-300 hover:border-green-500/50 border-green-200 dark:border-green-900">
                <SelectValue placeholder="Success by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Success ({successCount})</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this_week">This Week</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 flex-1">
            <CalendarDays className="h-4 w-4 text-red-600 hidden sm:block" />
            <Select value={rejectedDateFilter} onValueChange={(v) => setRejectedDateFilter(v as DateFilterType)}>
              <SelectTrigger className="w-full sm:w-[180px] transition-all duration-300 hover:border-red-500/50 border-red-200 dark:border-red-900">
                <SelectValue placeholder="Rejected by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rejected ({rejectedCount})</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this_week">This Week</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Select value={domainFilter} onValueChange={setDomainFilter}>
            <SelectTrigger className="w-full sm:w-[150px] transition-all duration-300 hover:border-primary/50">
              <SelectValue placeholder="Filter by domain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Domains</SelectItem>
              {INTERESTED_DOMAIN_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Domain-wise Payment Stats */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
          <span className="text-xs text-muted-foreground font-medium">Full Payment by Domain:</span>
          <div className="flex gap-2">
            <span className="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
              IT: {itPaidCount}
            </span>
            <span className="px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium">
              Non-IT: {nonItPaidCount}
            </span>
            <span className="px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium">
              Banking: {bankingPaidCount}
            </span>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filteredLeads.length}</span> of <span className="font-semibold text-foreground">{leads.length}</span> leads
        </p>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden hover:shadow-lg transition-all duration-500">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-muted/50 to-muted/30 hover:bg-muted/50">
              <TableHead className="font-semibold hover:text-primary transition-colors cursor-default">Candidate ID</TableHead>
              <TableHead className="font-semibold hover:text-primary transition-colors cursor-default">Name</TableHead>
              <TableHead className="font-semibold hover:text-primary transition-colors cursor-default">Contact</TableHead>
              <TableHead className="font-semibold hover:text-primary transition-colors cursor-default">Qualification</TableHead>
              <TableHead className="font-semibold hover:text-primary transition-colors cursor-default">CTC</TableHead>
              <TableHead className="font-semibold hover:text-primary transition-colors cursor-default">Status</TableHead>
              <TableHead className="font-semibold hover:text-primary transition-colors cursor-default">Source</TableHead>
              <TableHead className="text-right font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="h-8 w-8 opacity-50" />
                    <p>No leads found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.map((lead, index) => (
                <TableRow 
                  key={lead.id} 
                  className="group hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent transition-all duration-300 cursor-pointer"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <TableCell className="font-mono font-medium text-primary group-hover:text-primary/80 transition-colors">{lead.candidate_id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                        <span className="text-xs font-bold text-primary">{lead.name.split(' ').map(n => n[0]).join('')}</span>
                      </div>
                      <div>
                        <p className="font-medium group-hover:text-primary transition-colors">{lead.name}</p>
                        <p className="text-xs text-muted-foreground">{lead.past_experience || '-'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm space-y-0.5">
                      <p className="truncate max-w-[150px]">{lead.email}</p>
                      <p className="text-muted-foreground">{lead.phone}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{lead.qualification || '-'}</TableCell>
                  <TableCell>
                    <div className="text-sm space-y-0.5">
                      <p>Current: <span className="font-medium">{lead.current_ctc || '-'}</span></p>
                      <p className="text-muted-foreground">Expected: {lead.expected_ctc || '-'}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <LeadStatusBadge status={lead.status} paymentStage={lead.payment_stage} />
                  </TableCell>
                  <TableCell className="text-sm">
                    {SOURCE_OPTIONS.find(s => s.value === lead.source)?.label}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover w-48">
                        <DropdownMenuItem onClick={() => setViewingLead(lead)} className="gap-2 cursor-pointer">
                          <Eye className="h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingLead(lead)} className="gap-2 cursor-pointer">
                          <Pencil className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(lead.id)}
                          className="text-destructive focus:text-destructive gap-2 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      {editingLead && (
        <LeadFormDialog
          open={!!editingLead}
          onOpenChange={(open) => !open && setEditingLead(null)}
          lead={editingLead}
          mode="edit"
          onSave={onRefresh}
        />
      )}

      {/* View Dialog */}
      {viewingLead && (
        <LeadFormDialog
          open={!!viewingLead}
          onOpenChange={(open) => !open && setViewingLead(null)}
          lead={viewingLead}
          mode="view"
        />
      )}
    </div>
  );
};

export default LeadsTable;
