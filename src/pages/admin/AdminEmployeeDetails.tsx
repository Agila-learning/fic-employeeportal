import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, FolderOpen } from 'lucide-react';

const DRIVE_URL = 'https://drive.google.com/drive/folders/1-7PHoUruvtXV6JdKgXK8dE-xhfZaTz9l?usp=sharing';

const AdminEmployeeDetails = () => {
  const handleOpenDrive = () => {
    window.open(DRIVE_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employee Details</h1>
          <p className="text-muted-foreground">Access employee documents and files</p>
        </div>

        <Card className="border-border/50">
          <CardContent className="p-8 flex flex-col items-center gap-5 text-center">
            <div className="p-5 rounded-full bg-primary/10">
              <FolderOpen className="h-12 w-12 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Employee Documents Drive</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Click the button below to open the shared Google Drive folder containing all employee details and documents.
              </p>
            </div>
            <Button onClick={handleOpenDrive} size="lg" className="gap-2 mt-2">
              <ExternalLink className="h-4 w-4" />
              Open Google Drive
            </Button>
            <p className="text-xs text-muted-foreground">Opens in a new browser tab</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminEmployeeDetails;
