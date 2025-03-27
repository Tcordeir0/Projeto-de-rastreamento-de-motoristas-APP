import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, ScrollView, TextInput, Alert } from 'react-native';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';

const EmployeeRegisterScreen = () => {
  const { email: emailParam } = useLocalSearchParams();
  const email = Array.isArray(emailParam) ? emailParam[0] : emailParam || '';
  const [phone, setPhone] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [branch, setBranch] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    if (!phone || !branch || !name) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    setLoading(true);

    try {
      const { data: { user }, error: authError } = await supabase.auth.signUp({
        email: email,
        password: 'password',
      });

      if (authError) {
        Alert.alert('Erro ao registrar:', authError.message);
        return;
      }

      if (user) {
        const { error: dbError } = await supabase
          .from('admins')
          .insert([{ id: user.id, phone: phone, name: name, branch: branch }]);

        if (dbError) {
          Alert.alert('Erro ao salvar dados:', dbError.message);
        } else {
          Alert.alert('Sucesso', 'Registro concluído!');
          router.replace('/app');
        }
      }
    } catch (error: any) {
      Alert.alert('Erro inesperado:', error.message);
    } finally {
      setLoading(false);
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
        placeholder="Nome"
        value={name}
        onChangeText={(text) => setName(text)}
      />

      <TextInput
        style={styles.input}
        placeholder="Número de telefone"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        editable={false}
      />

      <TouchableOpacity 
        style={[styles.button, !branch && styles.disabledButton]} 
        onPress={() => {
          if (!loading) {
            handleRegister();
          }
        }} 
        disabled={!branch || !phone || !name || loading}
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
