import { useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, FolderOpen } from 'lucide-react';

const DRIVE_URL = 'https://drive.google.com/drive/folders/1-7PHoUruvtXV6JdKgXK8dE-xhfZaTz9l?usp=sharing';

const AdminEmployeeDetails = () => {
  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employee Details</h1>
          <p className="text-muted-foreground">Access employee documents and files</p>
        </div>

        <Card className="border-border/50">
          <CardContent className="p-6 flex flex-col items-center gap-4 text-center">
            <div className="p-4 rounded-full bg-primary/10">
              <FolderOpen className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Employee Documents Drive</h2>
              <p className="text-sm text-muted-foreground mt-1">Click the button below to open the shared Google Drive folder containing employee details.</p>
            </div>
            <a href={DRIVE_URL} target="_blank" rel="noopener noreferrer">
              <Button className="gap-2 mt-2">
                <ExternalLink className="h-4 w-4" />
                Open Google Drive
              </Button>
            </a>
          </CardContent>
        </Card>

        <iframe
          src={DRIVE_URL}
          className="w-full rounded-xl border border-border/50 bg-card"
          style={{ height: 'calc(100vh - 320px)', minHeight: '400px' }}
          title="Employee Details Drive"
          allow="autoplay"
        />
      </div>
    </DashboardLayout>
  );
};

export default AdminEmployeeDetails;
