'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { signOut } from '@/lib/auth';

export default function ExporterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      setUser(user);

      const { data: userProfile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        router.push('/login');
        return;
      }

      if (userProfile?.role !== 'exporter') {
        router.push('/dashboard');
        return;
      }

      setProfile(userProfile);
      setLoading(false);
    };

    fetchProfile();
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

  const navigation = [
    { name: 'Dashboard', href: '/exporter/dashboard' },
    { name: 'Upload Documents', href: '/exporter/documents' },
    { name: 'Discount Offers', href: '/exporter/offers' },
    { name: 'My Importers', href: '/exporter/importers' },
    { name: 'Profile', href: '/exporter/profile' },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-orange-600 shadow-lg">
        <div className="mx-auto flex h-16 max-w-full items-center justify-between px-8">
          <div className="flex items-center">
            <Link href="/exporter/dashboard">
              <h1 className="text-2xl font-bold text-white tracking-wide">
                xaults<span className="text-orange-300">*</span>
              </h1>
            </Link>
          </div>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-4 focus:outline-none"
            >
              <div className="text-right">
                <p className="text-sm font-semibold text-white">{profile?.contact_person || 'User'}</p>
                <p className="text-xs text-orange-200">Exporter</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-orange-600 font-bold text-lg cursor-pointer hover:bg-orange-50 transition-colors">
                {profile?.contact_person?.charAt(0).toUpperCase() || 'E'}
              </div>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-lg bg-white shadow-xl border border-gray-200 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-200">
                  <p className="text-lg font-bold text-gray-900">{profile?.contact_person || 'User'}</p>
                  <p className="text-sm text-gray-600 mt-1">Role: Exporter</p>
                  <p className="text-sm text-gray-600">Company: {profile?.company_name || 'N/A'}</p>
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
        {/* Sidebar */}
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
                          ? 'bg-orange-50 text-orange-700 font-semibold'
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

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
