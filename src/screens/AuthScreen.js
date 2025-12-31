import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { COLORS } from '../constants/theme';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    if (error) Alert.alert(error.message);
    setLoading(false);
  }

  async function signUpWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });
    if (error) Alert.alert('Check your email for the confirmation link!');
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>KNECT</Text>
      <Text style={styles.subtitle}>Join the global network</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={COLORS.textDim}
        onChangeText={(text) => setEmail(text)}
        value={email}
        autoCapitalize={'none'}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={COLORS.textDim}
        secureTextEntry={true}
        onChangeText={(text) => setPassword(text)}
        value={password}
        autoCapitalize={'none'}
      />

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: COLORS.primary }]} 
        onPress={() => signInWithEmail()}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, { borderColor: COLORS.primary, borderWidth: 1 }]} 
        onPress={() => signUpWithEmail()}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', padding: 20 },
  title: { color: COLORS.text, fontSize: 40, fontWeight: 'bold', textAlign: 'center', letterSpacing: 10 },
  subtitle: { color: COLORS.secondary, textAlign: 'center', marginBottom: 40, letterSpacing: 2 },
  input: { backgroundColor: COLORS.surface, color: 'white', padding: 15, borderRadius: 10, marginBottom: 15 },
  button: { padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});