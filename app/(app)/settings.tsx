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
            .from('users')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (error) throw error;
          setUser(user);
          setUserData(data);
          const emailName = data?.email?.split('@')[0];
          const formattedName = emailName
            ?.split('.')
            .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
          setName(formattedName || '');
          setEmail(data?.email || '');
          setPhone(
            data?.phoneNumber
              ? data.phoneNumber.startsWith('+')
                ? data.phoneNumber
                : `+55${data.phoneNumber.replace(/[^0-9]/g, '')}`
              : ''
          );
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
        .from('users')
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
    console.log('Iniciando seleção de imagem...');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
        base64: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        console.log('Imagem selecionada:', asset);

        if (asset.base64) {
          console.log('Iniciando upload da imagem...');
          setLoading(true);
          const fileName = `${user?.id}-profile.jpg`;

          const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('settings-imagens')
            .upload(fileName, decode(asset.base64), {
              contentType: asset.mimeType || 'image/jpeg',
              upsert: true,
            });

          console.log('Resultado do upload:', uploadData, uploadError);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase
            .storage
            .from('settings-imagens')
            .getPublicUrl(fileName);

          console.log('URL pública gerada:', publicUrl);

          const { error: profileError } = await supabase
            .from('users')
            .update({ photoURL: publicUrl })
            .eq('id', user?.id);

          console.log('Resultado da atualização do perfil:', profileError);

          if (profileError) throw profileError;

          setPhotoURL(publicUrl);
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar foto de perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Erro ao sair:', error);
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
    button: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 15,
      borderRadius: 5,
      marginTop: 10,
    },
    buttonText: {
      color: 'white',
      fontSize: 16,
      marginLeft: 10,
    },
    versionText: {
      textAlign: 'center',
      marginTop: 20,
      color: theme.colors.text,
    },
  });

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <View style={styles.profilePhotoContainer}>
          <TouchableOpacity onPress={handleChangePhoto}>
            {photoURL ? (
              <Image source={{ uri: photoURL }} style={styles.profilePhoto} />
            ) : (
              <View style={[styles.profilePhoto, styles.profilePlaceholder]}>
                <User size={64} color={theme.colors.text} />
              </View>
            )}
            <View style={styles.editPhotoIcon}>
              <Pencil size={20} color="white" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nome</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              editable={true}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              editable={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Telefone</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={(text) => setPhone(`+55${text.replace(/[^0-9]/g, '')}`)}
              editable={true}
              keyboardType="phone-pad"
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            onPress={handleSave}
          >
            <Save size={20} color="white" />
            <Text style={styles.buttonText}>Salvar</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: '#FF3B30' }]}
            onPress={handleLogout}
          >
            <LogOut size={20} color="white" />
            <Text style={styles.buttonText}>Sair</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: '#34C759' }]}
            onPress={handleEmailVerification}
          >
            <Mail size={20} color="white" />
            <Text style={styles.buttonText}>Enviar link de verificação</Text>
          </TouchableOpacity>

          <Text style={styles.versionText}>Versão 0.0.1 Alpha</Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default SettingsScreen;