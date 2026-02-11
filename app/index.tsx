import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/lib/auth-context";
import Colors from "@/constants/colors";

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { user, isLoading: authLoading, login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  React.useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    }
  }, [user]);

  if (authLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: Colors.background }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  async function handleSubmit() {
    if (!email || !password || (!isLogin && !username)) {
      Alert.alert("Missing Fields", "Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, username, password);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/dashboard");
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Something went wrong");
    }
    setLoading(false);
  }

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={[Colors.gradientStart, Colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.headerGradient, { paddingTop: insets.top + webTopInset + 40 }]}
        >
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <MaterialCommunityIcons name="hand-heart" size={40} color={Colors.primary} />
            </View>
            <Text style={styles.appTitle}>Helping Hand</Text>
            <Text style={styles.tagline}>Together, we make change possible.</Text>
          </View>
        </LinearGradient>

        <View style={styles.formContainer}>
          <View style={styles.tabRow}>
            <Pressable
              style={[styles.tab, isLogin && styles.activeTab]}
              onPress={() => { setIsLogin(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            >
              <Text style={[styles.tabText, isLogin && styles.activeTabText]}>Login</Text>
            </Pressable>
            <Pressable
              style={[styles.tab, !isLogin && styles.activeTab]}
              onPress={() => { setIsLogin(false); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            >
              <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>Sign Up</Text>
            </Pressable>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor={Colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {!isLogin && (
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Full name"
                  placeholderTextColor={Colors.textMuted}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Password"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={Colors.textMuted}
                />
              </Pressable>
            </View>
          </View>

          {isLogin && (
            <Pressable style={styles.forgotButton}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </Pressable>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.submitButton,
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              loading && { opacity: 0.7 },
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <LinearGradient
              colors={[Colors.gradientStart, Colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.submitText}>{isLogin ? "Login" : "Create Account"}</Text>
              )}
            </LinearGradient>
          </Pressable>

          <Text style={styles.inspirationalText}>
            {isLogin
              ? "Welcome back! Your kindness matters."
              : "Join our community of giving hearts."}
          </Text>
        </View>

        <View style={{ height: Platform.OS === "web" ? 34 : insets.bottom + 20 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerGradient: {
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  logoContainer: {
    alignItems: "center",
    gap: 12,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  appTitle: {
    fontSize: 32,
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.white,
  },
  tagline: {
    fontSize: 15,
    fontFamily: "Nunito_400Regular",
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
  },
  formContainer: {
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: Colors.border,
    borderRadius: 14,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 11,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: Colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 15,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.textMuted,
  },
  activeTabText: {
    color: Colors.primary,
  },
  inputGroup: {
    gap: 14,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    height: 54,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Nunito_400Regular",
    color: Colors.text,
  },
  eyeButton: {
    padding: 6,
  },
  forgotButton: {
    alignSelf: "flex-end",
    marginTop: 10,
    marginBottom: 4,
  },
  forgotText: {
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.accent,
  },
  submitButton: {
    marginTop: 20,
    borderRadius: 14,
    overflow: "hidden",
  },
  submitGradient: {
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 14,
  },
  submitText: {
    fontSize: 17,
    fontFamily: "Nunito_700Bold",
    color: Colors.white,
  },
  inspirationalText: {
    textAlign: "center",
    fontSize: 13,
    fontFamily: "Nunito_400Regular",
    color: Colors.textMuted,
    marginTop: 20,
  },
});
