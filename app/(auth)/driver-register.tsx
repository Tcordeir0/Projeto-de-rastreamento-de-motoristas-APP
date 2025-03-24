import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'expo-router';

const DriverRegisterScreen = () => {
  const [vehicle, setVehicle] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [driverLicense, setDriverLicense] = useState('');
  const [truckType, setTruckType] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          vehicle,
          license_plate: licensePlate,
          driver_license: driverLicense,
          truck_type: truckType
        }
      });

      if (error) throw error;

      router.replace('/');
    } catch (error) {
      console.error('Erro ao registrar:', error);
      alert('Erro ao registrar. Verifique suas informações.');
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
