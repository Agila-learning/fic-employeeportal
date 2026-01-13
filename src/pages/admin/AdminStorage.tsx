import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  HardDrive, 
  File, 
  FileText, 
  Receipt, 
  RefreshCw, 
  Search,
  Trash2,
  AlertTriangle,
  Calendar,
  User,
  Download,
  FolderOpen
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { formatFileSize } from '@/utils/fileUtils';

interface StorageFile {
  name: string;
  id: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

interface BucketStats {
  name: string;
  fileCount: number;
  totalSize: number;
  files: StorageFile[];
}

const AdminStorage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [bucketStats, setBucketStats] = useState<BucketStats[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBucket, setSelectedBucket] = useState<string>('all');
  const [leadData, setLeadData] = useState<Record<string, { name: string; candidate_id: string; status: string }>>({});

  const fetchStorageData = async () => {
    try {
      // Fetch files from both buckets
      const buckets = ['resumes', 'payment-slips'];
      const stats: BucketStats[] = [];

      for (const bucket of buckets) {
        const { data: files, error } = await supabase.storage
          .from(bucket)
          .list('', { limit: 1000, sortBy: { column: 'created_at', order: 'desc' } });

        if (error) {
          if (import.meta.env.DEV) console.error(`Error fetching ${bucket}:`, error);
          stats.push({ name: bucket, fileCount: 0, totalSize: 0, files: [] });
          continue;
        }

        // Filter out folders
        const actualFiles = (files || []).filter(f => f.id && f.metadata);
        const totalSize = actualFiles.reduce((sum, f) => sum + (Number(f.metadata?.size) || 0), 0);

        stats.push({
          name: bucket,
          fileCount: actualFiles.length,
          totalSize,
          files: actualFiles.map(f => ({
            name: f.name,
            id: f.id || '',
            created_at: f.created_at || new Date().toISOString(),
            metadata: f.metadata || null,
          })),
        });
      }

      setBucketStats(stats);

      // Fetch lead data to map files to candidates
      const { data: leads } = await supabase
        .from('leads')
        .select('id, name, candidate_id, status, resume_url, payment_slip_url');

      if (leads) {
        const leadMap: Record<string, { name: string; candidate_id: string; status: string }> = {};
        leads.forEach(lead => {
          if (lead.resume_url) {
            const fileName = lead.resume_url.split('/').pop() || '';
            leadMap[fileName] = { name: lead.name, candidate_id: lead.candidate_id, status: lead.status };
          }
          if (lead.payment_slip_url) {
            const fileName = lead.payment_slip_url.split('/').pop() || '';
            leadMap[fileName] = { name: lead.name, candidate_id: lead.candidate_id, status: lead.status };
          }
        });
        setLeadData(leadMap);
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching storage data:', error);
      toast.error('Failed to fetch storage data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStorageData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchStorageData();
    setIsRefreshing(false);
    toast.success('Storage data refreshed');
  };

  const totalFiles = bucketStats.reduce((sum, b) => sum + b.fileCount, 0);
  const totalSize = bucketStats.reduce((sum, b) => sum + b.totalSize, 0);

  const allFiles = useMemo(() => {
    let files: (StorageFile & { bucket: string })[] = [];
    bucketStats.forEach(bucket => {
      bucket.files.forEach(file => {
        files.push({ ...file, bucket: bucket.name });
      });
    });

    // Filter by bucket
    if (selectedBucket !== 'all') {
      files = files.filter(f => f.bucket === selectedBucket);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      files = files.filter(f => {
        const lead = leadData[f.name];
        return f.name.toLowerCase().includes(query) ||
          lead?.name.toLowerCase().includes(query) ||
          lead?.candidate_id.toLowerCase().includes(query);
      });
    }

    return files.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [bucketStats, selectedBucket, searchQuery, leadData]);

  const getFileSize = (file: StorageFile) => Number(file.metadata?.size) || 0;

  const getRetentionStatus = (file: StorageFile & { bucket: string }) => {
    const daysSinceUpload = differenceInDays(new Date(), new Date(file.created_at));
    const lead = leadData[file.name];

    if (file.bucket === 'resumes') {
      // Rejected resumes: 90 days retention
      if (lead?.status === 'rejected') {
        const daysLeft = 90 - daysSinceUpload;
        if (daysLeft <= 0) return { status: 'expired', label: 'Pending Deletion', color: 'bg-red-100 text-red-700' };
        if (daysLeft <= 7) return { status: 'expiring', label: `${daysLeft}d left`, color: 'bg-amber-100 text-amber-700' };
        return { status: 'ok', label: `${daysLeft}d retention`, color: 'bg-green-100 text-green-700' };
      }
      return { status: 'active', label: 'Active', color: 'bg-blue-100 text-blue-700' };
    }

    if (file.bucket === 'payment-slips') {
      // Payment slips: 12 months retention
      const daysLeft = 365 - daysSinceUpload;
      if (daysLeft <= 0) return { status: 'expired', label: 'Pending Deletion', color: 'bg-red-100 text-red-700' };
      if (daysLeft <= 30) return { status: 'expiring', label: `${daysLeft}d left`, color: 'bg-amber-100 text-amber-700' };
      return { status: 'ok', label: `${Math.floor(daysLeft / 30)}mo retention`, color: 'bg-green-100 text-green-700' };
    }

    return { status: 'unknown', label: 'Unknown', color: 'bg-gray-100 text-gray-700' };
  };

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <HardDrive className="h-6 w-6 text-blue-500" />
              Storage Dashboard
            </h1>
            <p className="text-muted-foreground">Manage and monitor file storage</p>
          </div>
          <Button onClick={handleRefresh} variant="outline" className="gap-2" disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-blue-500" />
                <span className="text-sm text-blue-600 dark:text-blue-400">Total Files</span>
              </div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-400 mt-1">{totalFiles}</div>
            </CardContent>
          </Card>
          <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-purple-500" />
                <span className="text-sm text-purple-600 dark:text-purple-400">Total Size</span>
              </div>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-400 mt-1">{formatFileSize(totalSize)}</div>
            </CardContent>
          </Card>
          <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-500" />
                <span className="text-sm text-emerald-600 dark:text-emerald-400">Resumes</span>
              </div>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                {bucketStats.find(b => b.name === 'resumes')?.fileCount || 0}
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-amber-500" />
                <span className="text-sm text-amber-600 dark:text-amber-400">Payment Slips</span>
              </div>
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-400 mt-1">
                {bucketStats.find(b => b.name === 'payment-slips')?.fileCount || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bucket Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bucketStats.map(bucket => (
            <Card key={bucket.name}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  {bucket.name === 'resumes' ? (
                    <FileText className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Receipt className="h-5 w-5 text-amber-500" />
                  )}
                  {bucket.name === 'resumes' ? 'Resumes' : 'Payment Slips'}
                </CardTitle>
                <CardDescription>
                  {bucket.name === 'resumes' 
                    ? 'Rejected candidates: 90 days retention' 
                    : 'All slips: 12 months retention'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Files</span>
                    <span className="font-medium">{bucket.fileCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Size</span>
                    <span className="font-medium">{formatFileSize(bucket.totalSize)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avg File Size</span>
                    <span className="font-medium">
                      {bucket.fileCount > 0 ? formatFileSize(bucket.totalSize / bucket.fileCount) : '0 B'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Files List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="text-lg">All Files</CardTitle>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={selectedBucket === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedBucket('all')}
                  >
                    All
                  </Button>
                  <Button
                    variant={selectedBucket === 'resumes' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedBucket('resumes')}
                  >
                    Resumes
                  </Button>
                  <Button
                    variant={selectedBucket === 'payment-slips' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedBucket('payment-slips')}
                  >
                    Slips
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : allFiles.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No files found</p>
                <p className="text-sm">Adjust your search or filters</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {allFiles.slice(0, 50).map((file) => {
                  const lead = leadData[file.name];
                  const retention = getRetentionStatus(file);
                  
                  return (
                    <div key={`${file.bucket}-${file.id}`} className="py-3 flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`p-2 rounded-lg ${file.bucket === 'resumes' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                          {file.bucket === 'resumes' ? (
                            <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Receipt className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{formatFileSize(getFileSize(file))}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(file.created_at), 'MMM d, yyyy')}
                            </span>
                            {lead && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {lead.candidate_id}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-11 sm:ml-0">
                        <Badge variant="outline" className="text-xs">
                          {file.bucket === 'resumes' ? 'Resume' : 'Payment Slip'}
                        </Badge>
                        <Badge className={`text-xs ${retention.color}`}>
                          {retention.status === 'expired' && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {retention.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
                {allFiles.length > 50 && (
                  <div className="py-4 text-center text-sm text-muted-foreground">
                    Showing first 50 of {allFiles.length} files
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Retention Policy Info */}
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800 dark:text-amber-400">Automatic Cleanup Policy</h4>
                <p className="text-sm text-amber-700 dark:text-amber-500 mt-1">
                  Resumes of rejected candidates are automatically deleted after 90 days. 
                  Payment slips are retained for 12 months for compliance purposes. 
                  A daily cleanup job handles file removal and database reference updates.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminStorage;
