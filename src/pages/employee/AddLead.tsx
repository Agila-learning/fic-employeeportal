import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LeadStatus, LeadSource, STATUS_OPTIONS, SOURCE_OPTIONS } from '@/types';
import { useLeads } from '@/hooks/useLeads';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Upload, ArrowLeft, Save } from 'lucide-react';
import { Link } from 'react-router-dom';

const generateCandidateId = () => `FIC${Math.floor(Math.random() * 90000) + 10000}`;

const AddLead = () => {
  const navigate = useNavigate();
  const { addLead } = useLeads();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    candidate_id: generateCandidateId(),
    name: '', email: '', phone: '', qualification: '', past_experience: '',
    current_ctc: '', expected_ctc: '', status: 'nc1' as LeadStatus,
    source: 'social_media' as LeadSource, notes: '', resume_url: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Please fill in all required fields'); return;
    }
    setIsSubmitting(true);
    const result = await addLead(formData);
    if (result) { toast.success('Lead added successfully'); navigate('/employee/leads'); }
    setIsSubmitting(false);
  };

  return (
    <DashboardLayout requiredRole="employee">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/employee/leads"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
          <div><h1 className="text-2xl font-bold text-foreground">Add New Lead</h1><p className="text-muted-foreground">Enter candidate details</p></div>
        </div>
        <Card className="border-border/50">
          <CardHeader><CardTitle>Lead Information</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Candidate ID</Label><Input value={formData.candidate_id} disabled className="bg-muted font-mono" /></div>
                <div className="space-y-2"><Label>Full Name *</Label><Input value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Enter full name" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Email *</Label><Input type="email" value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} placeholder="email@example.com" /></div>
                <div className="space-y-2"><Label>Phone *</Label><Input value={formData.phone} onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))} placeholder="+91 9876543210" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Qualification</Label><Input value={formData.qualification} onChange={(e) => setFormData(p => ({ ...p, qualification: e.target.value }))} placeholder="B.Tech, MBA" /></div>
                <div className="space-y-2"><Label>Experience</Label><Input value={formData.past_experience} onChange={(e) => setFormData(p => ({ ...p, past_experience: e.target.value }))} placeholder="2 years" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Current CTC</Label><Input value={formData.current_ctc} onChange={(e) => setFormData(p => ({ ...p, current_ctc: e.target.value }))} placeholder="6 LPA" /></div>
                <div className="space-y-2"><Label>Expected CTC</Label><Input value={formData.expected_ctc} onChange={(e) => setFormData(p => ({ ...p, expected_ctc: e.target.value }))} placeholder="10 LPA" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Status</Label><Select value={formData.status} onValueChange={(v: LeadStatus) => setFormData(p => ({ ...p, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Source</Label><Select value={formData.source} onValueChange={(v: LeadSource) => setFormData(p => ({ ...p, source: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SOURCE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div className="space-y-2"><Label>Notes</Label><Textarea value={formData.notes} onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))} placeholder="Additional notes..." rows={3} /></div>
              <div className="flex justify-end gap-3 pt-4">
                <Link to="/employee/leads"><Button type="button" variant="outline">Cancel</Button></Link>
                <Button type="submit" className="gradient-primary gap-2" disabled={isSubmitting}>{isSubmitting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : <><Save className="h-4 w-4" />Save Lead</>}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AddLead;
