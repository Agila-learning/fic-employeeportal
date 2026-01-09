import { useState } from 'react';
import { Lead, STATUS_OPTIONS, SOURCE_OPTIONS } from '@/types';
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
import { Input } from '@/components/ui/input';
import LeadStatusBadge from './LeadStatusBadge';
import LeadFormDialog from './LeadFormDialog';
import { MoreHorizontal, Pencil, Trash2, Eye, Download, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';

interface LeadsTableProps {
  leads: Lead[];
  showAssignee?: boolean;
  onRefresh?: () => void;
}

const LeadsTable = ({ leads, showAssignee = false, onRefresh }: LeadsTableProps) => {
  const { deleteLead } = useLeads();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.candidate_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;
    
    return matchesSearch && matchesStatus && matchesSource;
  });

  const handleDelete = async (id: string) => {
    const success = await deleteLead(id);
    if (success) {
      toast.success('Lead deleted successfully');
      onRefresh?.();
    }
  };

  const exportToExcel = () => {
    const headers = ['Candidate ID', 'Name', 'Email', 'Phone', 'Qualification', 'Experience', 'Current CTC', 'Expected CTC', 'Status', 'Source'];
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

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-card p-5 shadow-sm border border-border/50 hover:shadow-md transition-all duration-300">
        <div className="relative flex-1 min-w-[200px] group">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search by name, email, ID, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 transition-all duration-300 focus:ring-2 focus:ring-primary/20"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] transition-all duration-300 hover:border-primary/50">
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
          <SelectTrigger className="w-[150px] transition-all duration-300 hover:border-primary/50">
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

        <Button onClick={exportToExcel} variant="outline" className="gap-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:shadow-md">
          <Download className="h-4 w-4" />
          Export Excel
        </Button>
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
              <TableHead className="font-semibold">Candidate ID</TableHead>
              <TableHead className="font-semibold">Name</TableHead>
              <TableHead className="font-semibold">Contact</TableHead>
              <TableHead className="font-semibold">Qualification</TableHead>
              <TableHead className="font-semibold">CTC</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Source</TableHead>
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
                    <LeadStatusBadge status={lead.status} />
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
