import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Switch, ScrollView } from 'react-native';
import { supabase } from '@/utils/supabase';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { User, Pencil, Save, LogOut, Moon, Sun, Camera, Truck, Phone, Mail, MapPin } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

const SettingsScreen = () => {
  const { theme, toggleTheme } = useTheme();

  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('Rastreamento.users')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error) throw error;
          setUser(user);
          setUserData(data);
          setName(data?.nome || '');
          setEmail(data?.email || '');
          setPhone(data?.phoneNumber || '');
          setPhotoURL(data?.photoURL || '');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('Rastreamento.users')
        .update({ nome: name, phoneNumber: phone })
        .eq('id', user.id);

      if (error) throw error;

      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setLoading(true);
      try {
        const fileName = `${user?.id}-profile.jpg`;
        const base64FileData = result.assets[0].base64;

        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('profile-images')
          .upload(fileName, decode(base64FileData), {
            contentType: 'image/jpeg',
            upsert: true
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase
          .storage
          .from('profile-images')
          .getPublicUrl(fileName);

        const { error: profileError } = await supabase
          .from('Rastreamento.users')
          .update({ photoURL: publicUrl })
          .eq('id', user?.id);

        if (profileError) throw profileError;

        setPhotoURL(publicUrl);
      } catch (error) {
        console.error('Erro ao atualizar foto de perfil:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingVertical: 20,
      backgroundColor: theme.colors.background,
    },
    content: {
      width: '100%',
      maxWidth: 600,
      paddingHorizontal: 20,
    },
    profilePhotoContainer: {
      alignItems: 'center',
      marginBottom: 20,
    },
    profilePhoto: {
      width: 120,
      height: 120,
      borderRadius: 60,
    },
    editPhotoIcon: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      padding: 6,
    },
    form: {
      flex: 1,
    },
    inputContainer: {
      marginBottom: 15,
    },
    label: {
      fontSize: 16,
      marginBottom: 5,
      color: theme.colors.text,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 5,
      padding: 10,
      fontSize: 16,
      color: theme.colors.text,
      backgroundColor: theme.colors.card,
    },
    settingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    settingText: {
      marginLeft: 10,
      fontSize: 16,
      color: theme.colors.text,
    },
    saveButton: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      padding: 15,
      borderRadius: 5,
      marginTop: 20,
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      marginLeft: 10,
    },
    editButton: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      padding: 15,
      borderRadius: 5,
      marginTop: 20,
    },
    editButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      marginLeft: 10,
    },
    logoutButton: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 15,
      borderRadius: 5,
      borderWidth: 1,
      borderColor: '#FF3B30',
      marginTop: 20,
    },
    logoutText: {
      color: '#FF3B30',
      fontSize: 16,
      marginLeft: 10,
    },
    versionText: {
      textAlign: 'center',
      marginTop: 20,
      color: theme.colors.text,
      fontSize: 12,
    },
  });

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity style={styles.profilePhotoContainer} onPress={handleChangePhoto}>
          {photoURL ? (
            <Image source={{ uri: photoURL }} style={styles.profilePhoto} />
          ) : (
            <User size={64} color={theme.colors.text} />
          )}
          {!loading && (
            <View style={styles.editPhotoIcon}>
              <Pencil size={20} color="#fff" />
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nome</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              editable={isEditing}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              editable={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Telefone</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              editable={isEditing}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              {theme.mode === 'dark' ? (
                <Moon size={24} color={theme.colors.primary} />
              ) : (
                <Sun size={24} color={theme.colors.primary} />
              )}
              <Text style={styles.settingText}>Modo Escuro</Text>
            </View>
            <Switch
              value={theme.mode === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={theme.mode === 'dark' ? theme.colors.primary : '#f4f3f4'}
            />
          </View>

          {isEditing ? (
            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Save size={20} color="#fff" />
              )}
              <Text style={styles.saveButtonText}>Salvar</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
              <Pencil size={20} color="#fff" />
              <Text style={styles.editButtonText}>Editar</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={24} color="#FF3B30" />
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Versão 0.0.1 Alpha</Text>
      </View>
    </ScrollView>
  );
};

export default SettingsScreen;