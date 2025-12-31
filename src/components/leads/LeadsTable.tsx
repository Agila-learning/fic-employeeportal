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
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl bg-card p-4 shadow-sm border border-border/50">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, ID, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
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
          <SelectTrigger className="w-[150px]">
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

        <Button onClick={exportToExcel} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Excel
        </Button>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredLeads.length} of {leads.length} leads
      </p>

      {/* Table */}
      <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
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
                  No leads found
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.map((lead) => (
                <TableRow key={lead.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono font-medium text-primary">{lead.candidate_id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{lead.name}</p>
                      <p className="text-xs text-muted-foreground">{lead.past_experience}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{lead.email}</p>
                      <p className="text-muted-foreground">{lead.phone}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{lead.qualification}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>Current: {lead.current_ctc || '-'}</p>
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
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover">
                        <DropdownMenuItem onClick={() => setViewingLead(lead)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingLead(lead)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(lead.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
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
