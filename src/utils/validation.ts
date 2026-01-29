/**
 * Zod validation schemas for server-side input validation
 * These schemas validate all user-submitted data before database operations
 */

import { z } from 'zod';
import { sanitizeText, sanitizeEmail, sanitizePhone, stripHtml } from './sanitize';

// Custom refinements
const sanitizedString = (maxLength: number) => 
  z.string()
    .max(maxLength)
    .transform(val => sanitizeText(val.trim()));

const sanitizedOptionalString = (maxLength: number) => 
  z.string()
    .max(maxLength)
    .transform(val => val ? sanitizeText(val.trim()) : '')
    .optional()
    .nullable();

// Lead validation schema
export const LeadSchema = z.object({
  candidate_id: z.string()
    .min(1, 'Candidate ID is required')
    .max(20, 'Candidate ID must be 20 characters or less')
    .regex(/^FIC\d{5}$/, 'Invalid candidate ID format (expected: FIC followed by 5 digits)')
    .transform(val => val.trim()),
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .transform(val => sanitizeText(val.trim())),
  email: z.string()
    .max(255, 'Email must be 255 characters or less')
    .transform(val => val ? sanitizeEmail(val) : '')
    .refine(val => !val || val.includes('@'), 'Invalid email format')
    .optional()
    .nullable(),
  phone: z.string()
    .min(7, 'Phone number must be at least 7 characters')
    .max(20, 'Phone number must be 20 characters or less')
    .regex(/^[0-9+\-() ]{7,20}$/, 'Invalid phone number format')
    .transform(val => sanitizePhone(val)),
  qualification: sanitizedOptionalString(200),
  past_experience: sanitizedOptionalString(500),
  current_ctc: sanitizedOptionalString(50),
  expected_ctc: sanitizedOptionalString(50),
  notes: z.string()
    .max(5000, 'Notes must be 5000 characters or less')
    .transform(val => val ? stripHtml(val.trim()) : '')
    .optional()
    .nullable(),
  status: z.enum(['nc1', 'nc2', 'nc3', 'rejected', 'not_interested', 'not_interested_paid', 'different_domain', 'converted', 'follow_up', 'success']).optional(),
  source: z.enum(['social_media', 'own_source', 'college', 'referral', 'job_portal', 'website', 'other']).optional(),
  interested_domain: z.enum(['it', 'non_it', 'banking']).optional().nullable(),
  payment_stage: z.enum(['registration_done', 'initial_payment_done', 'full_payment_done']).optional().nullable(),
  resume_url: z.string().max(500).optional().nullable(),
  payment_slip_url: z.string().max(500).optional().nullable(),
  followup_date: z.string().optional().nullable(),
});

export const LeadUpdateSchema = LeadSchema.partial();

// Comment validation schema
export const CommentSchema = z.object({
  comment: z.string()
    .min(1, 'Comment cannot be empty')
    .max(2000, 'Comment must be 2000 characters or less')
    .transform(val => stripHtml(val.trim())),
});

// Profile/Employee validation schema
export const ProfileSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .transform(val => sanitizeText(val.trim())),
  email: z.string()
    .min(1, 'Email is required')
    .max(255, 'Email must be 255 characters or less')
    .email('Invalid email format')
    .transform(val => sanitizeEmail(val)),
  employee_id: z.string()
    .max(50, 'Employee ID must be 50 characters or less')
    .transform(val => val ? sanitizeText(val.trim()) : '')
    .optional()
    .nullable(),
  phone: z.string()
    .max(20, 'Phone number must be 20 characters or less')
    .transform(val => val ? sanitizePhone(val) : '')
    .optional()
    .nullable(),
  is_active: z.boolean().optional(),
});

export const ProfileUpdateSchema = ProfileSchema.partial();

// Task validation schema
export const TaskSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less')
    .transform(val => sanitizeText(val.trim())),
  description: z.string()
    .max(2000, 'Description must be 2000 characters or less')
    .transform(val => val ? stripHtml(val.trim()) : null)
    .optional()
    .nullable(),
  assigned_to: z.string().uuid('Invalid assignee ID'),
  due_date: z.string().optional().nullable(),
});

export const TaskUpdateSchema = TaskSchema.partial();

// Announcement validation schema
export const AnnouncementSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less')
    .transform(val => sanitizeText(val.trim())),
  message: z.string()
    .min(1, 'Message is required')
    .max(5000, 'Message must be 5000 characters or less')
    .transform(val => stripHtml(val.trim())),
});

// Attendance validation schema
export const AttendanceSchema = z.object({
  status: z.enum(['present', 'absent']),
  leave_reason: z.string()
    .max(500, 'Leave reason must be 500 characters or less')
    .transform(val => val ? stripHtml(val.trim()) : null)
    .optional()
    .nullable(),
});

// Validation result type - using explicit discriminated union
type ValidationSuccess<T> = { success: true; data: T; error: null };
type ValidationError = { success: false; data: null; error: string };
type ValidationResult<T> = ValidationSuccess<T> | ValidationError;

// Helper function to validate and return result
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return { success: false, data: null, error: firstError?.message || 'Validation failed' };
    }
    return { success: false, data: null, error: 'Validation failed' };
  }
}

// Safe parse that returns null on failure (for partial updates)
export function safeValidate<T>(schema: z.ZodSchema<T>, data: unknown): T | null {
  const result = schema.safeParse(data);
  return result.success ? result.data : null;
}
