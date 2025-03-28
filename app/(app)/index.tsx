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
  location: {
    latitude: number
    longitude: number
    timestamp: number
  }
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
      const { data, error } = await supabase.from("users").select("*").eq("isAdmin", false)

      if (error) {
        console.error("Erro ao carregar motoristas:", error)
        return
      }

      const driversData = data
        .filter((driver) => driver.location)
        .map((driver) => ({
          id: driver.id,
          email: driver.email,
          phoneNumber: driver.phoneNumber || "",
          truckType: driver.truckType || "",
          location: driver.location,
          isAdmin: driver.isAdmin ?? false,
        }))

      setDrivers(driversData)
      console.log(`Carregados ${driversData.length} motoristas`)
    }

    loadInitialDrivers()
  }, [isAdmin])

  // Solicitar e monitorar localização
  useEffect(() => {
    ;(async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") {
        setErrorMsg("Permissão para acessar localização foi negada")
        return
      }

      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        })
        setLocation(location)
        console.log("Localização inicial obtida:", location.coords)

        // Monitorar mudanças de localização
        const locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          async (newLocation) => {
            setLocation(newLocation)
            console.log("Nova localização:", newLocation.coords)

            // Se não for admin, atualizar localização no Supabase
            if (!isAdmin) {
              const {
                data: { user },
              } = await supabase.auth.getUser()
              if (!user) return

              await supabase
                .from("users")
                .update({
                  location: {
                    latitude: newLocation.coords.latitude,
                    longitude: newLocation.coords.longitude,
                    timestamp: newLocation.timestamp,
                  },
                })
                .eq("id", user.id)

              console.log("Localização atualizada no Supabase")
            }
          },
        )

        return () => {
          locationSubscription.remove()
        }
      } catch (error) {
        console.error("Erro ao obter localização:", error)
        setErrorMsg("Erro ao obter localização")
      }
    })()
  }, [isAdmin])

  // Inscrever-se para atualizações em tempo real (apenas para admin)
  useEffect(() => {
    if (!isAdmin) return

    const channel = supabase
      .channel("drivers-location")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "users" }, (payload: any) => {
        if (payload.new && !payload.new.isAdmin && payload.new.location) {
          console.log("Atualização de localização recebida para:", payload.new.email)

          setDrivers((currentDrivers) => {
            const driverIndex = currentDrivers.findIndex((d) => d.id === payload.new.id)
            const updatedDriver = {
              id: payload.new.id,
              email: payload.new.email,
              phoneNumber: payload.new.phoneNumber || "",
              truckType: payload.new.truckType || "",
              location: payload.new.location,
              isAdmin: payload.new.isAdmin ?? false,
            }

            if (driverIndex >= 0) {
              const updatedDrivers = [...currentDrivers]
              updatedDrivers[driverIndex] = updatedDriver
              return updatedDrivers
            } else {
              return [...currentDrivers, updatedDriver]
            }
          })
        }
      })
      .subscribe()

    console.log("Inscrito para atualizações em tempo real")

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isAdmin])

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
                latitude: driver.location.latitude,
                longitude: driver.location.longitude,
              }}
              title={driver.email}
              description={driver.truckType}
            >
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
