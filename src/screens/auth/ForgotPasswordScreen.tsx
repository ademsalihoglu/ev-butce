import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, HelperText, TextInput } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthLayout } from '../../components/AuthLayout';
import { AuthStackParamList } from '../../navigation/types';
import { designTokens } from '../../theme';
import { useAuth } from '../../context/AuthContext';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      setError('E-posta gerekli.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Şifremi Unuttum"
      subtitle="E-postanızı girin, şifre sıfırlama bağlantısı gönderelim."
    >
      <View style={{ gap: designTokens.spacing.md }}>
        <TextInput
          label="E-posta"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          mode="outlined"
          left={<TextInput.Icon icon="email-outline" />}
        />
        {error ? (
          <HelperText type="error" visible>
            {error}
          </HelperText>
        ) : null}
        {sent ? (
          <HelperText type="info" visible>
            Sıfırlama bağlantısı gönderildi. E-postanızı kontrol edin.
          </HelperText>
        ) : null}
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={submitting}
          disabled={submitting}
          contentStyle={{ paddingVertical: 6 }}
          icon="email-send-outline"
        >
          Bağlantı Gönder
        </Button>
        <Button compact onPress={() => navigation.navigate('Login')}>
          Girişe geri dön
        </Button>
      </View>
    </AuthLayout>
  );
}
