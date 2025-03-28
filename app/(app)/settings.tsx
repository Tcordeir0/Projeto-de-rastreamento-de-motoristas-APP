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
import { decode } from "base64-arraybuffer"
import type { User } from "@supabase/supabase-js"
import { User as UserIcon, Camera, LogOut, Moon, Sun } from "lucide-react-native"
import { useTheme } from "@/context/ThemeContext"
import AsyncStorage from "@react-native-async-storage/async-storage"

interface Profile {
  id: string
  name: string
  email: string
  phone: string
  photoURL: string
  branch: string
}

interface AdminData {
  id: string
  name: string
  phone: string
  branch: string
}

const THEME_STORAGE_KEY = "app_theme_preference"

const SettingsScreen = () => {
  const { theme, toggleTheme } = useTheme()

  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile>({
    id: "",
    name: "",
    email: "",
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
      setLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setUser(user)
        setIsAdmin(user?.email?.endsWith("@borgnotransportes.com.br") || false)

        if (isAdmin) {
          const { data: adminData } = await supabase.from("employees").select("*").eq("id", user?.id).single()
          setAdminData(adminData)
        } else {
          const { data: driverData } = await supabase.from("drivers").select("*").eq("id", user?.id).single()
        }

        const { data, error } = await supabase.from("users").select("*").eq("id", user.id).single()

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching profile:", error)
          setProfile({
            id: user.id,
            name: "",
            email: user.email || "",
            phone: "",
            photoURL: "",
            branch: "",
          })
        } else if (data) {
          setProfile({
            id: data.id,
            name: data.name || "",
            email: user.email || "",
            phone: data.phone || "",
            photoURL: data.photoURL || "",
            branch: data.branch || "",
          })
          setBranch(data.branch || "")
        } else {
          await createUserProfile(user)
        }
      } else {
        setProfile({
          id: "",
          name: "",
          email: "",
          phone: "",
          photoURL: "",
          branch: "",
        })
      }
    } catch (error) {
      console.error("Error in profile fetch:", error)
      setProfile({
        id: "",
        name: "",
        email: "",
        phone: "",
        photoURL: "",
        branch: "",
      })
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
        name: "",
        email: user.email || "",
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
    if (!user) return

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
        base64: true,
      })

      if (!result.canceled && result.assets && result.assets[0].base64) {
        setProfileLoading(true)

        const fileName = `profile-${user.id}-${Date.now()}.jpg`
        const base64FileData = result.assets[0].base64

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("settings-imagens")
          .upload(fileName, decode(base64FileData), {
            contentType: "image/jpeg",
            upsert: true,
          })

        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from("settings-imagens").getPublicUrl(fileName)

        const { error: updateError } = await supabase.from("users").update({ photoURL: publicUrl }).eq("id", user.id)

        if (updateError) throw updateError

        setProfile({
          ...profile,
          photoURL: publicUrl,
        })

        Alert.alert("Sucesso", "Foto de perfil atualizada!")
      }
    } catch (error) {
      console.error("Error updating profile photo:", error)
      Alert.alert("Erro", "Não foi possível atualizar a foto de perfil.")
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
      const { data, error } = await supabase.from("admins").select("*").eq("id", user.id).single()

      if (error) {
        console.error("Erro ao buscar dados:", error)
      } else {
        setAdminData(data as AdminData)
      }
    }
  }

  useEffect(() => {
    fetchAdminData()
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
          <Text style={styles.welcomeText}>Bem-vindo, Administrador!</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{user?.email || "-"}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nome:</Text>
            <Text style={styles.infoValue}>{adminData?.name || "-"}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Telefone:</Text>
            <Text style={styles.infoValue}>{adminData?.phone || "-"}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Filial:</Text>
            <Text style={styles.infoValue}>{adminData?.branch || "-"}</Text>
          </View>
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

