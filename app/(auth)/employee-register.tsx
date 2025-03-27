import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, ScrollView, TextInput } from 'react-native';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'expo-router';

const EmployeeRegisterScreen = () => {
  const [branch, setBranch] = useState<string | null>(null);
  const [phone, setPhone] = useState<string>("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    const { data: { user }, error: authError } = await supabase.auth.signUp({
      email: 'email@example.com', // You need to define email and password variables
      password: 'password',
    });

    if (authError) {
      console.error('Erro ao registrar:', authError.message);
      return;
    }

    if (user) {
      const { error: dbError } = await supabase
        .from('users')
        .insert([{ id: user.id, email: 'email@example.com', phone: phone, name: 'Name' }]); // You need to define name variable

      if (dbError) {
        console.error('Erro ao salvar dados:', dbError.message);
      } else {
        console.log('Registro e dados salvos com sucesso!');
        router.replace('/home'); // Redireciona para a tela principal após o registro
      }
    }
  };

  const branches = [
    'Matriz (Goiânia)',
    'Barreiras',
    'LEM Cotton',
    'LEM Grãos',
    'LEM Frota',
    'SP Franca',
    'Marabá',
    'Açailândia',
    'Candeiras',
    'Laranjeiras',
    'Rondonópolis',
    'Sapezal MT',
    'Uberaba',
    'Cuiabá',
    'Três Lagoas',
    'Primavera do Leste',
    'Paranaguá'
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Agora falta pouco!</Text>
      <Text style={styles.subtitle}>Por favor, selecione sua filial:</Text>

      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setShowDropdown(!showDropdown)}
      >
        <Text style={styles.dropdownButtonText}>
          {branch || 'Selecione uma filial'}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={showDropdown}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDropdown(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <ScrollView>
              {branches.map((branchName) => (
                <TouchableOpacity
                  key={branchName}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setBranch(branchName);
                    setShowDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{branchName}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <TextInput
        style={styles.input}
        placeholder="Número de telefone"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <TouchableOpacity 
        style={[styles.button, !branch && styles.disabledButton]} 
        onPress={handleRegister} 
        disabled={!branch || !phone || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Finalizar Registro</Text>
        )}
      </TouchableOpacity>
    </View>
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
  dropdownButton: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 15,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 8,
    maxHeight: '60%',
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  button: {
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 15,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
});

export default EmployeeRegisterScreen;
