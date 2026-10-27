import { z } from 'zod';

export const positions = ['frontend', 'backend', 'mobile', 'design', 'qa', 'devops', 'data', 'support'] as const;

export const applicationSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  email: z.email(),
  phone: z.string().trim().min(6),
  dateOfBirth: z.iso.date(),
  addressLine1: z.string().trim().min(1),
  addressLine2: z.string().trim().optional(),
  city: z.string().trim().min(1),
  postalCode: z.string().trim().min(3).max(10),
  country: z.string().length(2),
  position: z.enum(positions),
  startDate: z.iso.date(),
  salaryExpectationMinor: z.number().int().positive().optional(),
  portfolioUrl: z.url().optional(),
  coverLetter: z.string().trim().max(2000),
  consentToContact: z.boolean(),
});

export type Application = z.infer<typeof applicationSchema>;
