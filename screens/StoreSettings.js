import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from "react-native";
import { collection, query, doc, where, getDocs, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { auth, firestore } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import { deleteUser } from "firebase/auth";

export default function StoreSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    storename: "",
    mobilePrefix: "+91",
    receiptNote: "",
    currencySymbol: "₹",
  });
  const [loading, setLoading] = useState(true);
  const [currencyOptions] = useState(["₹", "$", "€", "£", "¥"]);
  const navigation = useNavigation();

  useEffect(() => {
    if(user){
        fetchUserSettings();
    }
  }, [user]);

  const fetchUserSettings = async () => {
    try {
      const docRef = doc(firestore, "users", user.uid);
      const userDoc = await getDoc(docRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const config = userData.config || {};
        setSettings({
            storename: userData.storename || "",
            mobilePrefix: config.mobilePrefix || "+91",
            receiptNote: config.receiptNote || "",
            currencySymbol: config.currencySymbol || "₹",
        });
      } else {
        Alert.alert("Info", "No user settings found, using default values.");
      }
    } catch (error) {
      console.error("Error fetching user settings:", error);
      Alert.alert("Error", "Failed to fetch store settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const docRef = doc(firestore, "users", user.uid);
      await updateDoc(docRef, {
        storename: settings.storename,
        config: {
          mobilePrefix: settings.mobilePrefix,
          receiptNote: settings.receiptNote,
          currencySymbol: settings.currencySymbol,
        },
      });

      Alert.alert("Success", "Settings updated successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      Alert.alert("Error", "Failed to update settings.");
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Delete receipts
              const receiptsQuery = query(
                collection(firestore, "receipts"),
                where("email", "==", user.email)
              );
              const receiptsSnapshot = await getDocs(receiptsQuery);
              const deleteReceiptsPromises = receiptsSnapshot.docs.map((doc) =>
                deleteDoc(doc.ref)
              );
              await Promise.all(deleteReceiptsPromises);
  
              // Delete items
              const itemsQuery = query(
                collection(firestore, "items"),
                where("email", "==", user.email)
              );
              const itemsSnapshot = await getDocs(itemsQuery);
              const deleteItemsPromises = itemsSnapshot.docs.map((doc) =>
                deleteDoc(doc.ref)
              );
              await Promise.all(deleteItemsPromises);
  
              // Delete user document
              const userDocRef = doc(firestore, "users", user.uid);
              await deleteDoc(userDocRef);
  
              // Delete the user from Firebase Authentication
              await deleteUser(auth.currentUser);
              await auth.signOut();
  
              Alert.alert("Account Deleted", "Your account has been successfully deleted.");
              navigation.reset({
                index: 0,
                routes: [{ name: "Login" }],
              });
            } catch (error) {
              console.error("Error deleting account:", error);
              Alert.alert("Error", "Failed to delete account.");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Store Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter store name"
        value={settings.storename}
        onChangeText={(text) =>
          setSettings((prev) => ({ ...prev, storename: text }))
        }
      />

      <Text style={styles.label}>Mobile Prefix</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter mobile prefix"
        value={settings.mobilePrefix}
        onChangeText={(text) =>
          setSettings((prev) => ({ ...prev, mobilePrefix: text }))
        }
      />

      <Text style={styles.label}>Receipt Extra Note</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter extra note for receipts"
        value={settings.receiptNote}
        onChangeText={(text) =>
          setSettings((prev) => ({ ...prev, receiptNote: text }))
        }
      />

      <Text style={styles.label}>Currency Symbol</Text>
      <Picker
        selectedValue={settings.currencySymbol}
        style={styles.picker}
        onValueChange={(value) =>
          setSettings((prev) => ({ ...prev, currencySymbol: value }))
        }
      >
        {currencyOptions.map((symbol) => (
          <Picker.Item key={symbol} label={symbol} value={symbol} />
        ))}
      </Picker>

      <TouchableOpacity style={styles.button} onPress={handleSaveSettings}>
        <Text style={styles.buttonText}>Save Settings</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.deleteButton]}
        onPress={handleDeleteAccount}
      >
        <Text style={styles.buttonText}>Delete Account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 24, textAlign: "center" },
  label: { fontSize: 16, fontWeight: "bold", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  picker: { borderWidth: 1, borderColor: "#ccc", marginBottom: 16 },
  button: {
    backgroundColor: "#6200ee",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  deleteButton: { backgroundColor: "#ff1744" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  loadingText: { fontSize: 16, textAlign: "center", marginTop: 20 },
});
