"use client"

import { useEffect, useState } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Linking, Image } from "react-native"
import MapView, { Marker, Callout, Polyline } from "react-native-maps"
import * as Location from "expo-location"
import { supabase } from "@/utils/supabase"
import { Phone } from "lucide-react-native"
import { useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"

type Driver = {
  id: string
  email: string
  phoneNumber: string
  truckType: string
  latitude: number
  longitude: number
  timestamp: number
  photoURL?: string
  isAdmin?: boolean
  route?: {
    latitude: number;
    longitude: number;
  }[]
}

type SupabasePayload = {
  new: Driver
  old: Driver
  eventType: "INSERT" | "UPDATE" | "DELETE"
}

export default function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    moving: true,
    stopped: true,
    region: 'all'
  });
  const [selectedDriverRoute, setSelectedDriverRoute] = useState<{
    latitude: number;
    longitude: number;
  }[] | null>(null);
  const router = useRouter()

  // Verificar sessão e determinar se é admin
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.replace("/(auth)/login")
        return
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        // Definir se é admin baseado nos metadados do usuário
        const userIsAdmin = user.user_metadata?.isAdmin ?? false
        setIsAdmin(userIsAdmin)

        console.log("Usuário logado como:", userIsAdmin ? "Admin" : "Motorista")
      }
    }

    checkSession()
  }, [])

  // Carregar motoristas iniciais (apenas para admin)
  useEffect(() => {
    if (!isAdmin) return

    const loadInitialDrivers = async () => {
      try {
        setLoading(true)

        // Buscar apenas motoristas
        const { data: drivers, error } = await supabase
          .from('drivers')
          .select('*')
          .neq('isAdmin', true) // Garantir que não sejam administradores

        if (error) throw error

        if (drivers) {
          const driversWithLocation = drivers.filter(driver => driver.latitude && driver.longitude)
          setDrivers(driversWithLocation)
        }
      } catch (error) {
        console.error('Erro ao carregar motoristas:', error)
        // Alert.alert('Erro', 'Não foi possível carregar os motoristas')
      } finally {
        setLoading(false)
      }
    }

    loadInitialDrivers()
  }, [isAdmin])

  // Solicitar e monitorar localização
  useEffect(() => {
    (async () => {
      if (isAdmin) return; 

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permissão para acessar localização foi negada");
        return;
      }

      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLocation(location);
        console.log("Localização inicial obtida:", location.coords);

        const locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          async (newLocation) => {
            setLocation(newLocation);
            console.log("Nova localização:", newLocation.coords);

            const {
              data: { user },
            } = await supabase.auth.getUser();
            if (!user) return;

            await supabase
              .from("users")
              .update({
                location: {
                  latitude: newLocation.coords.latitude,
                  longitude: newLocation.coords.longitude,
                  timestamp: newLocation.timestamp,
                },
              })
              .eq("id", user.id);

            console.log("Localização atualizada no Supabase");
          }
        );

        return () => {
          locationSubscription.remove();
        };
      } catch (error) {
        console.error("Erro ao obter localização:", error);
        setErrorMsg("Erro ao obter localização");
      }
    })();
  }, [isAdmin]);

  // Inscrever-se para atualizações em tempo real
  useEffect(() => {
    const subscription = supabase
      .channel('public:drivers')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'drivers',
        filter: 'isAdmin=eq.false' // Filtra apenas motoristas
      }, (payload) => {
        const driver = payload.new as Driver
        if (driver.latitude && driver.longitude) {
          setDrivers(prevDrivers => {
            const existingDriverIndex = prevDrivers.findIndex(d => d.id === driver.id)
            if (existingDriverIndex !== -1) {
              const updatedDrivers = [...prevDrivers]
              updatedDrivers[existingDriverIndex] = driver
              return updatedDrivers
            } else {
              return [...prevDrivers, driver]
            }
          })
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [])

  const filteredDrivers = drivers.filter(driver => {
    const isMoving = Math.abs(Date.now() - driver.timestamp) < 60000;
    return (
      (filters.moving && isMoving) ||
      (filters.stopped && !isMoving)
    );
  });

  const calculateETA = (driver: Driver) => {
    if (!location || !driver.latitude || !driver.longitude) return null;
    const R = 6371; // Raio da Terra em km
    const dLat = (driver.latitude - location.coords.latitude) * (Math.PI / 180);
    const dLon = (driver.longitude - location.coords.longitude) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(location.coords.latitude * (Math.PI / 180)) *
      Math.cos(driver.latitude * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distância em km
    const speed = 60; // Velocidade média em km/h
    const eta = (distance / speed) * 60; // ETA em minutos
    return Math.round(eta);
  };

  const handleStartChat = async (driverId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // Verificar se já existe uma conversa
    const { data: existingChat, error: chatError } = await supabase
      .from('chats')
      .select('*')
      .or(`user1.eq.${user.id},user2.eq.${user.id}`)
      .or(`user1.eq.${driverId},user2.eq.${driverId}`)
      .single();

    if (chatError || !existingChat) {
      // Criar nova conversa
      const { data: newChat, error: createError } = await supabase
        .from('chats')
        .insert([{
          user1: user.id,
          user2: driverId,
          lastMessage: '',
          lastMessageAt: new Date().toISOString(),
        }])
        .select()
        .single();

      if (createError) {
        console.error('Erro ao criar chat:', createError);
        return;
      }

      router.push(`/(app)/chat/${newChat.id}`);
    } else {
      router.push(`/(app)/chat/${existingChat.id}`);
    }
  };

  if (errorMsg) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </View>
    )
  }

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
          onMapReady={() => setMapReady(true)}
        >
          {filteredDrivers.map((driver) => {
            const isMoving = Math.abs(Date.now() - driver.timestamp) < 60000;
            return (
              <Marker
                key={driver.id}
                coordinate={{
                  latitude: driver.latitude,
                  longitude: driver.longitude,
                }}
                onPress={() => {
                  setSelectedDriverRoute(driver.route || null);
                }}
              >
                <View style={[
                  styles.marker,
                  isMoving ? styles.movingMarker : styles.stoppedMarker
                ]}>
                  <Image
                    source={{ uri: driver.photoURL || 'https://via.placeholder.com/40' }}
                    style={styles.markerImage}
                  />
                </View>
                <Callout>
                  <View style={styles.calloutContainer}>
                    <Text style={styles.calloutText}>{driver.email}</Text>
                    <Text style={styles.calloutText}>{driver.truckType}</Text>
                    <View style={styles.calloutButtons}>
                      <TouchableOpacity
                        style={styles.calloutButton}
                        onPress={() => Linking.openURL(`tel:${driver.phoneNumber}`)}
                      >
                        <Phone size={16} color="#000" />
                        <Text style={styles.calloutButtonText}>Ligar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.calloutButton}
                        onPress={() => handleStartChat(driver.id)}
                      >
                        <Ionicons name="chatbubbles" size={16} color="#000" />
                        <Text style={styles.calloutButtonText}>Chat</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Callout>
              </Marker>
            );
          })}
          {selectedDriverRoute && (
            <Polyline
              coordinates={selectedDriverRoute}
              strokeColor="#0000FF"
              strokeWidth={3}
            />
          )}
        </MapView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    textAlign: "center",
    margin: 20,
    color: "red",
  },
  calloutContainer: {
    width: 200,
    padding: 10,
  },
  calloutText: {
    fontSize: 14,
    marginBottom: 5,
  },
  calloutButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  calloutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    padding: 8,
    borderRadius: 5,
  },
  calloutButtonText: {
    color: "white",
    marginLeft: 5,
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  movingMarker: {
    backgroundColor: "#00FF00",
  },
  stoppedMarker: {
    backgroundColor: "#FF0000",
  },
  markerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
})
