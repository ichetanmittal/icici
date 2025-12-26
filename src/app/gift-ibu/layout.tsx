'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';

interface UserProfile {
  role: string;
  company_name: string;
  contact_person: string;
  email?: string;
}

export default function GiftIBULayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        setProfile({
          role: profileData.role,
          company_name: profileData.company_name,
          contact_person: profileData.contact_person,
          email: user.email,
        });

        // Ensure user is ICICI Gift IBU maker or checker
        if (profileData.role !== 'gift_ibu_maker' && profileData.role !== 'gift_ibu_checker') {
          router.push('/dashboard');
          return;
        }
      }

      setLoading(false);
    };

    loadProfile();
  }, [router]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const getInitials = () => {
    if (!profile?.company_name) return 'I';
    return profile.company_name.charAt(0).toUpperCase();
  };

  const getRoleDisplay = () => {
    if (profile?.role === 'gift_ibu_maker') return 'ICICI GIFT IBU - MAKER';
    if (profile?.role === 'gift_ibu_checker') return 'ICICI GIFT IBU - CHECKER';
    return 'ICICI GIFT IBU';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-green-600 text-white shadow-md">
        <div className="flex h-16 items-center justify-between px-6">
          <Link href="/gift-ibu/marketplace" className="text-2xl font-bold">
            xaults<span className="text-green-300">*</span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-semibold">{profile?.company_name}</div>
              <div className="text-xs text-green-200">{getRoleDisplay()}</div>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-green-600 font-semibold hover:bg-green-50 transition-colors"
              >
                {getInitials()}
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 rounded-lg bg-white shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="font-semibold text-gray-900">{profile?.contact_person}</div>
                    <div className="text-sm text-gray-500 mt-1">{getRoleDisplay()}</div>
                    <div className="text-sm text-gray-600 mt-1">{profile?.company_name}</div>
                    <div className="text-xs text-gray-500 mt-1">{profile?.email}</div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-md min-h-[calc(100vh-4rem)]">
          <nav className="p-4 space-y-1">
            <Link
              href="/gift-ibu/marketplace"
              className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors font-medium"
            >
              PTT Marketplace
            </Link>
            <Link
              href="/gift-ibu/portfolio"
              className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors font-medium"
            >
              My Portfolio
            </Link>
            <Link
              href="/gift-ibu/profile"
              className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors font-medium"
            >
              Profile
            </Link>
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
