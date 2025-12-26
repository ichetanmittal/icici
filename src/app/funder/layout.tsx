'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, getUserProfile, signOut } from '@/lib/auth';
import { UserRole } from '@/types/user';

const navigation = [
  { name: 'Dashboard', href: '/funder/dashboard' },
  { name: 'Outstanding PTTs', href: '/funder/ptts' },
  { name: 'Settlements', href: '/funder/settlements' },
  { name: 'Pending Approvals', href: '/funder/approvals' },
  { name: 'Documents', href: '/funder/documents' },
  { name: 'Blacklist', href: '/funder/blacklist' },
];

export default function FunderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadUser = async () => {
      const { user, error } = await getCurrentUser();

      if (error || !user) {
        router.push('/login');
        return;
      }

      const { data: profileData } = await getUserProfile(user.id);

      if (!profileData || (profileData.role !== UserRole.GIFT_IBU_MAKER && profileData.role !== UserRole.GIFT_IBU_CHECKER)) {
        router.push('/dashboard');
        return;
      }

      setUser(user);
      setProfile(profileData);
      setLoading(false);
    };

    loadUser();
  }, [router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const getOrganizationName = () => {
    return 'Gift IBU Funder';
  };

  const getUserRole = () => {
    if (profile?.role === UserRole.GIFT_IBU_MAKER) {
      return 'Maker';
    }
    if (profile?.role === UserRole.GIFT_IBU_CHECKER) {
      return 'Checker';
    }
    return '';
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-700 shadow-lg">
        <div className="mx-auto flex h-16 max-w-full items-center justify-between px-8">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-white tracking-wide">
              xaults<span className="text-blue-300">*</span>
            </h1>
          </div>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-4 focus:outline-none"
            >
              <div className="text-right">
                <p className="text-sm font-semibold text-white">{profile?.contact_person || 'User'}</p>
                <p className="text-xs text-blue-200">{getUserRole()}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-blue-700 font-bold text-lg cursor-pointer hover:bg-blue-50 transition-colors">
                {profile?.contact_person?.charAt(0).toUpperCase() || 'G'}
              </div>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-lg bg-white shadow-xl border border-gray-200 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-200">
                  <p className="text-lg font-bold text-gray-900">{profile?.contact_person || 'User'}</p>
                  <p className="text-sm text-gray-600 mt-1">Role: {getUserRole()}</p>
                  <p className="text-sm text-gray-600">Organization: {getOrganizationName()}</p>
                  <p className="text-sm text-gray-500 mt-2">{user?.email}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 font-medium transition-colors"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 bg-white shadow-md min-h-[calc(100vh-4rem)]">
          <nav className="px-4 py-6">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
