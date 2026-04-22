import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, HelperText, TextInput, Text } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthLayout } from '../../components/AuthLayout';
import { AuthStackParamList } from '../../navigation/types';
import { designTokens } from '../../theme';
import { useAuth } from '../../context/AuthContext';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      setError('E-posta ve şifre gerekli.');
      return;
    }
    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalı.');
      return;
    }
    if (password !== confirm) {
      setError('Şifreler eşleşmiyor.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await signUp(email, password, name.trim() || undefined);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Hesap Oluştur" subtitle="Birkaç saniyede hesabınızı oluşturun.">
      <View style={{ gap: designTokens.spacing.md }}>
        <TextInput
          label="Ad Soyad (opsiyonel)"
          value={name}
          onChangeText={setName}
          mode="outlined"
          left={<TextInput.Icon icon="account-outline" />}
        />
        <TextInput
          label="E-posta"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          mode="outlined"
          left={<TextInput.Icon icon="email-outline" />}
        />
        <TextInput
          label="Şifre"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          mode="outlined"
          left={<TextInput.Icon icon="lock-outline" />}
        />
        <TextInput
          label="Şifre (tekrar)"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          mode="outlined"
          left={<TextInput.Icon icon="lock-check-outline" />}
        />
        {error ? (
          <HelperText type="error" visible>
            {error}
          </HelperText>
        ) : null}
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={submitting}
          disabled={submitting}
          contentStyle={{ paddingVertical: 6 }}
          icon="account-plus"
        >
          Hesap Oluştur
        </Button>
        <View style={{ alignItems: 'center', marginTop: designTokens.spacing.sm }}>
          <Text style={designTokens.typography.caption}>Zaten hesabın var mı?</Text>
          <Button compact onPress={() => navigation.navigate('Login')}>
            Giriş yap
          </Button>
        </View>
      </View>
    </AuthLayout>
  );
}
