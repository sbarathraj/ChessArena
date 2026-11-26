import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../services/supabase/AuthContext';

export const UsernameOnboardingModal: React.FC = () => {
  const { profile, setCustomUsername } = useAuth();
  const [usernameInput, setUsernameInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If user already has a custom set username, don't show modal
  if (profile?.username && !profile.username.startsWith('guest_') && !profile.username.startsWith('Guest_')) {
    return null;
  }

  const handleSaveUsername = async () => {
    const clean = usernameInput.trim();
    if (clean.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(clean)) {
      setError('Letters, numbers, and underscores only.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await setCustomUsername(clean);
    } catch (err: any) {
      setError(err?.message || 'Could not save username.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={true} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>WELCOME TO CHESS ARENA</Text>
          </View>
          <Text style={styles.title}>Sign In / Enter Username</Text>
          <Text style={styles.subtitle}>
            Enter your player username (e.g. rajeshkanna or barathraj). If you already have an account with this name, you will be signed in automatically!
          </Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. rajeshkanna"
            placeholderTextColor="#666"
            value={usernameInput}
            onChangeText={(t) => {
              setUsernameInput(t);
              setError(null);
            }}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={20}
          />

          {error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={styles.btn}
            onPress={handleSaveUsername}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.btnText}>Play / Sign In ➔</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 9999,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#262421',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1.5,
    borderColor: '#81B64C',
    alignItems: 'center',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)',
    elevation: 20,
  },
  badge: {
    backgroundColor: 'rgba(129, 182, 76, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#81B64C',
  },
  badgeText: {
    color: '#81B64C',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#999490',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  input: {
    width: '100%',
    backgroundColor: '#302E2B',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
    borderWidth: 1.5,
    borderColor: '#3D3A34',
    textAlign: 'center',
    marginBottom: 12,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  btn: {
    width: '100%',
    backgroundColor: '#81B64C',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
