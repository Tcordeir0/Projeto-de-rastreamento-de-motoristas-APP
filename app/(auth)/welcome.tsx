import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const WelcomeScreen = () => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(0, 122, 255, 0.1)', 'rgba(0, 122, 255, 0.05)', 'transparent']}
        style={styles.gradient}
      />
      
      <View style={styles.header}>
        <Image 
          source={{ uri: 'https://www.freepik.com/icon/truck_3653815#fromView=search&page=1&position=14&uuid=18c78eeb-a2a2-4c25-9633-0323a64ee45a' }} 
          style={styles.truckIcon} 
          resizeMode="contain"
        />
        <Text style={styles.title}>Bem-vindo!</Text>
        <Text style={styles.description}>
          Sua jornada de entregas começa aqui. Gerencie suas rotas e entregas de forma simples e eficiente.
        </Text>
      </View>

      <View style={styles.actionsContainer}>
        <View style={styles.actionSection}>
          <Text style={styles.subtitle}>Deseja se registrar?</Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Criar conta</Text>
            </TouchableOpacity>
          </Link>
        </View>

        <View style={styles.divider} />

        <View style={styles.actionSection}>
          <Text style={styles.subtitle}>Já tem uma conta?</Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Fazer login</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
      
      <View style={styles.footer}>
        <Image 
          source={{ uri: '' }} 
          style={styles.footerImage} 
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '50%',
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
  },
  truckIcon: {
    width: 80,
    height: 80,
    marginBottom: 20,
    tintColor: '#007AFF',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginHorizontal: 20,
    lineHeight: 22,
  },
  actionsContainer: {
    width: '100%',
    marginVertical: 20,
  },
  actionSection: {
    marginVertical: 15,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 12,
    textAlign: 'center',
    color: '#555',
    fontWeight: '500',
  },
  primaryButton: {
    height: 56,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    height: 56,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 20,
  },
  footer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  footerImage: {
    width: width * 0.7,
    height: 120,
    opacity: 0.9,
  }
});

export default WelcomeScreen;