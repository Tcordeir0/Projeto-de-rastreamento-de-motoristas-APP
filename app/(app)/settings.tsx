"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  ScrollView,
  Alert,
  Switch,
} from "react-native"
import { supabase } from "@/utils/supabase"
import * as ImagePicker from "expo-image-picker"
import { User as UserIcon, Camera, LogOut, Moon, Sun } from "lucide-react-native"
import { useTheme } from "@/context/ThemeContext"
import AsyncStorage from "@react-native-async-storage/async-storage"
import type { User } from "@supabase/supabase-js"

interface Profile {
  id: string
  email: string
  name: string
  phone: string
  photoURL: string
  branch?: string
  vehicle?: string
  license_plate?: string
  driver_license?: string
  truck_type?: string
}

interface AdminData {
  id: string
  name: string
  phone: string
  branch: string
  photoURL: string
}

const THEME_STORAGE_KEY = "app_theme_preference"

const SettingsScreen = () => {
  const { theme, toggleTheme } = useTheme()

  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile>({
    id: "",
    email: "",
    name: "",
    phone: "",
    photoURL: "",
    branch: "",
  })
  const [branch, setBranch] = useState<string>("")
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminData, setAdminData] = useState<AdminData | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(() => theme.dark === true)

  // Carregar preferência de tema ao iniciar
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY)
        if (savedTheme !== null) {
          // Se o tema salvo for diferente do tema atual, alternar
          const savedIsDark = savedTheme === "dark"
          if (savedIsDark !== theme.dark) {
            toggleTheme()
          }
          setIsDarkMode(savedIsDark)
        }
      } catch (error) {
        console.error("Erro ao carregar preferência de tema:", error)
      }
    }

    loadThemePreference()
  }, [])

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const handleThemeToggle = async () => {
    // Primeiro atualizamos o estado local para evitar atraso na UI
    const newThemeValue = !isDarkMode
    setIsDarkMode(newThemeValue)

    // Depois alteramos o tema global
    toggleTheme()

    // Salvamos a preferência para persistir entre sessões
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newThemeValue ? "dark" : "light")
    } catch (error) {
      console.error("Erro ao salvar preferência de tema:", error)
    }
  }

  const fetchUserProfile = async () => {
    try {
      console.log("Iniciando busca de perfil...")
      setLoading(true)

      // Buscar usuário na tabela de autenticação
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()
      console.log("Resultado da autenticação:", { user, authError })

      if (authError || !user) {
        console.error("Erro na autenticação:", authError)
        throw new Error("Usuário não autenticado")
      }

      // Armazenar o usuário no estado
      setUser(user)

      // Verificar se o usuário é administrador
      const { data: adminData, error: adminError } = await supabase
        .from("admins")
        .select("id")
        .eq("id", user.id)
        .single()
      console.log("Resultado da verificação de admin:", { adminData, adminError })

      const isAdmin = !!adminData && !adminError
      setIsAdmin(isAdmin)

      if (isAdmin) {
        // Buscar perfil de administrador
        const { data: adminProfile, error: adminProfileError } = await supabase
          .from("admins")
          .select("name, phone, branch, photoURL")
          .eq("id", user.id)
          .single()
        console.log("Perfil de admin encontrado:", adminProfile)

        if (adminProfileError) {
          console.error("Erro ao buscar perfil de admin:", adminProfileError)
          throw adminProfileError
        }

        setProfile({
          id: user.id,
          email: user.email || "",
          name: adminProfile?.name || "",
          phone: adminProfile?.phone || "",
          photoURL: adminProfile?.photoURL || "",
          branch: adminProfile?.branch || "",
        })

        setAdminData({
          id: user.id,
          name: adminProfile?.name || "",
          phone: adminProfile?.phone || "",
          branch: adminProfile?.branch || "",
          photoURL: adminProfile?.photoURL || "",
        })
      } else {
        // Buscar perfil de motorista
        const { data: driverProfile, error: driverError } = await supabase
          .from("drivers")
          .select("name, phone, vehicle, license_plate, driver_license, truck_type, photoURL")
          .eq("id", user.id)
          .single()
        console.log("Perfil de motorista encontrado:", driverProfile)

        if (driverError && driverError.code !== "PGRST116") {
          console.error("Erro ao buscar perfil de motorista:", driverError)
          throw driverError
        }

        if (!driverProfile) {
          console.log("Criando novo perfil de motorista...")
          const { error: createError } = await supabase.from("drivers").insert([
            {
              id: user.id,
              name: "",
              phone: "",
              vehicle: "",
              license_plate: "",
              driver_license: "",
              truck_type: "",
              photoURL: "",
            },
          ])

          if (createError) {
            console.error("Erro ao criar perfil de motorista:", createError)
            throw createError
          }

          // Buscar o perfil recém-criado
          const { data: newProfile } = await supabase.from("drivers").select("*").eq("id", user.id).single()

          setProfile({
            id: user.id,
            email: user.email || "",
            name: newProfile?.name || "",
            phone: newProfile?.phone || "",
            photoURL: newProfile?.photoURL || "",
            vehicle: newProfile?.vehicle || "",
            license_plate: newProfile?.license_plate || "",
            driver_license: newProfile?.driver_license || "",
            truck_type: newProfile?.truck_type || "",
          })
        } else {
          setProfile({
            id: user.id,
            email: user.email || "",
            name: driverProfile?.name || "",
            phone: driverProfile?.phone || "",
            photoURL: driverProfile?.photoURL || "",
            vehicle: driverProfile?.vehicle || "",
            license_plate: driverProfile?.license_plate || "",
            driver_license: driverProfile?.driver_license || "",
            truck_type: driverProfile?.truck_type || "",
          })
        }
      }
    } catch (error) {
      console.error("Erro completo ao buscar perfil:", error)
      Alert.alert("Erro", "Não foi possível carregar o perfil do usuário")
    } finally {
      setLoading(false)
    }
  }

  const createUserProfile = async (user: User) => {
    try {
      const { error } = await supabase.from("users").insert({
        id: user.id,
        email: user.email,
        name: "",
        phone: "",
        branch: "",
      })

      if (error) throw error

      setProfile({
        id: user.id,
        email: user.email || "",
        name: "",
        phone: "",
        photoURL: "",
        branch: "",
      })
      setBranch("")
    } catch (error) {
      console.error("Error creating profile:", error)
    }
  }

  const handleChangePhoto = async () => {
    try {
      setProfileLoading(true)

      // Verificar permissões
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Permissão negada", "Precisamos de permissão para acessar suas fotos!")
        setProfileLoading(false)
        return
      }

      // Usar a API antiga, mas com tratamento de erro melhorado
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Usar a API antiga por enquanto
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5, // Reduzir ainda mais a qualidade para evitar problemas de memória
      })

      console.log("Resultado do ImagePicker:", result)

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setProfileLoading(false)
        return
      }

      const asset = result.assets[0]
      if (!asset.uri) {
        throw new Error("URI da imagem inválida")
      }

      console.log("URI da imagem:", asset.uri)

      // Verificar se o usuário está autenticado
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()
      if (!currentUser) {
        throw new Error("Usuário não autenticado")
      }

      // Nome do arquivo
      const photoName = `profile-${currentUser.id}-${Date.now()}.jpg`

      try {
        // Converter URI para Blob com tratamento de erro melhorado
        const response = await fetch(asset.uri)
        if (!response.ok) {
          throw new Error(`Falha ao buscar imagem: ${response.status} ${response.statusText}`)
        }

        const blob = await response.blob()
        console.log("Tamanho do blob:", blob.size)

        // Verificar se o blob não está vazio
        if (blob.size === 0) {
          throw new Error("Arquivo de imagem vazio")
        }

        // Upload para o Supabase Storage com mais logs
        console.log("Iniciando upload para Supabase...")
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("settings-imagens")
          .upload(photoName, blob, {
            cacheControl: "3600",
            upsert: true,
          })

        if (uploadError) {
          console.error("Erro no upload:", uploadError)
          throw uploadError
        }

        console.log("Upload concluído com sucesso:", uploadData)

        // Obter URL pública
        const { data: urlData } = supabase.storage.from("settings-imagens").getPublicUrl(photoName)

        if (!urlData?.publicUrl) {
          throw new Error("Erro ao obter URL pública")
        }

        console.log("URL pública obtida:", urlData.publicUrl)

        // Atualizar o perfil no banco de dados
        const tableName = isAdmin ? "admins" : "drivers"
        const { error: updateError } = await supabase
          .from(tableName)
          .update({ photoURL: urlData.publicUrl })
          .eq("id", currentUser.id)

        if (updateError) {
          console.error("Erro ao atualizar perfil:", updateError)
          throw updateError
        }

        // Atualizar o estado local
        setProfile((prev) => ({ ...prev, photoURL: urlData.publicUrl }))
        Alert.alert("Sucesso", "Foto atualizada com sucesso!")
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
        console.error("Erro no processamento da imagem:", error)
        Alert.alert("Erro", `Falha no processamento da imagem: ${errorMessage}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
      console.error("Erro ao mudar foto:", error)
      Alert.alert("Erro", `Não foi possível atualizar a foto: ${errorMessage}`)
    } finally {
      setProfileLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const fetchAdminData = async () => {
    if (user?.id) {
      const { data, error } = await supabase.from("admins").select("*").eq("id", user.id)

      if (error) {
        console.error("Erro ao buscar dados:", error)
      } else if (data && data.length > 0) {
        setAdminData(data[0] as AdminData)
      } else {
        console.warn("Nenhum dado encontrado para o usuário", user.id)
      }
    }
  }

  useEffect(() => {
    if (user) {
      fetchAdminData()
    }
  }, [user])

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 50,
      paddingBottom: 40,
    },
    profileSection: {
      width: "100%",
      alignItems: "center",
      marginBottom: 50,
    },
    profilePhotoContainer: {
      position: "relative",
      marginBottom: 20,
    },
    profilePhoto: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.colors.card,
    },
    cameraButton: {
      position: "absolute",
      bottom: 0,
      right: 0,
      backgroundColor: theme.colors.primary,
      borderRadius: 20,
      width: 40,
      height: 40,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 3,
      borderColor: theme.colors.background,
    },
    infoSection: {
      width: "100%",
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 20,
      marginBottom: 30,
    },
    welcomeText: {
      fontSize: 22,
      fontWeight: "bold",
      color: theme.colors.text,
      marginBottom: 15,
      textAlign: "center",
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    infoLabel: {
      fontSize: 16,
      color: theme.colors.text,
      opacity: 0.7,
      width: 80,
    },
    infoValue: {
      fontSize: 16,
      color: theme.colors.text,
      flex: 1,
      fontWeight: "500",
    },
    themeSection: {
      width: "100%",
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 20,
      marginBottom: 30,
    },
    themeSectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.colors.text,
      marginBottom: 15,
    },
    themeRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    themeLabel: {
      fontSize: 16,
      color: theme.colors.text,
      flex: 1,
    },
    themeIcons: {
      flexDirection: "row",
      alignItems: "center",
      marginRight: 10,
    },
    buttonContainer: {
      width: "100%",
      marginTop: 10,
    },
    logoutButton: {
      backgroundColor: "#FF3B30",
      borderRadius: 8,
      padding: 15,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    buttonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 10,
    },
    versionText: {
      fontSize: 14,
      color: theme.colors.text,
      opacity: 0.6,
      marginTop: 40,
      textAlign: "center",
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.colors.background,
    },
  })

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.profilePhotoContainer}>
            {profile.photoURL ? (
              <Image source={{ uri: profile.photoURL }} style={styles.profilePhoto} resizeMode="cover" />
            ) : (
              <View style={[styles.profilePhoto, { justifyContent: "center", alignItems: "center" }]}>
                <UserIcon size={60} color={theme.colors.text} />
              </View>
            )}
            <TouchableOpacity style={styles.cameraButton} onPress={handleChangePhoto} disabled={profileLoading}>
              {profileLoading ? <ActivityIndicator size="small" color="white" /> : <Camera size={20} color="white" />}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.welcomeText}>Bem-vindo, {profile.name}!</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{profile.email}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Telefone:</Text>
            <Text style={styles.infoValue}>{profile.phone}</Text>
          </View>

          {isAdmin && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Filial:</Text>
              <Text style={styles.infoValue}>{profile.branch}</Text>
            </View>
          )}

          {!isAdmin && (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Veículo:</Text>
                <Text style={styles.infoValue}>{profile.vehicle}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Placa do Veículo:</Text>
                <Text style={styles.infoValue}>{profile.license_plate}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Número da CNH:</Text>
                <Text style={styles.infoValue}>{profile.driver_license}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tipo de Caminhão:</Text>
                <Text style={styles.infoValue}>{profile.truck_type}</Text>
              </View>
            </>
          )}
        </View>

        {/* Seção de tema */}
        <View style={styles.themeSection}>
          <Text style={styles.themeSectionTitle}>Personalização</Text>

          <View style={styles.themeRow}>
            <View style={styles.themeIcons}>
              {isDarkMode ? <Moon size={22} color={theme.colors.text} /> : <Sun size={22} color={theme.colors.text} />}
            </View>
            <Text style={styles.themeLabel}>{isDarkMode ? "Tema Escuro" : "Tema Claro"}</Text>
            <Switch
              value={isDarkMode}
              onValueChange={handleThemeToggle}
              trackColor={{ false: "#767577", true: theme.colors.primary }}
              thumbColor={"#f4f3f4"}
            />
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color="white" />
            <Text style={styles.buttonText}>Sair</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>Versão 0.0.1 Alpha</Text>
      </View>
    </ScrollView>
  )
}

export default SettingsScreen
