import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ExternalLink, Loader2 } from 'lucide-react';

interface SecureFileLinkProps {
  storedPath: string | null | undefined;
  label: string;
  className?: string;
}

/**
 * Component that generates short-expiry signed URLs for private storage files
 * on-demand when the user clicks to view. This prevents URL sharing and
 * ensures only authorized users can access files.
 */
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
        const { data, error } = await supabase.storage
          .from(bucket)
          .createSignedUrl(filePath, 900); // 15 minute expiry for security

        if (error) throw error;
        url = data.signedUrl;
      } else {
        // Legacy: if it's already a signed URL or public URL, use as-is
        // Note: Old signed URLs may have expired
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
