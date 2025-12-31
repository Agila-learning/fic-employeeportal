import { useState, useEffect } from 'react';
import { Lead, LeadStatus, LeadSource, STATUS_OPTIONS, SOURCE_OPTIONS, LeadComment, LeadStatusHistory } from '@/types';
import { useLeads, useLeadComments, useLeadStatusHistory } from '@/hooks/useLeads';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Upload, MessageSquare, History, Send, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface LeadFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead;
  mode: 'add' | 'edit' | 'view';
  onSave?: () => void;
}

const generateCandidateId = () => {
  const prefix = 'FIC';
  const number = Math.floor(Math.random() * 90000) + 10000;
  return `${prefix}${number}`;
};

const LeadFormDialog = ({ open, onOpenChange, lead, mode, onSave }: LeadFormDialogProps) => {
  const { addLead, updateLead } = useLeads();
  const { user } = useAuth();
  const isViewMode = mode === 'view';

  const [formData, setFormData] = useState({
    candidate_id: '',
    name: '',
    email: '',
    phone: '',
    qualification: '',
    past_experience: '',
    current_ctc: '',
    expected_ctc: '',
    status: 'nc1' as LeadStatus,
    source: 'social_media' as LeadSource,
    notes: '',
    resume_url: '',
  });

  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch comments and history if viewing
  const { comments, addComment, isLoading: commentsLoading } = useLeadComments(lead?.id || '');
  const { history, isLoading: historyLoading } = useLeadStatusHistory(lead?.id || '');

  useEffect(() => {
    if (lead) {
      setFormData({
        candidate_id: lead.candidate_id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        qualification: lead.qualification || '',
        past_experience: lead.past_experience || '',
        current_ctc: lead.current_ctc || '',
        expected_ctc: lead.expected_ctc || '',
        status: lead.status,
        source: lead.source,
        notes: lead.notes || '',
        resume_url: lead.resume_url || '',
      });
    } else {
      setFormData({
        candidate_id: generateCandidateId(),
        name: '',
        email: '',
        phone: '',
        qualification: '',
        past_experience: '',
        current_ctc: '',
        expected_ctc: '',
        status: 'nc1',
        source: 'social_media',
        notes: '',
        resume_url: '',
      });
    }
  }, [lead, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'add') {
        const result = await addLead(formData);
        if (result) {
          toast.success('Lead added successfully');
          onSave?.();
          onOpenChange(false);
        }
      } else if (mode === 'edit' && lead) {
        const success = await updateLead(lead.id, formData, lead.status);
        if (success) {
          toast.success('Lead updated successfully');
          onSave?.();
          onOpenChange(false);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    const result = await addComment(newComment);
    if (result) {
      setNewComment('');
      toast.success('Comment added');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, resume_url: file.name }));
      toast.success('Resume selected: ' + file.name);
    }
  };

  const getStatusLabel = (status: LeadStatus) => {
    return STATUS_OPTIONS.find(s => s.value === status)?.label || status;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {mode === 'add' ? 'Add New Lead' : mode === 'edit' ? 'Edit Lead' : 'Lead Details'}
          </DialogTitle>
        </DialogHeader>

        {(mode === 'view' || mode === 'edit') && lead ? (
          <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="comments" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Comments ({comments.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="h-4 w-4" />
                History ({history.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="flex-1 overflow-auto">
              <ScrollArea className="h-[60vh] pr-4">
                <LeadForm
                  formData={formData}
                  setFormData={setFormData}
                  isViewMode={isViewMode}
                  mode={mode}
                  handleSubmit={handleSubmit}
                  handleFileUpload={handleFileUpload}
                  isSubmitting={isSubmitting}
                  onOpenChange={onOpenChange}
                />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="comments" className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-auto">
                <ScrollArea className="h-[50vh]">
                  {commentsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  ) : comments.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No comments yet</p>
                  ) : (
                    <div className="space-y-4 p-4">
                      {comments.map((comment) => (
                        <div key={comment.id} className="rounded-lg border border-border bg-muted/30 p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{comment.user_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}
                            </span>
                          </div>
                          <p className="text-sm">{comment.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
              
              {/* Add Comment */}
              <div className="border-t border-border pt-4 mt-4">
                <div className="flex gap-2">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows={2}
                    className="flex-1"
                  />
                  <Button onClick={handleAddComment} size="icon" className="gradient-primary self-end">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="flex-1 overflow-auto">
              <ScrollArea className="h-[60vh]">
                {historyLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                ) : history.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No status changes recorded</p>
                ) : (
                  <div className="space-y-4 p-4">
                    {history.map((item, index) => (
                      <div key={item.id} className="relative flex gap-4">
                        {index < history.length - 1 && (
                          <div className="absolute left-[17px] top-8 bottom-0 w-0.5 bg-border" />
                        )}
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 z-10">
                          <Clock className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 rounded-lg border border-border bg-card p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{item.changed_by_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}
                            </span>
                          </div>
                          <p className="text-sm">
                            {item.old_status ? (
                              <>
                                Changed status from <span className="font-medium">{getStatusLabel(item.old_status)}</span> to{' '}
                                <span className="font-medium text-primary">{getStatusLabel(item.new_status)}</span>
                              </>
                            ) : (
                              <>
                                Lead created with status <span className="font-medium text-primary">{getStatusLabel(item.new_status)}</span>
                              </>
                            )}
                          </p>
                          {item.notes && <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        ) : (
          <ScrollArea className="h-[60vh] pr-4">
            <LeadForm
              formData={formData}
              setFormData={setFormData}
              isViewMode={false}
              mode={mode}
              handleSubmit={handleSubmit}
              handleFileUpload={handleFileUpload}
              isSubmitting={isSubmitting}
              onOpenChange={onOpenChange}
            />
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};

interface LeadFormProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  isViewMode: boolean;
  mode: 'add' | 'edit' | 'view';
  handleSubmit: (e: React.FormEvent) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
}

const LeadForm = ({ formData, setFormData, isViewMode, mode, handleSubmit, handleFileUpload, isSubmitting, onOpenChange }: LeadFormProps) => (
  <form onSubmit={handleSubmit} className="space-y-6 py-4">
    {/* Candidate ID */}
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="candidate_id">Candidate ID</Label>
        <Input
          id="candidate_id"
          value={formData.candidate_id}
          disabled
          className="bg-muted font-mono"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="name">Full Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData((prev: any) => ({ ...prev, name: e.target.value }))}
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
          onChange={(e) => setFormData((prev: any) => ({ ...prev, email: e.target.value }))}
          disabled={isViewMode}
          placeholder="email@example.com"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number *</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData((prev: any) => ({ ...prev, phone: e.target.value }))}
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
          onChange={(e) => setFormData((prev: any) => ({ ...prev, qualification: e.target.value }))}
          disabled={isViewMode}
          placeholder="B.Tech, MBA, etc."
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="experience">Past Experience</Label>
        <Input
          id="experience"
          value={formData.past_experience}
          onChange={(e) => setFormData((prev: any) => ({ ...prev, past_experience: e.target.value }))}
          disabled={isViewMode}
          placeholder="2 years at Company"
        />
      </div>
    </div>

    {/* CTC */}
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="current_ctc">Current CTC</Label>
        <Input
          id="current_ctc"
          value={formData.current_ctc}
          onChange={(e) => setFormData((prev: any) => ({ ...prev, current_ctc: e.target.value }))}
          disabled={isViewMode}
          placeholder="6 LPA"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="expected_ctc">Expected CTC</Label>
        <Input
          id="expected_ctc"
          value={formData.expected_ctc}
          onChange={(e) => setFormData((prev: any) => ({ ...prev, expected_ctc: e.target.value }))}
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
          onValueChange={(value: LeadStatus) => setFormData((prev: any) => ({ ...prev, status: value }))}
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
          onValueChange={(value: LeadSource) => setFormData((prev: any) => ({ ...prev, source: value }))}
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
            <div className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-4 transition-colors hover:border-primary hover:bg-muted/50">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {formData.resume_url || 'Click to upload resume'}
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
          {formData.resume_url || 'No resume uploaded'}
        </p>
      )}
    </div>

    {/* Notes */}
    <div className="space-y-2">
      <Label htmlFor="notes">Notes</Label>
      <Textarea
        id="notes"
        value={formData.notes}
        onChange={(e) => setFormData((prev: any) => ({ ...prev, notes: e.target.value }))}
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
        <Button type="submit" className="gradient-primary" disabled={isSubmitting}>
          {isSubmitting ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
          ) : (
            mode === 'add' ? 'Add Lead' : 'Save Changes'
          )}
        </Button>
      </div>
    )}
  </form>
);

export default LeadFormDialog;
