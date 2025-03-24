import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { supabase } from '@/utils/supabase';
import { Phone } from 'lucide-react-native';
import { useRouter } from 'expo-router';

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

export default function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/(auth)/login');
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null; // Add null check for 'user' variable
        setIsAdmin(user.user_metadata?.isAdmin ?? false); 
      }
    };

    checkSession();
  }, []);

  // Carregar motoristas iniciais
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

          // Atualizar localização no Supabase apenas se for motorista
          if (!isAdmin) {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null; // Add null check for 'user' variable
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

  // Observar motoristas em tempo real
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
          />

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
              <Callout>
                <View style={styles.calloutContainer}>
                  <Text style={styles.calloutTitle}>{driver.email}</Text>
                  <Text>Tipo de Caminhão: {driver.truckType}</Text>
                  <TouchableOpacity
                    style={styles.callButton}
                    onPress={() => handleCallDriver(driver.phoneNumber)}
                  >
                    <Phone size={20} color="#007AFF" />
                    <Text style={styles.callButtonText}>Ligar</Text>
                  </TouchableOpacity>
                </View>
              </Callout>
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
    width: '100%',
    height: '100%',
  },
  calloutContainer: {
    minWidth: 200,
    padding: 10,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  callButtonText: {
    color: '#007AFF',
    marginLeft: 5,
  },
});