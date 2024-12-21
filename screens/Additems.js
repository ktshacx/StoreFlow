import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Button,
} from "react-native";
import { CameraView, Camera } from "expo-camera";
import { addDoc, collection, query, where, getDocs } from "firebase/firestore";
import { firestore } from "../firebase";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../hooks/useAuth";

export default function AddItems() {
  const navigation = useNavigation();
  const { user, loading } = useAuth();
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [barcode, setBarcode] = useState("");
  const [hasPermission, setHasPermission] = useState(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    };

    getCameraPermissions();
  }, []);

  useEffect(() => {
    if (!loading && user === null) {
      navigation.navigate("Login");
    }
  }, [user]);

  const handleBarcodeScanned = ({ type, data }) => {
    setScanning(false);
    setBarcode(data);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Requesting for camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text>No access to camera. Please enable camera permissions.</Text>
      </View>
    );
  }

  const handleAddItem = async () => {
    if (!itemName || !itemPrice || !barcode) {
      alert("Please fill in all fields!");
      return;
    }

    try {
      // Check if the barcode already exists
      const barcodeQuery = query(
        collection(firestore, "items"),
        where("barcode", "==", barcode),
        where("email", "==", user?.email) // Check only for items created by the current user
      );

      const querySnapshot = await getDocs(barcodeQuery);

      if (!querySnapshot.empty) {
        alert("Item with this barcode already exists!");
        return;
      }

      // Add the item to Firestore
      const docRef = await addDoc(collection(firestore, "items"), {
        email: user?.email,
        itemName,
        itemPrice: parseFloat(itemPrice),
        barcode,
        createdAt: Date.now(),
      });

      console.log("Item added with ID:", docRef.id);
      alert("Item added successfully!");

      setItemName("");
      setItemPrice("");
      setBarcode("");
    } catch (error) {
      console.error("Error adding document:", error);
      alert("Failed to add item!");
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView />
      <TextInput
        style={styles.input}
        placeholder="Item Name"
        value={itemName}
        onChangeText={setItemName}
      />
      <TextInput
        style={styles.input}
        placeholder="Item Price"
        value={itemPrice}
        onChangeText={setItemPrice}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Barcode"
        value={barcode}
        onChangeText={setBarcode}
      />
      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => setScanning(true)}
      >
        <Text style={styles.scanButtonText}>Scan Barcode</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={handleAddItem}>
        <Text style={styles.buttonText}>Add Item</Text>
      </TouchableOpacity>

      {/* Barcode Scanner View */}
      {scanning && (
        <View style={styles.scannerContainer}>
          <CameraView
            onBarcodeScanned={scanning ? handleBarcodeScanned : undefined}
            barcodeScannerSettings={{
              barcodeTypes: [
                "qr",
                "pdf417",
                "upc_a",
                "upc_e",
                "ean13",
                "ean8",
              ],
            }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.closeScannerButtonContainer}>
            <Button
              title="Close Scanner"
              color="#fff"
              onPress={() => setScanning(false)}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 24, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 12, borderRadius: 8, marginBottom: 16 },
  button: {
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  scanButton: {
    backgroundColor: "#6200ee",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  scanButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  scannerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  closeScannerButtonContainer: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    backgroundColor: "#000",
    borderRadius: 8,
    padding: 10,
  },
});
