// Authentication and session management for the affiliate platform
import { type User, Role, UserStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';
import crypto from 'crypto';

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: string;
  phone?: string;
  website?: string;
  promotionMethod?: string;
  programId?: string;
}

class AuthService {
  private readonly TOKEN_EXPIRY_HOURS = 24;

  private generateReferralCode(name: string): string {
    const cleanName = name.replace(/[^a-zA-Z]/g, '').toUpperCase();
    const random = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 4);
    return `${cleanName.substr(0, 6)}-${random}`;
  }

  /**
   * Register a new user and create their profile.
   * This is a server-side only method.
   */
  async register(data: RegisterData): Promise<{ success: boolean; message: string; user?: User; affiliate?: any }> {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email }
      });

      if (existingUser) {
        return { success: false, message: 'User already exists with this email' };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 12);

      // Determine initial status based on role
      const userRoleLower = data.role.toLowerCase();
      const initialStatus = userRoleLower === 'admin' ? 'ACTIVE' : 'PENDING';

      // Create user using prisma client directly or db service
      const user = await prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          password: hashedPassword,
          role: data.role.toUpperCase() as Role,
          status: initialStatus as UserStatus
        }
      });

      let affiliate = null;
      // If affiliate, create affiliate record
      if (userRoleLower === 'affiliate') {
        const referralCode = this.generateReferralCode(data.name);

        let resolvedProgram = null;
        if (data.programId) {
          resolvedProgram = await prisma.program.findUnique({ where: { id: data.programId } }).catch(() => null);
        }

        // If not found or not provided, auto-match from phone prefix
        if (!resolvedProgram && data.phone) {
          const cleanPhone = data.phone.trim();
          if (cleanPhone.startsWith('+254') || cleanPhone.startsWith('254')) {
            resolvedProgram = await prisma.program.findFirst({
              where: {
                OR: [
                  { countryCode: 'KE' },
                  { currency: 'KES' },
                  { name: { contains: 'Kenya', mode: 'insensitive' } },
                  { name: { contains: 'Keyan', mode: 'insensitive' } },
                ],
              },
            });
          } else if (cleanPhone.startsWith('+234') || cleanPhone.startsWith('234')) {
            resolvedProgram = await prisma.program.findFirst({
              where: {
                OR: [
                  { countryCode: 'NG' },
                  { currency: 'NGN' },
                  { name: { contains: 'Nigeria', mode: 'insensitive' } },
                ],
              },
            });
          }
        }

        // Fallback to default or active program
        if (!resolvedProgram) {
          resolvedProgram = (await prisma.program.findFirst({ where: { isDefault: true, isActive: true } }))
            || (await prisma.program.findFirst({ where: { isActive: true } }));
        }

        const countryName = resolvedProgram?.countryName || (resolvedProgram?.currency === 'KES' ? 'Kenya' : 'Nigeria');

        affiliate = await prisma.affiliate.create({
          data: {
            userId: user.id,
            referralCode,
            programId: resolvedProgram?.id || null,
            payoutDetails: {
              phone: data.phone || null,
              website: data.website || null,
              promotionMethod: data.promotionMethod || null,
              country: countryName,
              currency: resolvedProgram?.currency || 'NGN',
            },
            balanceCents: 0,
          },
          include: {
            program: true,
          },
        });
      }

      return {
        success: true,
        message: 'Registration successful',
        user: user,
        affiliate: affiliate,
      };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Registration failed' };
    }
  }

  /**
   * Update a user's password.
   * Server-side only.
   */
  async updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return { success: false, message: 'Current password is incorrect' };
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      });

      return { success: true, message: 'Password updated successfully' };
    } catch (error) {
      console.error('Update password error:', error);
      return { success: false, message: 'Password update failed' };
    }
  }
}

export const auth = new AuthService();