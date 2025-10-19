'use client';

import React, { useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
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

  // Eğer kullanıcı giriş sayfasında değilse seller panelini göster
  if (!isLoginPage && user && role === 'seller') {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        {/* Navbar + Sidebar (hamburgerli) */}
        <div className="mb-4">
          <Navbar />
        </div>

        {/* İçerik kısmı */}
        <main className="pt-[80px] md:ml-64 p-4 sm:p-6 transition-all">
          {children}
        </main>
      </div>
    );
  }

  // Giriş sayfasında sadece içerik
  if (isLoginPage) {
    return <>{children}</>;
  }

  return <Loading />;
};

export default SellerLayout;
