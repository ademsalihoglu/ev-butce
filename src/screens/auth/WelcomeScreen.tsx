import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthLayout } from '../../components/AuthLayout';
import { AuthStackParamList } from '../../navigation/types';
import { designTokens } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <AuthLayout
      title="Hoş geldiniz"
      subtitle="Ev Bütçe ile gelir, giderlerinizi, alışveriş listenizi ve notlarınızı tek yerden yönetin."
      footer="Verileriniz her cihazdan güvenle erişilebilir."
    >
      <View style={{ gap: designTokens.spacing.md }}>
        <Text style={[designTokens.typography.subtitle, { textAlign: 'center' }]}>
          Hesabınıza erişin veya yeni bir hesap oluşturun
        </Text>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Login')}
          style={styles.btn}
          contentStyle={styles.btnContent}
          icon="login"
        >
          Giriş Yap
        </Button>
        <Button
          mode="contained-tonal"
          onPress={() => navigation.navigate('Register')}
          style={styles.btn}
          contentStyle={styles.btnContent}
          icon="account-plus"
        >
          Hesap Oluştur
        </Button>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  btn: { borderRadius: designTokens.radius.lg },
  btnContent: { paddingVertical: 8 },
});
