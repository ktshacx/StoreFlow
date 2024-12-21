import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Modal,
  Alert,
} from "react-native";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { firestore } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import { CameraView, Camera } from "expo-camera";
import { useNavigation } from "@react-navigation/native";
import { getStoreDataByEmail } from "../hooks/useStoredata";

export default function CreateReceipt() {
    const navigation = useNavigation();
    const { user, loading } = useAuth();
    const [customerName, setCustomerName] = useState("");
    const [customerMobile, setCustomerMobile] = useState("");
    const [selectedItems, setSelectedItems] = useState([]);
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [hasPermission, setHasPermission] = useState(null);
    const [scanning, setScanning] = useState(false);
    const [searchModalVisible, setSearchModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [scanCooldown, setScanCooldown] = useState(false);
    const [storedata, setStoredata] = useState();

    useEffect(() => {
    if (!loading && user === null) {
      Alert.alert("Error", "You need to log in to create a receipt.");
      return;
    }

    const fetchItems = async () => {
      try {
        const querySnapshot = await getDocs(collection(firestore, "items"));
        const fetchedItems = querySnapshot.docs
          .filter((doc) => doc.data().email === user.email)
          .map((doc) => ({ id: doc.id, ...doc.data() }));
        setItems(fetchedItems);
      } catch (error) {
        console.error("Error fetching items:", error);
        Alert.alert("Error", "Failed to fetch items.");
      }
    };

    if (!loading && user) {
        getStoreDataByEmail(user.email)
        .then(data => setStoredata(data));
        fetchItems();
    }
  }, [user, loading]);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    };

    getCameraPermissions();
  }, []);

    const handleAddToReceipt = (item) => {
        setSelectedItems((prev) => {
          const existingItem = prev.find((selected) => selected.id === item.id);
          if (existingItem) {
            return prev;
          }
          setTotal((prevTotal) => prevTotal + parseFloat(item.itemPrice));
          return [...prev, { ...item, quantity: 1 }];
        });
    };

  const handleRemoveFromReceipt = (itemId) => {
    const updatedItems = selectedItems.filter((item) => item.id !== itemId);
    const removedItem = selectedItems.find((item) => item.id === itemId);

    setSelectedItems(updatedItems);
    setTotal((prev) => prev - parseFloat(removedItem.itemPrice) * removedItem.quantity);
  };

  const handleQuantityChange = (itemId, delta) => {
    setSelectedItems((prev) => {
      return prev.map((item) =>
        item.id === itemId
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      );
    });

    const item = selectedItems.find((item) => item.id === itemId);
    if (item) {
      setTotal((prev) => prev + parseFloat(item.itemPrice) * delta);
    }
  };

  const handleBarcodeScanned = ({ type, data }) => {
    if (scanCooldown) return;

    const item = items.find((i) => i.barcode === data);
    if (item) {
      handleAddToReceipt(item);
      setScanCooldown(true);
      setTimeout(() => setScanCooldown(false), 1000);
    }
    setScanning(false);
  };

  const handleCreateReceipt = async () => {
    if (!customerName || selectedItems.length === 0) {
      Alert.alert("Error", "Please provide customer name and select items.");
      return;
    }

    try {
      const receipt = {
        customerName,
        customerMobile,
        items: selectedItems.map((item) => ({
          itemName: item.itemName,
          itemPrice: item.itemPrice,
          barcode: item.barcode,
          quantity: item.quantity,
        })),
        total,
        createdAt: Date.now(),
        email: user?.email,
      };

      const docRef = await addDoc(collection(firestore, "receipts"), receipt);

        Alert.alert("Success", "Receipt created successfully!");
        setCustomerName("");
        setCustomerMobile("");
        setSelectedItems([]);
        setTotal(0);

      navigation.navigate("Receipt Details", { receiptId: docRef.id });
    } catch (error) {
      console.error("Error creating receipt:", error);
      Alert.alert("Error", "Failed to create receipt.");
    }
  };

  const filteredItems = items.filter((item) =>
    item.itemName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderSelectedItem = ({ item }) => (
    <View style={styles.selectedItemContainer}>
      <Text style={styles.itemName}>{item.itemName}</Text>
      <View style={styles.quantityControls}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => handleQuantityChange(item.id, -1)}
        >
          <Text style={styles.quantityButtonText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.quantityText}>{item.quantity}</Text>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => handleQuantityChange(item.id, 1)}
        >
          <Text style={styles.quantityButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.itemPrice}>
        {storedata ? storedata.currencySymbol : '₹'}{item.itemPrice.toFixed(2)} x {item.quantity}
      </Text>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveFromReceipt(item.id)}
      >
        <Text style={styles.removeButtonText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView />
      <TextInput
        style={styles.input}
        placeholder="Customer Name"
        value={customerName}
        onChangeText={setCustomerName}
      />
      <TextInput
        style={styles.input}
        placeholder="Customer Mobile Number"
        value={customerMobile}
        onChangeText={setCustomerMobile}
      />
      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => setScanning(!scanning)}
      >
        <Text style={styles.scanButtonText}>Scan Item</Text>
      </TouchableOpacity>

      {scanning && (
        <CameraView
          onBarcodeScanned={handleBarcodeScanned}
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
          style={styles.barcodeScanner}
        />
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={() => setSearchModalVisible(true)}
      >
        <Text style={styles.buttonText}>Search & Add Items</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Selected Items</Text>
      <FlatList
        data={selectedItems}
        renderItem={renderSelectedItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text>No items selected.</Text>}
        style={styles.list}
      />
      <Text style={styles.total}>Total: {storedata ? storedata.currencySymbol : '₹'}{total.toFixed(2)}</Text>
      <TouchableOpacity style={styles.button} onPress={handleCreateReceipt}>
        <Text style={styles.buttonText}>Create Receipt</Text>
      </TouchableOpacity>

      {/* Search Modal */}
      <Modal
        visible={searchModalVisible}
        animationType="slide"
        onRequestClose={() => setSearchModalVisible(false)}
      >
        <SafeAreaView/>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Search Items</Text>
          <TextInput
            style={styles.input}
            placeholder="Search items"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <FlatList
            data={filteredItems}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  handleAddToReceipt(item);
                  setSearchModalVisible(false);
                }}
              >
                <Text>{item.itemName}</Text>
                <Text>{storedata ? storedata.currencySymbol : '₹'}{item.itemPrice.toFixed(2)}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={<Text>No items found.</Text>}
          />
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSearchModalVisible(false)}
          >
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 12, borderRadius: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  list: { marginBottom: 16 },
  selectedItemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    backgroundColor: "#f9f9f9",
    padding: 8,
    borderRadius: 8,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    backgroundColor: "#6200ee",
    padding: 5,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  quantityButtonText: { color: "#fff", fontWeight: "bold" },
  quantityText: { fontSize: 16, fontWeight: "bold" },
  removeButton: { backgroundColor: "#ff1744", padding: 8, borderRadius: 8 },
  removeButtonText: { color: "#fff", fontWeight: "bold" },
  total: { fontSize: 20, fontWeight: "bold", marginBottom: 16, textAlign: "center" },
  button: {
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
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
  barcodeScanner: { height: 300, width: "100%", marginBottom: 16 },
  modalContainer: { flex: 1, padding: 16, backgroundColor: "#fff" },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  closeButton: {
    backgroundColor: "#6200ee",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
});
