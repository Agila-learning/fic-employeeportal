import { useState } from 'react';
import { leadService } from '@/api/leadService';
import { toast } from 'sonner';
import { ExternalLink, Loader2 } from 'lucide-react';

interface SecureFileLinkProps {
  storedPath: string | null | undefined;
  label: string;
  className?: string;
}

const SecureFileLink = ({ storedPath, label, className = '' }: SecureFileLinkProps) => {
  const [isLoading, setIsLoading] = useState(false);

  if (!storedPath) {
    return <span className="text-muted-foreground">No file uploaded</span>;
  }

  const handleViewFile = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let url: string | null = null;

      // Check if it's new format (bucket:path) or legacy full URL
      if (storedPath.includes(':') && !storedPath.startsWith('http')) {
        const [bucket, filePath] = storedPath.split(':');
        const data = await leadService.getSignedUrl(bucket, filePath);
        url = data.signedUrl;
      } else {
        url = storedPath;
      }

      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('[DEV] Error generating signed URL:', error);
      }
      toast.error('Failed to access file. The file may have been deleted or you may not have permission.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleViewFile}
      disabled={isLoading}
      className={`text-primary hover:underline inline-flex items-center gap-1.5 ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          <span>{label}</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </>
      )}
    </button>
  );
};

export default SecureFileLink;
