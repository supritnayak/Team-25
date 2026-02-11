import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { apiRequest } from "@/lib/query-client";
import Colors from "@/constants/colors";

export default function DonateScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState<"food" | "clothes" | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [shareLocation, setShareLocation] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [availabilityStart, setAvailabilityStart] = useState("9:00 AM");
  const [availabilityEnd, setAvailabilityEnd] = useState("5:00 PM");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (shareLocation) {
      getLocation();
    }
  }, [shareLocation]);

  async function getLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      }
    } catch {}
  }

  async function handleSubmit() {
    if (!category || !title) {
      Alert.alert("Missing Fields", "Please select a category and enter a title.");
      return;
    }
    setLoading(true);
    try {
      await apiRequest("POST", "/api/donations", {
        category,
        title,
        description,
        latitude: location?.latitude,
        longitude: location?.longitude,
        availabilityStart,
        availabilityEnd,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push("/donate-confirm");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create donation");
    }
    setLoading(false);
  }

  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  const timeOptions = [
    "6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM",
    "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM",
    "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM",
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.topBar, { paddingTop: insets.top + webTopInset + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.topTitle}>Donate</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.progressRow}>
        {[0, 1, 2].map((s) => (
          <View key={s} style={[styles.progressDot, step >= s && styles.progressDotActive]} />
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + webBottomInset + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 0 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>What would you like to donate?</Text>
            <Text style={styles.stepSubtitle}>Select a category below</Text>

            <Pressable
              style={[styles.categoryCard, category === "food" && styles.categoryCardActive]}
              onPress={() => { setCategory("food"); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            >
              <View style={[styles.categoryIcon, { backgroundColor: "#E8F5E9" }]}>
                <Ionicons name="fast-food-outline" size={32} color={Colors.primary} />
              </View>
              <View style={styles.categoryContent}>
                <Text style={styles.categoryTitle}>Food</Text>
                <Text style={styles.categoryDesc}>Meals, groceries, fresh produce</Text>
              </View>
              {category === "food" && (
                <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
              )}
            </Pressable>

            <Pressable
              style={[styles.categoryCard, category === "clothes" && styles.categoryCardActive]}
              onPress={() => { setCategory("clothes"); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            >
              <View style={[styles.categoryIcon, { backgroundColor: "#E3F2FD" }]}>
                <Ionicons name="shirt-outline" size={32} color={Colors.accent} />
              </View>
              <View style={styles.categoryContent}>
                <Text style={styles.categoryTitle}>Clothes</Text>
                <Text style={styles.categoryDesc}>Shirts, pants, jackets, shoes</Text>
              </View>
              {category === "clothes" && (
                <Ionicons name="checkmark-circle" size={24} color={Colors.accent} />
              )}
            </Pressable>
          </View>
        )}

        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Donation Details</Text>
            <Text style={styles.stepSubtitle}>Tell us about your donation</Text>

            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Title</Text>
              <TextInput
                style={styles.textInput}
                placeholder={category === "food" ? "e.g. Fresh vegetables" : "e.g. Winter jackets"}
                placeholderTextColor={Colors.textMuted}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Description (optional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Add details about your donation..."
                placeholderTextColor={Colors.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Location & Availability</Text>
            <Text style={styles.stepSubtitle}>Help receivers find you</Text>

            <Pressable
              style={[styles.locationToggle, shareLocation && styles.locationToggleActive]}
              onPress={() => {
                setShareLocation(!shareLocation);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Ionicons
                name={shareLocation ? "location" : "location-outline"}
                size={24}
                color={shareLocation ? Colors.primary : Colors.textMuted}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.locationToggleText, shareLocation && { color: Colors.primary }]}>
                  Share Live Location
                </Text>
                {shareLocation && location && (
                  <Text style={styles.locationCoords}>
                    {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                  </Text>
                )}
              </View>
              <View style={[styles.toggleSwitch, shareLocation && styles.toggleSwitchActive]}>
                <View style={[styles.toggleCircle, shareLocation && styles.toggleCircleActive]} />
              </View>
            </Pressable>

            <View style={styles.timeSection}>
              <Text style={styles.fieldLabel}>Available From</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
                {timeOptions.map((time) => (
                  <Pressable
                    key={`start-${time}`}
                    style={[styles.timeChip, availabilityStart === time && styles.timeChipActive]}
                    onPress={() => setAvailabilityStart(time)}
                  >
                    <Text style={[styles.timeChipText, availabilityStart === time && styles.timeChipTextActive]}>
                      {time}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View style={styles.timeSection}>
              <Text style={styles.fieldLabel}>Available Until</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
                {timeOptions.map((time) => (
                  <Pressable
                    key={`end-${time}`}
                    style={[styles.timeChip, availabilityEnd === time && styles.timeChipActive]}
                    onPress={() => setAvailabilityEnd(time)}
                  >
                    <Text style={[styles.timeChipText, availabilityEnd === time && styles.timeChipTextActive]}>
                      {time}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + webBottomInset + 16 }]}>
        {step > 0 && (
          <Pressable
            style={styles.backStepButton}
            onPress={() => setStep(step - 1)}
          >
            <Text style={styles.backStepText}>Back</Text>
          </Pressable>
        )}
        <Pressable
          style={[styles.nextButton, { flex: step > 0 ? 2 : 1 }]}
          onPress={() => {
            if (step < 2) {
              if (step === 0 && !category) {
                Alert.alert("Select Category", "Please choose a category first.");
                return;
              }
              if (step === 1 && !title) {
                Alert.alert("Enter Title", "Please enter a title for your donation.");
                return;
              }
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setStep(step + 1);
            } else {
              handleSubmit();
            }
          }}
          disabled={loading}
        >
          <LinearGradient
            colors={[Colors.gradientStart, Colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextGradient}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.nextText}>{step === 2 ? "Submit Donation" : "Continue"}</Text>
            )}
          </LinearGradient>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  topTitle: {
    fontSize: 18,
    fontFamily: "Nunito_700Bold",
    color: Colors.text,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingBottom: 12,
  },
  progressDot: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  progressDotActive: {
    backgroundColor: Colors.primary,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  stepContainer: {
    gap: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontFamily: "Nunito_800ExtraBold",
    color: Colors.text,
  },
  stepSubtitle: {
    fontSize: 14,
    fontFamily: "Nunito_400Regular",
    color: Colors.textMuted,
    marginBottom: 8,
  },
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    gap: 14,
  },
  categoryCardActive: {
    borderColor: Colors.primary,
    backgroundColor: "#F0F9F4",
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryContent: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 17,
    fontFamily: "Nunito_700Bold",
    color: Colors.text,
  },
  categoryDesc: {
    fontSize: 13,
    fontFamily: "Nunito_400Regular",
    color: Colors.textMuted,
    marginTop: 2,
  },
  formGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.textSecondary,
  },
  textInput: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: "Nunito_400Regular",
    color: Colors.text,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  locationToggle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  locationToggleActive: {
    borderColor: Colors.primary,
    backgroundColor: "#F0F9F4",
  },
  locationToggleText: {
    fontSize: 15,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.text,
  },
  locationCoords: {
    fontSize: 12,
    fontFamily: "Nunito_400Regular",
    color: Colors.textMuted,
    marginTop: 2,
  },
  toggleSwitch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.border,
    padding: 2,
    justifyContent: "center",
  },
  toggleSwitchActive: {
    backgroundColor: Colors.primary,
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.white,
  },
  toggleCircleActive: {
    alignSelf: "flex-end",
  },
  timeSection: {
    gap: 8,
  },
  timeScroll: {
    flexGrow: 0,
  },
  timeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  timeChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  timeChipText: {
    fontSize: 13,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.textSecondary,
  },
  timeChipTextActive: {
    color: Colors.white,
  },
  bottomBar: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  backStepButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  backStepText: {
    fontSize: 16,
    fontFamily: "Nunito_600SemiBold",
    color: Colors.textSecondary,
  },
  nextButton: {
    borderRadius: 14,
    overflow: "hidden",
  },
  nextGradient: {
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 14,
  },
  nextText: {
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
    color: Colors.white,
  },
});
