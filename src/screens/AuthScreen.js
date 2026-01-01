import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { COLORS } from '../constants/theme';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true); // Toggle between Login/Signup

  async function handleAuth() {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    setLoading(true);

    try {
      if (isLogin) {
        // LOGIN
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        // SIGNUP
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        // Check if session was created immediately (Confirm Email is OFF)
        if (data.session) {
           // Success, App.js will switch screens automatically
        } else {
           Alert.alert("Check Email", "Please check your email to verify account.");
        }
      }
    } catch (error) {
      Alert.alert("Authentication Failed", error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>KNECT</Text>
      <Text style={styles.subtitle}>{isLogin ? "Welcome back, Networker." : "Join the Grid."}</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={COLORS.textDim}
          onChangeText={setEmail}
          value={email}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={COLORS.textDim}
          secureTextEntry
          onChangeText={setPassword}
          value={password}
        />
      </View>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: COLORS.primary }]} 
        onPress={handleAuth}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="black" />
        ) : (
          <Text style={styles.buttonText}>{isLogin ? "LOGIN" : "SIGN UP"}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={{marginTop: 20}}>
        <Text style={{color: COLORS.textDim}}>
          {isLogin ? "New here? Create Account" : "Already have an account? Login"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', padding: 20 },
  title: { color: COLORS.text, fontSize: 40, fontWeight: 'bold', textAlign: 'center', letterSpacing: 8 },
  subtitle: { color: COLORS.secondary, textAlign: 'center', marginBottom: 40, letterSpacing: 1 },
  inputContainer: { gap: 15, marginBottom: 30 },
  input: { backgroundColor: COLORS.surface, color: 'white', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#333' },
  button: { padding: 15, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: 'black', fontWeight: 'bold', fontSize: 16 }
});