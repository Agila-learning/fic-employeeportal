import { useState, useEffect } from 'react';
import { Lead, LeadStatus, LeadSource, STATUS_OPTIONS, SOURCE_OPTIONS } from '@/types';
import { useLeads } from '@/contexts/LeadsContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';

interface LeadFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead;
  mode: 'add' | 'edit' | 'view';
}

const generateCandidateId = () => {
  const prefix = 'CND';
  const number = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}${number}`;
};

const LeadFormDialog = ({ open, onOpenChange, lead, mode }: LeadFormDialogProps) => {
  const { addLead, updateLead } = useLeads();
  const { user } = useAuth();
  const isViewMode = mode === 'view';

  const [formData, setFormData] = useState({
    candidateId: '',
    name: '',
    email: '',
    phone: '',
    qualification: '',
    pastExperience: '',
    currentCtc: '',
    expectedCtc: '',
    status: 'nc1' as LeadStatus,
    source: 'social_media' as LeadSource,
    notes: '',
    resumeUrl: '',
  });

  useEffect(() => {
    if (lead) {
      setFormData({
        candidateId: lead.candidateId,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        qualification: lead.qualification,
        pastExperience: lead.pastExperience,
        currentCtc: lead.currentCtc,
        expectedCtc: lead.expectedCtc,
        status: lead.status,
        source: lead.source,
        notes: lead.notes || '',
        resumeUrl: lead.resumeUrl || '',
      });
    } else {
      setFormData({
        candidateId: generateCandidateId(),
        name: '',
        email: '',
        phone: '',
        qualification: '',
        pastExperience: '',
        currentCtc: '',
        expectedCtc: '',
        status: 'nc1',
        source: 'social_media',
        notes: '',
        resumeUrl: '',
      });
    }
  }, [lead, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (mode === 'add') {
      addLead({
        ...formData,
        assignedTo: user?.id || '',
      });
      toast.success('Lead added successfully');
    } else if (mode === 'edit' && lead) {
      updateLead(lead.id, formData);
      toast.success('Lead updated successfully');
    }

    onOpenChange(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you'd upload to storage and get URL
      setFormData(prev => ({ ...prev, resumeUrl: file.name }));
      toast.success('Resume uploaded: ' + file.name);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {mode === 'add' ? 'Add New Lead' : mode === 'edit' ? 'Edit Lead' : 'Lead Details'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Candidate ID */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="candidateId">Candidate ID</Label>
              <Input
                id="candidateId"
                value={formData.candidateId}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                disabled={isViewMode}
                placeholder="Enter full name"
              />
            </div>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                disabled={isViewMode}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                disabled={isViewMode}
                placeholder="+91 9876543210"
              />
            </div>
          </div>

          {/* Qualification & Experience */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="qualification">Qualification</Label>
              <Input
                id="qualification"
                value={formData.qualification}
                onChange={(e) => setFormData(prev => ({ ...prev, qualification: e.target.value }))}
                disabled={isViewMode}
                placeholder="B.Tech, MBA, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience">Past Experience</Label>
              <Input
                id="experience"
                value={formData.pastExperience}
                onChange={(e) => setFormData(prev => ({ ...prev, pastExperience: e.target.value }))}
                disabled={isViewMode}
                placeholder="2 years at Company"
              />
            </div>
          </div>

          {/* CTC */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentCtc">Current CTC</Label>
              <Input
                id="currentCtc"
                value={formData.currentCtc}
                onChange={(e) => setFormData(prev => ({ ...prev, currentCtc: e.target.value }))}
                disabled={isViewMode}
                placeholder="6 LPA"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expectedCtc">Expected CTC</Label>
              <Input
                id="expectedCtc"
                value={formData.expectedCtc}
                onChange={(e) => setFormData(prev => ({ ...prev, expectedCtc: e.target.value }))}
                disabled={isViewMode}
                placeholder="10 LPA"
              />
            </div>
          </div>

          {/* Status & Source */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Lead Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: LeadStatus) => setFormData(prev => ({ ...prev, status: value }))}
                disabled={isViewMode}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Lead Source</Label>
              <Select
                value={formData.source}
                onValueChange={(value: LeadSource) => setFormData(prev => ({ ...prev, source: value }))}
                disabled={isViewMode}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Resume Upload */}
          <div className="space-y-2">
            <Label>Resume</Label>
            {!isViewMode ? (
              <div className="flex items-center gap-4">
                <label className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-4 transition-colors hover:border-primary hover:bg-muted/50">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {formData.resumeUrl || 'Click to upload resume'}
                    </span>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {formData.resumeUrl || 'No resume uploaded'}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              disabled={isViewMode}
              placeholder="Additional notes about the candidate..."
              rows={3}
            />
          </div>

          {/* Actions */}
          {!isViewMode && (
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" className="gradient-primary">
                {mode === 'add' ? 'Add Lead' : 'Save Changes'}
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LeadFormDialog;
