import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'expo-router';

const BRANCHES = [
  'BA', 'CE', 'MA', 'MG', 'MS', 'MT', 'PA', 'PE', 'PI', 'PR', 'SE', 'SP', 'SC', 'TO'
];

const RegisterScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [veiculo, setVeiculo] = useState('');
  const [placa, setPlaca] = useState('');
  const [filial, setFilial] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [truckType, setTruckType] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    setLoading(true);
    try {
      const isBorgnoTransportes = email.toLowerCase().endsWith('@borgnotransportes.com.br');
      
      if (!email || !password || !phoneNumber) {
        setError('Preencha todos os campos obrigatórios');
        return;
      }

      if (isBorgnoTransportes && !filial) {
        setError('Selecione uma filial ou matriz');
        return;
      }

      if (!isBorgnoTransportes && (!licenseNumber || !truckType)) {
        setError('Preencha os dados do veículo e CNH');
        return;
      }

      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      // Inserir dados adicionais na tabela 'users'
      const { error: userError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user?.id,
            email,
            nome,
            cpf,
            veiculo,
            placa,
            filial: isBorgnoTransportes ? (filial || 'Matriz') : null,
            isAdmin: isBorgnoTransportes,
          },
        ]);

      if (userError) throw userError;

      // Redirecionar para a tela principal após o registro
      router.replace('/');
    } catch (error) {
      console.error('Erro ao registrar:', error);
      alert('Erro ao registrar. Verifique os dados informados.');
    } finally {
      setLoading(false);
    }
  };

  const isBorgnoTransportes = email.toLowerCase().endsWith('@borgnotransportes.com.br');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registro</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Nome"
        value={nome}
        onChangeText={setNome}
      />

      <TextInput
        style={styles.input}
        placeholder="CPF"
        value={cpf}
        onChangeText={setCpf}
        keyboardType="numeric"
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TextInput
        style={styles.input}
        placeholder="Número de Telefone"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
      />

      <TextInput
        style={styles.input}
        placeholder="Veículo"
        value={veiculo}
        onChangeText={setVeiculo}
      />

      <TextInput
        style={styles.input}
        placeholder="Placa"
        value={placa}
        onChangeText={setPlaca}
      />

      {isBorgnoTransportes ? (
        <View style={styles.branchContainer}>
          <Text style={styles.branchTitle}>Selecione a Filial:</Text>
          <TouchableOpacity
            style={[styles.branchButton, !filial && styles.selectedBranch]}
            onPress={() => setFilial('')}
          >
            <Text style={styles.branchText}>Matriz (Goiânia)</Text>
          </TouchableOpacity>
          {BRANCHES.map((branchName) => (
            <TouchableOpacity
              key={branchName}
              style={[styles.branchButton, filial === branchName && styles.selectedBranch]}
              onPress={() => setFilial(branchName)}
            >
              <Text style={styles.branchText}>{branchName}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="Número da CNH"
            value={licenseNumber}
            onChangeText={setLicenseNumber}
          />
          <TextInput
            style={styles.input}
            placeholder="Tipo do Caminhão"
            value={truckType}
            onChangeText={setTruckType}
          />
        </>
      )}

      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Registrar</Text>
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
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    marginBottom: 15,
  },
  branchContainer: {
    width: '100%',
    marginBottom: 15,
  },
  branchTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  branchButton: {
    width: '100%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 5,
  },
  selectedBranch: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  branchText: {
    textAlign: 'center',
    fontSize: 16,
  },
});

export default RegisterScreen;