import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LeadStatus, LeadSource, STATUS_OPTIONS, SOURCE_OPTIONS } from '@/types';
import { useLeads } from '@/contexts/LeadsContext';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Upload, ArrowLeft, Save } from 'lucide-react';
import { Link } from 'react-router-dom';

const generateCandidateId = () => {
  const prefix = 'CND';
  const number = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}${number}`;
};

const AddLead = () => {
  const navigate = useNavigate();
  const { addLead } = useLeads();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    candidateId: generateCandidateId(),
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    addLead({
      ...formData,
      assignedTo: user?.id || '',
    });
    
    toast.success('Lead added successfully');
    navigate('/employee/leads');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, resumeUrl: file.name }));
      toast.success('Resume uploaded: ' + file.name);
    }
  };

  return (
    <DashboardLayout requiredRole="employee">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/employee/leads">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Add New Lead</h1>
            <p className="text-muted-foreground">Enter candidate details to create a new lead</p>
          </div>
        </div>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Lead Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
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
                    placeholder="B.Tech, MBA, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience">Past Experience</Label>
                  <Input
                    id="experience"
                    value={formData.pastExperience}
                    onChange={(e) => setFormData(prev => ({ ...prev, pastExperience: e.target.value }))}
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
                    placeholder="6 LPA"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expectedCtc">Expected CTC</Label>
                  <Input
                    id="expectedCtc"
                    value={formData.expectedCtc}
                    onChange={(e) => setFormData(prev => ({ ...prev, expectedCtc: e.target.value }))}
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
                <label className="cursor-pointer block">
                  <div className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 transition-colors hover:border-primary hover:bg-muted/50">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {formData.resumeUrl || 'Click to upload resume (PDF, DOC, DOCX)'}
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

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about the candidate..."
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <Link to="/employee/leads">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" className="gradient-primary gap-2">
                  <Save className="h-4 w-4" />
                  Save Lead
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AddLead;
