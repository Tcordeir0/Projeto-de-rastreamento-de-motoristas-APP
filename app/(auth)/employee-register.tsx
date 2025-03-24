import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'expo-router';

const EmployeeRegisterScreen = () => {
  const [branch, setBranch] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          branch: branch || 'Matriz'
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

      <TouchableOpacity 
        style={[styles.button, !branch && styles.disabledButton]} 
        onPress={handleRegister} 
        disabled={!branch || loading}
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
});

export default EmployeeRegisterScreen;
