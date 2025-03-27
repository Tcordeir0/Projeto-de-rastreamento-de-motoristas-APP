import { Tabs } from 'expo-router';
import { MapPin, MessageSquare, Settings } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { KeyboardAvoidingView, Platform } from 'react-native';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/welcome'); // Redireciona para a tela de boas-vindas se não estiver autenticado
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        router.replace('/welcome');
      }
      setIsLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, []);

  if (isLoading) return null;

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace('/welcome');
      return null;
    }
  };

  checkUser();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <Tabs screenOptions={{ headerShown: false }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Mapa',
            tabBarIcon: ({ color, size }) => <MapPin size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Chat',
            tabBarIcon: ({ color, size }) => <MessageSquare size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Configurações',
            tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
          }}
        />
      </Tabs>
    </KeyboardAvoidingView>
  );
};

export default Layout;