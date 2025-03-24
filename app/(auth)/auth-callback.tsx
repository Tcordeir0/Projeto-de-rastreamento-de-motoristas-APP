import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '@/utils/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (session) {
          router.replace('/');
        } else {
          router.replace('/(auth)/login');
        }
      } catch (error) {
        console.error('Erro na autenticação:', error);
        router.replace('/(auth)/login');
      }
    };

    handleAuth();
  }, []);

  return null;
}
