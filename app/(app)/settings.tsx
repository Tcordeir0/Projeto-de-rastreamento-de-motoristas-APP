import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Switch, ScrollView, Alert } from 'react-native';
import { supabase } from '@/utils/supabase';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { User } from '@supabase/supabase-js';
import { User as UserIcon, Pencil, Save, LogOut, Moon, Sun, Camera, Truck, Phone, Mail, MapPin } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string;
  photoURL: string;
  branch: string;
}

interface AdminData {
  id: string;
  name: string;
  phone: string;
  branch: string;
}

const SettingsScreen = () => {
  const { theme, toggleTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile>({
    id: '',
    name: '',
    email: '',
    phone: '',
    photoURL: '',
    branch: '',
  });
  const [branch, setBranch] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminData, setAdminData] = useState<AdminData | null>(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUser(user);
        setIsAdmin(user?.email?.endsWith('@borgnotransportes.com.br') || false);

        if (isAdmin) {
          const { data: adminData } = await supabase
            .from('employees')
            .select('*')
            .eq('id', user?.id)
            .single();
          setUserData(adminData);
        } else {
          const { data: driverData } = await supabase
            .from('drivers')
            .select('*')
            .eq('id', user?.id)
            .single();
          setUserData(driverData);
        }

        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error);
          setProfile({
            id: user.id,
            name: '',
            email: user.email || '',
            phone: '',
            photoURL: '',
            branch: '',
          });
        } else if (data) {
          setProfile({
            id: data.id,
            name: data.name || '',
            email: user.email || '',
            phone: data.phone || '',
            photoURL: data.photoURL || '',
            branch: data.branch || '',
          });
          setBranch(data.branch || '');
        } else {
          await createUserProfile(user);
        }
      } else {
        setProfile({
          id: '',
          name: '',
          email: '',
          phone: '',
          photoURL: '',
          branch: '',
        });
      }
    } catch (error) {
      console.error('Error in profile fetch:', error);
      setProfile({
        id: '',
        name: '',
        email: '',
        phone: '',
        photoURL: '',
        branch: '',
      });
    } finally {
      setLoading(false);
    }
  };

  const createUserProfile = async (user: User) => {
    try {
      const { error } = await supabase.from('users').insert({
        id: user.id,
        email: user.email,
        name: '',
        phone: '',
        branch: '',
      });

      if (error) throw error;

      setProfile({
        id: user.id,
        name: '',
        email: user.email || '',
        phone: '',
        photoURL: '',
        branch: '',
      });
      setBranch('');
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setProfileLoading(true);

      const { error } = await supabase
        .from('users')
        .update({
          name: profile.name,
          phone: profile.phone,
          branch: branch,
        })
        .eq('id', user.id);

      if (error) throw error;

      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o perfil.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePhoto = async () => {
    if (!user) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0].base64) {
        setProfileLoading(true);

        const fileName = `profile-${user.id}-${Date.now()}.jpg`;
        const base64FileData = result.assets[0].base64;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('settings-imagens')
          .upload(fileName, decode(base64FileData), {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from('settings-imagens').getPublicUrl(fileName);

        const { error: updateError } = await supabase
          .from('users')
          .update({ photo_url: publicUrl })
          .eq('id', user.id);

        if (updateError) throw updateError;

        setProfile({
          ...profile,
          photoURL: publicUrl,
        });

        Alert.alert('Sucesso', 'Foto de perfil atualizada!');
      }
    } catch (error) {
      console.error('Error updating profile photo:', error);
      Alert.alert('Erro', 'Não foi possível atualizar a foto de perfil.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleEmailVerification = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) {
      alert('Nenhum email encontrado. Por favor, faça login primeiro.');
      return;
    }

    const { data, error } = await supabase.auth.signInWithOtp({
      email: user.email,
      options: {
        emailRedirectTo: 'https://yourapp.com/welcome',
      },
    });

    if (error) {
      alert('Erro ao enviar link de verificação: ' + error.message);
    } else {
      alert('Link de verificação enviado para seu email!');
    }
  };

  const fetchAdminData = async () => {
    if (user?.id) {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Erro ao buscar dados:', error);
      } else {
        setAdminData(data as AdminData);
      }
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [user]);

  const styles = StyleSheet.create({
    container: {
      flex: 1, 
      justifyContent: 'flex-start', 
      alignItems: 'center', 
      backgroundColor: theme.colors.background,
      paddingTop: 20,
    },
    content: {
      width: '90%',
      maxWidth: 600,
      paddingHorizontal: 20,
      paddingVertical: 20,
    },
    profilePhotoContainer: {
      alignItems: 'center',
      marginBottom: 30,
    },
    profilePhoto: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: '#f0f0f0',
      justifyContent: 'center',
      alignItems: 'center',
    },
    profilePlaceholder: {
      backgroundColor: theme.colors.card,
    },
    editPhotoIcon: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      padding: 6,
    },
    bioContainer: {
      marginTop: 20,
      paddingHorizontal: 20,
    },
    bioTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 10,
      color: theme.colors.text,
    },
    bioText: {
      fontSize: 16,
      marginBottom: 5,
      color: theme.colors.text,
    },
    button: {
      backgroundColor: theme.colors.primary,
      padding: 15,
      borderRadius: 5,
      alignItems: 'center',
      marginTop: 20,
    },
    buttonText: {
      color: theme.colors.background,
      fontSize: 18,
    },
  });

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size='large' color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={styles.content}>
        <View style={styles.profilePhotoContainer}>
          <View style={[styles.profilePhoto, styles.profilePlaceholder]}>
            {profile.photoURL ? (
              <Image source={{ uri: profile.photoURL }} style={styles.profilePhoto} />
            ) : (
              <UserIcon size={60} color={theme.colors.text} />
            )}
          </View>
          <TouchableOpacity style={styles.editPhotoIcon} onPress={handleChangePhoto}>
            <Camera size={25} color={theme.colors.background} />
          </TouchableOpacity>
        </View>

        {/* Bio abaixo da foto */}
        <View style={styles.bioContainer}>
          <Text style={styles.bioTitle}>Bem-vindo, Administrador!</Text>
          {user?.email && <Text style={styles.bioText}>Email: {user.email}</Text>}
          {adminData?.name && <Text style={styles.bioText}>Nome: {adminData.name}</Text>}
          {adminData?.phone && <Text style={styles.bioText}>Telefone: {adminData.phone}</Text>}
          {adminData?.branch && <Text style={styles.bioText}>Filial: {adminData.branch}</Text>}
        </View>

        {/* Botões de ação */}
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: '#FF3B30' }]}
          onPress={handleLogout}
        >
          <LogOut size={25} color="white" />
          <Text style={styles.buttonText}>Sair</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: '#34C759' }]}
          onPress={handleEmailVerification}
        >
          <Mail size={25} color="white" />
          <Text style={styles.buttonText}>Enviar link de verificação</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 16, marginTop: 20, color: theme.colors.text }}>Versão 0.0.1 Alpha</Text>
      </View>
    </ScrollView>
  );
};

export default SettingsScreen;