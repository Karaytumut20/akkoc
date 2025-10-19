'use client';

import React, { useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import SellerSidebar from '@/components/seller/Sidebar';
import { useRouter, usePathname } from 'next/navigation';
import Loading from '@/components/Loading';
import { supabase } from '@/lib/supabaseClient';
import Navbar from '@/components/seller/Navbar';

const SellerLayout = ({ children }) => {
  const { user, authLoading } = useAppContext();
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState(null);
  const [loadingRole, setLoadingRole] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setLoadingRole(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Rol alınamadı:', error);
      }

      setRole(data?.role || null);
      setLoadingRole(false);
    };

    if (!authLoading) {
      fetchUserRole();
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (authLoading || loadingRole) return;

    const isLoginPage = pathname === '/seller';

    if (!user) {
      router.replace('/auth');
      return;
    }

    if (role !== 'seller') {
      (async () => {
        await supabase.auth.signOut();
        router.replace('/');
      })();
      return;
    }

    if (isLoginPage && role === 'seller') {
      router.replace('/seller/product-list');
    }
  }, [authLoading, loadingRole, user, role, pathname, router]);

  if (authLoading || loadingRole) {
    return <Loading />;
  }

  const isLoginPage = pathname === '/seller';

  if (!isLoginPage && user && role === 'seller') {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        {/* Navbar üstte sabit */}
        <header className="sticky top-0 z-50 bg-white shadow-md">
          <Navbar />
        </header>

        {/* Sidebar ve içerik */}
        <div className="flex flex-1">
          <aside className="w-64 bg-white border-r shadow-sm">
            <SellerSidebar />
          </aside>
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    );
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  return <Loading />;
};

export default SellerLayout;
