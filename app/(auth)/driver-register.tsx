import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';

const DriverRegisterScreen = () => {
  const { email: emailParam, password: passwordParam } = useLocalSearchParams();
  const email = Array.isArray(emailParam) ? emailParam[0] : emailParam || '';
  const password = Array.isArray(passwordParam) ? passwordParam[0] : passwordParam || '';

  const [vehicle, setVehicle] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [driverLicense, setDriverLicense] = useState('');
  const [truckType, setTruckType] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    if (!vehicle || !licensePlate || !driverLicense || !truckType) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    setLoading(true);

    try {
      const { data: { user }, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (authError) {
        Alert.alert('Erro ao registrar:', authError.message);
        return;
      }

      if (user) {
        const { error: dbError } = await supabase
          .from('drivers')
          .insert([{ 
            id: user.id, 
            vehicle: vehicle, 
            license_plate: licensePlate, 
            driver_license: driverLicense, 
            truck_type: truckType 
          }]);

        if (dbError) {
          Alert.alert('Erro ao salvar dados:', dbError.message);
        } else {
          Alert.alert('Sucesso', 'Registro concluído!');
          router.replace('/app'); // Redireciona para a tela inicial
        }
      }
    } catch (error: any) {
      Alert.alert('Erro inesperado:', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps='handled'
      >
        <View style={styles.container}>
          <TouchableOpacity>
            <Text style={styles.title}>Vejo que você é um motorista</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.subtitle}>Por favor, preencha esses dados:</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Veículo"
            value={vehicle}
            onChangeText={setVehicle}
          />

          <TextInput
            style={styles.input}
            placeholder="Placa do veículo"
            value={licensePlate}
            onChangeText={setLicensePlate}
          />

          <TextInput
            style={styles.input}
            placeholder="Número da CNH"
            value={driverLicense}
            onChangeText={setDriverLicense}
          />

          <TextInput
            style={styles.input}
            placeholder="Tipo de caminhão"
            value={truckType}
            onChangeText={setTruckType}
          />

          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Finalizar Registro</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  button: {
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DriverRegisterScreen;
