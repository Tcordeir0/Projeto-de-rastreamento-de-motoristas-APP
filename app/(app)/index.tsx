"use client"

import { useEffect, useState } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Linking, Image } from "react-native"
import MapView, { Marker, Callout } from "react-native-maps"
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
          {drivers.map((driver) => (
            <Marker
              key={driver.id}
              coordinate={{
                latitude: driver.latitude,
                longitude: driver.longitude,
              }}
              title={driver.email}
              description={driver.truckType}
            >
              {driver.photoURL ? (
                <Image
                  source={{ uri: driver.photoURL }}
                  style={{ width: 40, height: 40, borderRadius: 20 }}
                />
              ) : (
                <Ionicons name="car" size={24} color="black" />
              )}
              <Callout>
                <View>
                  <Text>{driver.email}</Text>
                  <Text>{driver.truckType}</Text>
                  <TouchableOpacity
                    onPress={() => Linking.openURL(`tel:${driver.phoneNumber}`)}
                  >
                    <Phone size={16} color="#000" />
                    <Text>{driver.phoneNumber}</Text>
                  </TouchableOpacity>
                </View>
              </Callout>
            </Marker>
          ))}
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
  callButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    padding: 8,
    borderRadius: 5,
  },
  callButtonText: {
    color: "white",
    marginLeft: 5,
  },
})
