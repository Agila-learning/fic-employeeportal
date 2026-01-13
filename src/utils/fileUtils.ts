import { supabase } from '@/integrations/supabase/client';

// File size limits
export const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
export const TARGET_COMPRESSED_SIZE_KB = 250; // Target 200-300 KB

// Allowed file types
export const ALLOWED_FILE_TYPES = {
  resume: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  paymentSlip: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
};

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  file?: File;
}

export interface CompressionResult {
  success: boolean;
  file?: File;
  error?: string;
  originalSize: number;
  compressedSize: number;
}

/**
 * Validates file type and size before upload
 */
export const validateFile = (
  file: File,
  fileType: 'resume' | 'paymentSlip'
): FileValidationResult => {
  const allowedTypes = ALLOWED_FILE_TYPES[fileType];
  
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    const typeNames = fileType === 'resume' 
      ? 'PDF or Word documents' 
      : 'JPEG, PNG, WebP images or PDF';
    return {
      valid: false,
      error: `Invalid file type. Please upload ${typeNames}.`,
    };
  }

  // Check file size (reject if > 2 MB)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File is too large (${sizeMB} MB). Maximum allowed size is 2 MB. Please compress your file before uploading.`,
    };
  }

  return { valid: true, file };
};

/**
 * Compresses an image file to target size
 * Uses canvas API for JPEG/PNG compression
 */
export const compressImage = async (
  file: File,
  targetSizeKB: number = TARGET_COMPRESSED_SIZE_KB
): Promise<CompressionResult> => {
  const originalSize = file.size;

  // Only compress images
  if (!file.type.startsWith('image/')) {
    return {
      success: true,
      file,
      originalSize,
      compressedSize: originalSize,
    };
  }

  // If already under target size, no need to compress
  if (file.size <= targetSizeKB * 1024) {
    return {
      success: true,
      file,
      originalSize,
      compressedSize: originalSize,
    };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        
        // Scale down if very large
        const maxDimension = 1920;
        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve({
            success: false,
            error: 'Failed to create canvas context',
            originalSize,
            compressedSize: originalSize,
          });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Try different quality levels to hit target size
        let quality = 0.8;
        let compressedBlob: Blob | null = null;

        const tryCompress = (q: number): Promise<Blob | null> => {
          return new Promise((res) => {
            canvas.toBlob(
              (blob) => res(blob),
              'image/jpeg',
              q
            );
          });
        };

        (async () => {
          // Progressive compression
          for (let q = 0.8; q >= 0.3; q -= 0.1) {
            compressedBlob = await tryCompress(q);
            if (compressedBlob && compressedBlob.size <= targetSizeKB * 1024) {
              quality = q;
              break;
            }
          }

          if (!compressedBlob) {
            compressedBlob = await tryCompress(0.3);
          }

          if (compressedBlob) {
            const compressedFile = new File(
              [compressedBlob],
              file.name.replace(/\.[^.]+$/, '.jpg'),
              { type: 'image/jpeg' }
            );
            resolve({
              success: true,
              file: compressedFile,
              originalSize,
              compressedSize: compressedFile.size,
            });
          } else {
            resolve({
              success: false,
              error: 'Compression failed',
              originalSize,
              compressedSize: originalSize,
            });
          }
        })();
      };

      img.onerror = () => {
        resolve({
          success: false,
          error: 'Failed to load image',
          originalSize,
          compressedSize: originalSize,
        });
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      resolve({
        success: false,
        error: 'Failed to read file',
        originalSize,
        compressedSize: originalSize,
      });
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Generates a file hash for duplicate detection
 * Uses a combination of file name, size, and content sampling
 */
export const generateFileHash = async (file: File): Promise<string> => {
  const buffer = await file.slice(0, 8192).arrayBuffer(); // First 8KB sample
  const hashArray = new Uint8Array(buffer);
  
  // Simple hash based on file characteristics
  let hash = `${file.size}-${file.type}-`;
  let sum = 0;
  for (let i = 0; i < hashArray.length; i++) {
    sum = ((sum << 5) - sum + hashArray[i]) | 0;
  }
  hash += Math.abs(sum).toString(36);
  
  return hash;
};

/**
 * Checks if a similar file already exists for this candidate
 * Prevents re-upload of the same resume
 */
export const checkDuplicateFile = async (
  candidateId: string,
  fileHash: string,
  bucket: 'resumes' | 'payment-slips'
): Promise<{ isDuplicate: boolean; existingPath?: string }> => {
  try {
    // Check if candidate already has a file in this bucket by looking at leads table
    const column = bucket === 'resumes' ? 'resume_url' : 'payment_slip_url';
    
    const { data, error } = await supabase
      .from('leads')
      .select(`id, ${column}`)
      .eq('candidate_id', candidateId)
      .not(column, 'is', null)
      .maybeSingle();

    if (error || !data) {
      return { isDuplicate: false };
    }

    const existingUrl = data[column as keyof typeof data] as string | null;
    
    // If there's an existing file, it's a duplicate
    if (existingUrl) {
      return { 
        isDuplicate: true, 
        existingPath: existingUrl 
      };
    }

    return { isDuplicate: false };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[DEV] Error checking duplicate:', error);
    }
    return { isDuplicate: false };
  }
};

/**
 * Deletes an old file from storage when replacing
 */
export const deleteOldFile = async (
  storedPath: string
): Promise<boolean> => {
  try {
    // Parse stored path format "bucket:path"
    const [bucket, ...pathParts] = storedPath.split(':');
    const path = pathParts.join(':');
    
    if (!bucket || !path) {
      return false;
    }

    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      if (import.meta.env.DEV) {
        console.error('[DEV] Error deleting old file:', error);
      }
      return false;
    }

    return true;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[DEV] Error in deleteOldFile:', error);
    }
    return false;
  }
};

/**
 * Formats file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

/**
 * Prepares a file for upload with validation and compression
 */
export const prepareFileForUpload = async (
  file: File,
  fileType: 'resume' | 'paymentSlip',
  candidateId?: string
): Promise<{
  success: boolean;
  file?: File;
  error?: string;
  compressionInfo?: string;
}> => {
  // Step 1: Validate file
  const validation = validateFile(file, fileType);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // Step 2: Check for duplicates if candidateId provided
  if (candidateId) {
    const bucket = fileType === 'resume' ? 'resumes' : 'payment-slips';
    const duplicate = await checkDuplicateFile(candidateId, '', bucket);
    
    if (duplicate.isDuplicate && duplicate.existingPath) {
      // Delete the old file when replacing
      await deleteOldFile(duplicate.existingPath);
    }
  }

  // Step 3: Compress image files (payment slips)
  if (file.type.startsWith('image/')) {
    const compression = await compressImage(file);
    
    if (compression.success && compression.file) {
      const savedBytes = compression.originalSize - compression.compressedSize;
      const compressionInfo = savedBytes > 0
        ? `Compressed from ${formatFileSize(compression.originalSize)} to ${formatFileSize(compression.compressedSize)}`
        : undefined;
      
      return {
        success: true,
        file: compression.file,
        compressionInfo,
      };
    }
  }

  return { success: true, file };
};
