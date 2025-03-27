import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { supabase } from '@/utils/supabase';
import { Phone } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';

type Driver = {
  id: string;
  email: string;
  phoneNumber: string;
  truckType: string;
  location: {
    latitude: number;
    longitude: number;
    timestamp: number;
  };
  isAdmin?: boolean;
};

type SupabasePayload = {
  new: Driver;
  old: Driver;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
};

export default function AppLayout() {
  return (
    <Stack>
      <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
    </Stack>
  );
}

function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<Driver[]>([]);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/(auth)/login');
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null; 
        setIsAdmin(user.user_metadata?.isAdmin ?? false); 
      }
    };

    checkSession();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    const loadInitialDrivers = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('isAdmin', false);

      if (error) {
        console.error('Erro ao carregar motoristas:', error);
        return;
      }

      const driversData = data
        .filter(driver => driver.location)
        .map(driver => ({
          id: driver.id,
          email: driver.email,
          phoneNumber: driver.phoneNumber,
          truckType: driver.truckType,
          location: driver.location,
          isAdmin: driver.isAdmin ?? false, 
        }));

      setDrivers(driversData);
    };

    loadInitialDrivers();
  }, [isAdmin]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);

      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        async (newLocation) => {
          setLocation(newLocation);

          if (!isAdmin) {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null; 
            await supabase
              .from('users')
              .update({
                location: {
                  latitude: newLocation.coords.latitude,
                  longitude: newLocation.coords.longitude,
                  timestamp: newLocation.timestamp,
                },
              })
              .eq('id', user.user_metadata.id);
          }
        }
      );
    })();
  }, [isAdmin]);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*');

      if (error) {
        console.error('Erro ao buscar usuários:', error);
        return;
      }

      setUsers(data);
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    const channel = supabase
      .channel('drivers')
      .on(
        'system',
        { event: '*', schema: 'public', table: 'users' },
        (payload: SupabasePayload) => {
          if (payload.new && !payload.new.isAdmin) {
            setDrivers(currentDrivers => {
              const driverIndex = currentDrivers.findIndex(d => d.id === payload.new.id);
              const updatedDriver = {
                id: payload.new.id,
                email: payload.new.email,
                phoneNumber: payload.new.phoneNumber,
                truckType: payload.new.truckType,
                location: payload.new.location,
                isAdmin: payload.new.isAdmin ?? false, 
              };

              if (driverIndex >= 0) {
                const updatedDrivers = [...currentDrivers];
                updatedDrivers[driverIndex] = updatedDriver;
                return updatedDrivers;
              } else {
                return [...currentDrivers, updatedDriver];
              }
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  if (errorMsg) {
    return (
      <View style={styles.container}>
        <Text>{errorMsg}</Text>
      </View>
    );
  }

  const handleCallDriver = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  return (
    <View style={styles.container}>
      {users.map(user => (
        <View key={user.id}>
          <Text>{user.email}</Text>
          <Text>{user.phoneNumber}</Text>
        </View>
      ))}
      {location && (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          {/* Marcador para o usuário atual */}
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title={isAdmin ? "Você (Admin)" : "Você (Motorista)"}
          >
            <Ionicons name={isAdmin ? "person" : "car"} size={24} color={isAdmin ? "blue" : "black"} />
          </Marker>

          {/* Marcadores para os motoristas (visíveis apenas para admin) */}
          {isAdmin && drivers.map((driver) => (
            <Marker
              key={driver.id}
              coordinate={{
                latitude: driver.location.latitude,
                longitude: driver.location.longitude,
              }}
              title={driver.email}
            >
              <View style={{ backgroundColor: 'red', borderRadius: 12, padding: 2 }}>
                <Ionicons name="car" size={20} color="white" />
              </View>
            </Marker>
          ))}
        </MapView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  calloutContainer: {
    width: 200,
    padding: 10,
  },
  calloutText: {
    fontSize: 14,
    marginBottom: 5,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 5,
  },
  callButtonText: {
    color: 'white',
    marginLeft: 5,
  },
});