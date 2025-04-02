import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { supabase } from '@/utils/supabase';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Types
type Message = {
  id: string;
  text: string;
  userId: string;
  userEmail: string;
  timestamp: string;
  imageUrl?: string;
};

type Contact = {
  id: string;
  name: string;
  lastMessage: string;
  lastMessageTime: string;
  avatar: string;
  unread: number;
};

// Mock data for contacts
const mockContacts: Contact[] = [
  {
    id: '1',
    name: 'Motorista Teste',
    lastMessage: 'Está disponível para uma coleta em LEM, Avenida Kiichiro Murata, 478, Sala 02?',
    lastMessageTime: '10:30',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    unread: 0,
  }
];

export default function Chat() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showChat, setShowChat] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Mock messages for the test conversation
  const mockMessages: Message[] = [
    {
      id: '1',
      text: 'Olá, vi que me chamou para uma coleta, a onde seria mesmo?',
      userId: 'current-user-id',
      userEmail: 'you@example.com',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '2',
      text: 'Estou perto de LEM ainda.',
      userId: 'other-user-id',
      userEmail: 'driver@example.com',
      timestamp: new Date(Date.now() - 3500000).toISOString(),
    }
  ];

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/(auth)/login');
      } else {
        setLoading(false);
        setUser(session.user);
      }
    };

    checkSession();
  }, []);

  useEffect(() => {
    if (loading) return;

    if (showChat) {
      // In a real app, you would load messages from Supabase here
      // For now, we'll use mock data
      setMessages(mockMessages);
    }
  }, [loading, showChat]);

  const sendMessage = async () => {
    if (!newMessage.trim() && !uploading) return

    try {
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            text: newMessage.trim(),
            sender_id: user.id,
            chat_id: selectedContact?.id,
          },
        ])
        .select()

      if (error) throw error

      setMessages(current => [...current, data[0]])
      setNewMessage('')
      Keyboard.dismiss()
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setUploading(true);
      try {
        if (!user) throw new Error('Usuário não autenticado');

        // In a real app, you would upload to Supabase here
        setTimeout(() => {
          const newMsg = {
            id: Date.now().toString(),
            text: '',
            userId: user.id,
            userEmail: user.email,
            timestamp: new Date().toISOString(),
            imageUrl: result.assets[0].uri,
          };
          
          setMessages(current => [...current, newMsg]);
          setUploading(false);
        }, 1000);
      } catch (error) {
        console.error('Erro ao enviar imagem:', error);
        setUploading(false);
      }
    }
  };

  const openChat = (contact: Contact) => {
    setSelectedContact(contact);
    setShowChat(true);
  };

  const goBack = () => {
    setShowChat(false);
    setSelectedContact(null);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    return (
      <View style={[
        styles.messageContainer,
        item.userId === user?.id ? styles.sentMessage : styles.receivedMessage
      ]}>
        {item.text && <Text style={styles.messageText}>{item.text}</Text>}
        {item.imageUrl && (
          <Image source={{ uri: item.imageUrl }} style={styles.messageImage} />
        )}
        <Text style={styles.messageTime}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  const renderContact = ({ item }: { item: Contact }) => {
    return (
      <TouchableOpacity style={styles.contactItem} onPress={() => openChat(item)}>
        <Image source={{ uri: item.avatar }} style={styles.contactAvatar} />
        <View style={styles.contactInfo}>
          <View style={styles.contactHeader}>
            <Text style={styles.contactName}>{item.name}</Text>
            <Text style={styles.contactTime}>{item.lastMessageTime}</Text>
          </View>
          <Text style={styles.contactLastMessage} numberOfLines={1}>
            {item.lastMessage}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      
      {!showChat ? (
        // Contacts list (WhatsApp initial screen)
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Chat</Text>
          </View>
          
          <FlatList
            data={mockContacts}
            renderItem={renderContact}
            keyExtractor={(item) => item.id}
            style={styles.contactsList}
          />
        </View>
      ) : (
        // Chat screen
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
          keyboardVerticalOffset={90}
        >
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={goBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            
            <Image 
              source={{ uri: selectedContact?.avatar }} 
              style={styles.headerAvatar} 
            />
            
            <View style={styles.headerInfo}>
              <Text style={styles.headerName}>{selectedContact?.name}</Text>
              <Text style={styles.headerStatus}>Online</Text>
            </View>
            
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerButton}>
                <Ionicons name="call" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            style={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />

          <View style={styles.inputContainer}>
            <TouchableOpacity style={styles.attachButton}>
              <Ionicons name="document-attach" size={24} color="#007AFF" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.imageButton}
              onPress={pickImage}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <Ionicons name="camera" size={24} color="#007AFF" />
              )}
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Mensagem"
              multiline
            />

            <TouchableOpacity
              style={styles.sendButton}
              onPress={sendMessage}
              disabled={(!newMessage.trim() && !uploading) || uploading}
            >
              <Ionicons 
                name={newMessage.trim() ? "send" : "mic"} 
                size={20} 
                color="#fff" 
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#007AFF', // WhatsApp green for header
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 + 16 : 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  contactsList: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contactItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  contactAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  contactTime: {
    fontSize: 12,
    color: '#666',
  },
  contactLastMessage: {
    fontSize: 14,
    color: '#666',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    padding: 10,
    paddingTop: Platform.OS === 'ios' ? StatusBar.currentHeight || 0 + 10 : 10,
  },
  backButton: {
    padding: 5,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 10,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerStatus: {
    color: '#0ca56a',
    fontSize: 12,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
  },
  messagesList: {
    flex: 1,
    backgroundColor: '#E5DDD3', // WhatsApp chat background
  },
  messageContainer: {
    margin: 8,
    padding: 10,
    borderRadius: 8,
    maxWidth: '80%',
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6', // Keep your green bubble color
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
  },
  messageText: {
    fontSize: 16,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginVertical: 4,
  },
  messageTime: {
    fontSize: 10,
    color: '#666',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 8,
    maxHeight: 100,
  },
  attachButton: {
    padding: 8,
  },
  imageButton: {
    padding: 8,
  },
  sendButton: {
    backgroundColor: '#007AFF', // Keep your blue send button
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});