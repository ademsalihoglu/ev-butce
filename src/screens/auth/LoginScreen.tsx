import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, HelperText, TextInput, Text } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthLayout } from '../../components/AuthLayout';
import { AuthStackParamList } from '../../navigation/types';
import { designTokens } from '../../theme';
import { useAuth } from '../../context/AuthContext';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { signIn, configured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      setError('E-posta ve şifre gerekli.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Giriş Yap" subtitle="Hesabınızla devam edin.">
      <View style={{ gap: designTokens.spacing.md }}>
        {!configured ? (
          <HelperText type="error" visible>
            Firebase yapılandırması eksik. .env dosyanızı kontrol edin.
          </HelperText>
        ) : null}
        <TextInput
          label="E-posta"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
          mode="outlined"
          left={<TextInput.Icon icon="email-outline" />}
        />
        <TextInput
          label="Şifre"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          mode="outlined"
          left={<TextInput.Icon icon="lock-outline" />}
          right={
            <TextInput.Icon
              icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
              onPress={() => setShowPassword((v) => !v)}
            />
          }
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
          icon="login"
        >
          Giriş Yap
        </Button>
        <Button compact onPress={() => navigation.navigate('ForgotPassword')}>
          Şifremi unuttum
        </Button>
        <View style={{ alignItems: 'center', marginTop: designTokens.spacing.sm }}>
          <Text style={designTokens.typography.caption}>Hesabın yok mu?</Text>
          <Button compact onPress={() => navigation.navigate('Register')}>
            Hesap oluştur
          </Button>
        </View>
      </View>
    </AuthLayout>
  );
}
