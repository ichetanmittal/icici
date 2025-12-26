'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signUp } from '@/lib/auth';
import { UserRole, isFunderRole } from '@/types/user';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationToken = searchParams.get('invitation');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: '' as UserRole,
    companyName: '',
    contactPerson: '',
    phoneNumber: '',
    treasuryBalance: '',
    geography: '',
    creditLimit: '',
    bankAccountNumber: '',
    swiftCode: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isInvited, setIsInvited] = useState(false);
  const [loadingInvitation, setLoadingInvitation] = useState(false);

  // Fetch invitation details if token is present
  useEffect(() => {
    if (invitationToken) {
      setLoadingInvitation(true);
      fetch(`/api/invitation/${invitationToken}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            setError(data.error);
          } else {
            // Pre-fill form with invitation data
            // Use invitedRole from API (can be 'importer' or 'exporter')
            const role = data.invitedRole === 'exporter' ? UserRole.EXPORTER : UserRole.IMPORTER;

            setFormData(prev => ({
              ...prev,
              role: role,
              companyName: data.entityName,
              contactPerson: data.pocName,
              email: data.pocEmail,
              phoneNumber: data.pocPhone,
              geography: data.geography,
              creditLimit: data.creditLimit || '',
              bankAccountNumber: data.bankAccountNumber,
              swiftCode: data.swiftCode,
            }));
            setIsInvited(true);
          }
        })
        .catch(err => {
          setError('Failed to load invitation details');
        })
        .finally(() => {
          setLoadingInvitation(false);
        });
    }
  }, [invitationToken]);

  const roleOptions = [
    { value: UserRole.EXPORTER, label: 'Exporter' },
    { value: UserRole.IMPORTER, label: 'Importer' },
    { value: UserRole.GIFT_IBU_MAKER, label: 'Gift IBU Funder - Maker (POC)' },
    { value: UserRole.GIFT_IBU_CHECKER, label: 'Gift IBU Funder - Checker' },
    { value: UserRole.DBS_BANK_MAKER, label: 'DBS Bank Importer - Maker (POC)' },
    { value: UserRole.DBS_BANK_CHECKER, label: 'DBS Bank Importer - Checker' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!formData.role) {
      setError('Please select a role');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (isFunderRole(formData.role) && !formData.treasuryBalance) {
      setError('Treasury balance is required for funder roles');
      return;
    }

    if (formData.treasuryBalance && parseFloat(formData.treasuryBalance) < 0) {
      setError('Treasury balance must be a positive number');
      return;
    }

    setLoading(true);

    try {
      const signUpData: any = {
        email: formData.email,
        password: formData.password,
        role: formData.role,
        companyName: formData.companyName,
        contactPerson: formData.contactPerson,
        phoneNumber: formData.phoneNumber,
      };

      if (isFunderRole(formData.role) && formData.treasuryBalance) {
        signUpData.treasuryBalance = parseFloat(formData.treasuryBalance);
      }

      // If user registered via invitation, include geography, credit limit, banking info, and bank name
      if (invitationToken && formData.geography) {
        signUpData.geography = formData.geography;
      }

      if (invitationToken && formData.creditLimit) {
        signUpData.creditLimit = parseFloat(formData.creditLimit);
      }

      if (invitationToken && formData.bankAccountNumber) {
        signUpData.bankAccountNumber = formData.bankAccountNumber;
      }

      if (invitationToken && formData.swiftCode) {
        signUpData.swiftCode = formData.swiftCode;
      }

      if (invitationToken) {
        // Set bank name based on role - DBS Bank invites importers, Gift IBU invites exporters
        if (formData.role === UserRole.EXPORTER) {
          signUpData.bankName = 'Gift IBU';
        } else if (formData.role === UserRole.IMPORTER) {
          signUpData.bankName = 'DBS Bank';
        }
      }

      const { data, error } = await signUp(signUpData);

      if (error) {
        setError(error instanceof Error ? error.message : 'Failed to create account');
        setLoading(false);
        return;
      }

      if (data?.user) {
        // If user registered via invitation, mark it as accepted
        if (invitationToken) {
          try {
            await fetch(`/api/invitation/${invitationToken}/accept`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: data.user.id }),
            });
          } catch (err) {
            console.error('Failed to mark invitation as accepted:', err);
            // Don't block registration if this fails
          }
        }

        // Redirect to appropriate dashboard based on role
        if (formData.role === UserRole.DBS_BANK_MAKER || formData.role === UserRole.DBS_BANK_CHECKER) {
          router.push('/bank/dashboard');
        } else if (formData.role === UserRole.GIFT_IBU_MAKER || formData.role === UserRole.GIFT_IBU_CHECKER) {
          router.push('/funder/dashboard');
        } else if (formData.role === UserRole.IMPORTER) {
          router.push('/importer/dashboard');
        } else if (formData.role === UserRole.EXPORTER) {
          router.push('/exporter/dashboard');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (loadingInvitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-gray-600">Loading invitation details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {isInvited && (
            <div className="rounded-md bg-blue-50 p-4 border border-blue-200">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-blue-800 font-medium">
                  Registering via Invitation - Some fields are pre-filled and cannot be changed
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                name="role"
                required
                value={formData.role}
                onChange={handleChange}
                disabled={isInvited}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Select your role</option>
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                disabled={isInvited}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                required
                value={formData.companyName}
                onChange={handleChange}
                disabled={isInvited}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Your company name"
              />
            </div>

            <div>
              <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700">
                Contact Person Name <span className="text-red-500">*</span>
              </label>
              <input
                id="contactPerson"
                name="contactPerson"
                type="text"
                required
                value={formData.contactPerson}
                onChange={handleChange}
                disabled={isInvited}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                required
                value={formData.phoneNumber}
                onChange={handleChange}
                disabled={isInvited}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="+91 9876543210"
              />
            </div>

            {formData.role && isFunderRole(formData.role) && (
              <div>
                <label htmlFor="treasuryBalance" className="block text-sm font-medium text-gray-700">
                  Initial Treasury Balance <span className="text-red-500">*</span>
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-gray-500 sm:text-sm">₹</span>
                  </div>
                  <input
                    id="treasuryBalance"
                    name="treasuryBalance"
                    type="number"
                    step="0.01"
                    min="0"
                    required={isFunderRole(formData.role)}
                    value={formData.treasuryBalance}
                    onChange={handleChange}
                    className="block w-full rounded-md border border-gray-300 pl-7 pr-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    placeholder="0.00"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {formData.role === UserRole.GIFT_IBU_MAKER || formData.role === UserRole.GIFT_IBU_CHECKER
                    ? 'ICICI Gift IBU initial fund amount'
                    : 'DBS Bank initial fund amount'}
                </p>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                placeholder="Min. 6 characters"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                placeholder="Re-enter password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </div>
        </form>
      </div>
    </div>
  );
}
