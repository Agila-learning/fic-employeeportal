import { useState, useEffect } from 'react';
import { Lead, LeadStatus, LeadSource, PaymentStage, InterestedDomain, STATUS_OPTIONS, SOURCE_OPTIONS, PAYMENT_STAGE_OPTIONS, INTERESTED_DOMAIN_OPTIONS } from '@/types';
import { useLeads, useLeadComments, useLeadStatusHistory } from '@/hooks/useLeads';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
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
import { Upload, MessageSquare, History, Send, Clock, Calendar, CreditCard, FileImage, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface LeadFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead;
  mode: 'add' | 'edit' | 'view';
  onSave?: () => void;
}

const generateCandidateId = async (): Promise<string> => {
  const prefix = 'FIC';
  let candidateId = '';
  let isUnique = false;
  
  while (!isUnique) {
    const number = Math.floor(Math.random() * 90000) + 10000;
    candidateId = `${prefix}${number}`;
    
    // Check if this ID already exists
    const { data } = await supabase
      .from('leads')
      .select('id')
      .eq('candidate_id', candidateId)
      .maybeSingle();
    
    if (!data) {
      isUnique = true;
    }
  }
  
  return candidateId;
};

const REJECTION_STATUSES: LeadStatus[] = ['rejected', 'not_interested', 'not_interested_paid', 'different_domain'];

const LeadFormDialog = ({ open, onOpenChange, lead, mode, onSave }: LeadFormDialogProps) => {
  const { addLead, updateLead } = useLeads();
  const { user } = useAuth();
  const isViewMode = mode === 'view';
  const isAdmin = user?.role === 'admin';

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
    followup_date: '',
    payment_slip_url: '',
    payment_stage: null as PaymentStage | null,
    interested_domain: 'it' as InterestedDomain,
  });

  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previousStatus, setPreviousStatus] = useState<LeadStatus | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionWarning, setShowRejectionWarning] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [paymentSlipFile, setPaymentSlipFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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
        followup_date: lead.followup_date ? format(new Date(lead.followup_date), "yyyy-MM-dd'T'HH:mm") : '',
        payment_slip_url: lead.payment_slip_url || '',
        payment_stage: lead.payment_stage || null,
        interested_domain: lead.interested_domain || 'it',
      });
      setPreviousStatus(lead.status);
    } else {
      // Generate unique candidate ID
      generateCandidateId().then(uniqueId => {
        setFormData({
          candidate_id: uniqueId,
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
          followup_date: '',
          payment_slip_url: '',
          payment_stage: null,
          interested_domain: 'it',
        });
      });
      setPreviousStatus(null);
    }
    setRejectionReason('');
    setShowRejectionWarning(false);
    setResumeFile(null);
    setPaymentSlipFile(null);
  }, [lead, open]);

  // Check if status changed to rejection status
  useEffect(() => {
    if (previousStatus && formData.status !== previousStatus && REJECTION_STATUSES.includes(formData.status)) {
      setShowRejectionWarning(true);
    } else {
      setShowRejectionWarning(false);
    }
  }, [formData.status, previousStatus]);

  // Auto-set status to success when full payment is done
  useEffect(() => {
    if (formData.payment_stage === 'full_payment_done' && formData.status === 'converted') {
      setFormData(prev => ({ ...prev, status: 'success' }));
    }
  }, [formData.payment_stage, formData.status]);

  const uploadFile = async (file: File, bucket: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error(`Error uploading to ${bucket}:`, error);
      toast.error(`Failed to upload file: ${error.message}`);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check if converted status requires payment stage
    if (formData.status === 'converted' && !formData.payment_stage) {
      toast.error('Please select a payment stage for Converted status');
      return;
    }

    // Check if payment stage (initial or full) requires payment slip
    if ((formData.payment_stage === 'initial_payment_done' || formData.payment_stage === 'full_payment_done') && 
        !formData.payment_slip_url && !paymentSlipFile) {
      toast.error('Payment slip/screenshot is required for payment stages');
      return;
    }

    // Check if rejection status requires a comment/reason
    if (REJECTION_STATUSES.includes(formData.status) && mode === 'edit' && previousStatus !== formData.status) {
      if (!rejectionReason.trim()) {
        toast.error('Please provide a reason for rejection in the comments');
        return;
      }
    }

    setIsSubmitting(true);
    setIsUploading(true);

    try {
      let resumeUrl = formData.resume_url;
      let paymentSlipUrl = formData.payment_slip_url;

      // Upload resume if selected
      if (resumeFile) {
        const uploadedUrl = await uploadFile(resumeFile, 'resumes');
        if (uploadedUrl) resumeUrl = uploadedUrl;
      }

      // Upload payment slip if selected
      if (paymentSlipFile) {
        const uploadedUrl = await uploadFile(paymentSlipFile, 'payment-slips');
        if (uploadedUrl) paymentSlipUrl = uploadedUrl;
      }

      // Auto-upgrade to success if full payment done
      let finalStatus = formData.status;
      if (formData.payment_stage === 'full_payment_done') {
        finalStatus = 'success';
      }

      const dataToSave = {
        ...formData,
        status: finalStatus,
        resume_url: resumeUrl,
        payment_slip_url: paymentSlipUrl,
        followup_date: formData.followup_date ? new Date(formData.followup_date).toISOString() : null,
      };

      if (mode === 'add') {
        const result = await addLead(dataToSave);
        if (result) {
          toast.success('Lead added successfully');
          onSave?.();
          onOpenChange(false);
        }
      } else if (mode === 'edit' && lead) {
        // Add rejection comment if status changed to rejected
        if (REJECTION_STATUSES.includes(formData.status) && previousStatus !== formData.status && rejectionReason.trim()) {
          await addComment(`Status changed to ${STATUS_OPTIONS.find(s => s.value === formData.status)?.label}: ${rejectionReason}`);
        }

        const success = await updateLead(lead.id, dataToSave, lead.status);
        if (success) {
          toast.success('Lead updated successfully');
          onSave?.();
          onOpenChange(false);
        }
      }
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
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

  const handleResumeSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFile(file);
      toast.success('Resume selected: ' + file.name);
    }
  };

  const handlePaymentSlipSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentSlipFile(file);
      toast.success('Payment slip selected: ' + file.name);
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
                  isAdmin={isAdmin}
                  mode={mode}
                  handleSubmit={handleSubmit}
                  handleResumeSelect={handleResumeSelect}
                  handlePaymentSlipSelect={handlePaymentSlipSelect}
                  resumeFile={resumeFile}
                  paymentSlipFile={paymentSlipFile}
                  isSubmitting={isSubmitting}
                  isUploading={isUploading}
                  onOpenChange={onOpenChange}
                  showRejectionWarning={showRejectionWarning}
                  rejectionReason={rejectionReason}
                  setRejectionReason={setRejectionReason}
                  lead={lead}
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
                  <Button onClick={handleAddComment} size="icon" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 self-end">
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
              isAdmin={isAdmin}
              mode={mode}
              handleSubmit={handleSubmit}
              handleResumeSelect={handleResumeSelect}
              handlePaymentSlipSelect={handlePaymentSlipSelect}
              resumeFile={resumeFile}
              paymentSlipFile={paymentSlipFile}
              isSubmitting={isSubmitting}
              isUploading={isUploading}
              onOpenChange={onOpenChange}
              showRejectionWarning={false}
              rejectionReason=""
              setRejectionReason={() => {}}
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
  isAdmin: boolean;
  mode: 'add' | 'edit' | 'view';
  handleSubmit: (e: React.FormEvent) => void;
  handleResumeSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePaymentSlipSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  resumeFile: File | null;
  paymentSlipFile: File | null;
  isSubmitting: boolean;
  isUploading: boolean;
  onOpenChange: (open: boolean) => void;
  showRejectionWarning: boolean;
  rejectionReason: string;
  setRejectionReason: (reason: string) => void;
  lead?: Lead;
}

const LeadForm = ({ 
  formData, 
  setFormData, 
  isViewMode, 
  isAdmin,
  mode, 
  handleSubmit, 
  handleResumeSelect,
  handlePaymentSlipSelect,
  resumeFile,
  paymentSlipFile,
  isSubmitting, 
  isUploading,
  onOpenChange,
  showRejectionWarning,
  rejectionReason,
  setRejectionReason,
  lead
}: LeadFormProps) => (
  <form onSubmit={handleSubmit} className="space-y-6 py-4">
    {/* Lead Created Info */}
    {lead && (
      <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Created:</span>
          <span className="font-medium">{format(new Date(lead.created_at), 'MMM d, yyyy h:mm a')}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Updated:</span>
          <span className="font-medium">{format(new Date(lead.updated_at), 'MMM d, yyyy h:mm a')}</span>
        </div>
      </div>
    )}

    {/* Candidate ID */}
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="candidate_id">Candidate ID</Label>
        <Input
          id="candidate_id"
          value={formData.candidate_id}
          onChange={(e) => isAdmin && setFormData((prev: any) => ({ ...prev, candidate_id: e.target.value }))}
          disabled={!isAdmin || isViewMode}
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
          onValueChange={(value: LeadStatus) => {
            setFormData((prev: any) => ({ 
              ...prev, 
              status: value,
              // Reset payment stage when changing away from converted
              payment_stage: value === 'converted' || value === 'success' ? prev.payment_stage : null 
            }));
          }}
          disabled={isViewMode || formData.status === 'success'}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.filter(opt => opt.value !== 'success').map(option => (
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

    {/* Interested Domain */}
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        Interested Domain <span className="text-red-500">*</span>
      </Label>
      <div className="grid grid-cols-3 gap-2">
        {INTERESTED_DOMAIN_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={isViewMode}
            onClick={() => setFormData((prev: any) => ({ ...prev, interested_domain: option.value }))}
            className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
              formData.interested_domain === option.value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border hover:border-primary/50'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>

    {/* Payment Stage - Show when status is converted or success */}
    {(formData.status === 'converted' || formData.status === 'success') && (
      <div className="space-y-3 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
        <Label className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          Payment Stage <span className="text-red-500">*</span>
        </Label>
        <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-2">
          Select the current payment stage. Full payment will automatically mark as Success.
        </p>
        <div className="grid grid-cols-3 gap-2">
          {PAYMENT_STAGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={isViewMode}
              onClick={() => setFormData((prev: any) => ({ ...prev, payment_stage: option.value }))}
              className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                formData.payment_stage === option.value
                  ? 'border-emerald-500 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                  : 'border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        {formData.payment_stage === 'full_payment_done' && (
          <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-2 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            This lead will be marked as Success upon saving.
          </p>
        )}
      </div>
    )}

    {/* Follow-up Date - Show when status is follow_up */}
    {(formData.status === 'follow_up' || formData.followup_date) && (
      <div className="space-y-2 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
        <Label htmlFor="followup_date" className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <Calendar className="h-4 w-4" />
          Follow-up Date & Time {formData.status === 'follow_up' && <span className="text-red-500">*</span>}
        </Label>
        <Input
          id="followup_date"
          type="datetime-local"
          value={formData.followup_date}
          onChange={(e) => setFormData((prev: any) => ({ ...prev, followup_date: e.target.value }))}
          disabled={isViewMode}
          className="bg-white dark:bg-slate-800"
        />
        <p className="text-xs text-amber-600 dark:text-amber-400">
          You will be notified on this date to follow up with the candidate.
        </p>
      </div>
    )}

    {/* Rejection Reason Warning */}
    {showRejectionWarning && (
      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-red-700 dark:text-red-400">Rejection Reason Required</p>
            <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1">
              Please provide a reason for changing status to rejection.
            </p>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter the reason for rejection..."
              className="mt-3"
              rows={2}
            />
          </div>
        </div>
      </div>
    )}

    {/* Resume Upload */}
    <div className="space-y-2">
      <Label>Resume</Label>
      {!isViewMode ? (
        <div className="flex items-center gap-4">
          <label className="flex-1 cursor-pointer">
            <div className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-4 transition-colors hover:border-primary hover:bg-muted/50">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {resumeFile?.name || formData.resume_url || 'Click to upload resume'}
              </span>
            </div>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx"
              onChange={handleResumeSelect}
            />
          </label>
        </div>
      ) : (
        <div className="text-sm">
          {formData.resume_url ? (
            <a href={formData.resume_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              View Resume
            </a>
          ) : (
            <span className="text-muted-foreground">No resume uploaded</span>
          )}
        </div>
      )}
    </div>

    {/* Payment Slip Upload - Required for payment stages */}
    {(formData.payment_stage === 'initial_payment_done' || formData.payment_stage === 'full_payment_done' || formData.payment_slip_url) && (
      <div className="space-y-2 p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
        <Label className="flex items-center gap-2 text-green-700 dark:text-green-400">
          <CreditCard className="h-4 w-4" />
          Payment Slip / Screenshot <span className="text-red-500">*</span>
        </Label>
        <p className="text-xs text-green-600 dark:text-green-400 mb-2">
          Upload payment proof for future reference (required for payment stages)
        </p>
        {!isViewMode ? (
          <div className="flex items-center gap-4">
            <label className="flex-1 cursor-pointer">
              <div className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-green-300 dark:border-green-800 p-4 transition-colors hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/30 bg-white dark:bg-slate-800">
                <FileImage className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-sm text-green-600 dark:text-green-400">
                  {paymentSlipFile?.name || formData.payment_slip_url || 'Click to upload payment slip'}
                </span>
              </div>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handlePaymentSlipSelect}
              />
            </label>
          </div>
        ) : (
          <div className="text-sm">
            {formData.payment_slip_url ? (
              <a href={formData.payment_slip_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                View Payment Slip
              </a>
            ) : (
              <span className="text-muted-foreground">No payment slip uploaded</span>
            )}
          </div>
        )}
      </div>
    )}

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
        <Button 
          type="submit" 
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700" 
          disabled={isSubmitting || isUploading}
        >
          {isSubmitting || isUploading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            mode === 'add' ? 'Add Lead' : 'Save Changes'
          )}
        </Button>
      </div>
    )}
  </form>
);

export default LeadFormDialog;
