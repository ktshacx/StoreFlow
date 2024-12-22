import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Alert,
  TouchableOpacity,
  Share,
} from "react-native";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "../firebase";
import * as Linking from "expo-linking";
import { getStoreDataByEmail, getStoreNameByEmail } from "../hooks/useStoredata";

export default function ReceiptView({ route }) {
  const { receiptId } = route.params;
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [storename, setStorename] = useState(null);
  const [storedata, setStoredata] = useState(null);

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const docRef = doc(firestore, "receipts", receiptId);
        const receiptDoc = await getDoc(docRef);

        if (receiptDoc.exists()) {
          setReceipt(receiptDoc.data());
          let storename = await getStoreNameByEmail(receiptDoc.data().email);
          setStorename(storename);
          getStoreDataByEmail(receiptDoc.data().email)
          .then(data => setStoredata(data));
        } else {
          Alert.alert("Error", "Receipt not found.");
        }
      } catch (error) {
        console.error("Error fetching receipt:", error);
        Alert.alert("Error", "Failed to fetch receipt.");
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [receiptId]);

  const generateReceiptText = () => {
    if (!receipt) return "";

    let text = `${storename} Receipt\n\n`;
    text += `Customer: ${receipt.customerName || "N/A"}\n`;
    text += `Mobile: ${receipt.customerMobile || "N/A"}\n`;
    text += `Date: ${new Date(receipt.createdAt).toLocaleDateString()}\n\n`;
    text += `Items:\n`;
    receipt.items.forEach((item, index) => {
      text += `${index + 1}. ${item.itemName} - ${storedata ? storedata.currencySymbol : '₹'}${item.itemPrice.toFixed(2)} x ${
        item.quantity
      } = ${storedata ? storedata.currencySymbol : '₹'}${(item.itemPrice * item.quantity).toFixed(2)}\n`;
    });
    text += `\nTotal: ₹${receipt.total.toFixed(2)}`;
    text += `\n\n${storedata ? storedata.receiptNote : ''}`

    return text;
  };

  const handleSendWhatsApp = () => {
    const message = generateReceiptText();
    const url = `https://wa.me/${storedata ? storedata.mobilePrefix.split('+')[1] : '91'}${receipt.customerMobile || ""}?text=${encodeURIComponent(message)}`;

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert("Error", "WhatsApp is not installed or unavailable.");
      }
    });
  };

  const handleSendMessage = () => {
    const message = generateReceiptText();
    const url = `sms:${storedata ? storedata.mobilePrefix : '+91'}${receipt.customerMobile || ""}?body=${encodeURIComponent(
      message
    )}`;

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert("Error", "Messaging app is not available.");
      }
    });
  };

  const handleShare = async () => {
    const message = generateReceiptText();
    try {
      await Share.share({
        message,
      });
    } catch (error) {
      Alert.alert("Error", "Failed to share receipt.");
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading receipt...</Text>
      </View>
    );
  }

  if (!receipt) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No receipt details found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
        <SafeAreaView/>
        <Text style={styles.title}>Receipt</Text>
        <Text style={styles.customerInfo}>
          Customer: {receipt.customerName || "N/A"}
        </Text>
        <Text style={styles.customerInfo}>
          Mobile: {storedata ? storedata.mobilePrefix : '+91'}{receipt.customerMobile || "N/A"}
        </Text>
        <Text style={styles.date}>
          Date: {new Date(receipt.createdAt).toLocaleDateString()}
        </Text>
        <FlatList
          data={receipt.items}
          renderItem={({ item, index }) => (
            <View style={styles.itemContainer}>
              <Text style={styles.itemName}>
                {index + 1}. {item.itemName}
              </Text>
              <Text style={styles.itemDetails}>
                {storedata ? storedata.currencySymbol : '₹'}{item.itemPrice.toFixed(2)} x {item.quantity}
              </Text>
              <Text style={styles.itemTotal}>
                {storedata ? storedata.currencySymbol : '₹'}{(item.itemPrice * item.quantity).toFixed(2)}
              </Text>
            </View>
          )}
          keyExtractor={(item, index) => index.toString()}
          style={styles.itemList}
          ListHeaderComponent={<Text style={styles.listHeader}>Items</Text>}
        />
        <Text style={styles.totalText}>Total: {storedata ? storedata.currencySymbol : '₹'}{receipt.total.toFixed(2)}</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleSendWhatsApp}>
            <Text style={styles.buttonText}>Send via WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleSendMessage}>
            <Text style={styles.buttonText}>Send via SMS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleShare}>
            <Text style={styles.buttonText}>Share</Text>
          </TouchableOpacity>
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 16, textAlign: "center" },
  customerInfo: { fontSize: 16, marginBottom: 8 },
  date: { fontSize: 14, color: "#666", marginBottom: 16 },
  listHeader: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  itemList: { flexGrow: 0, marginBottom: 16 },
  itemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    backgroundColor: "#f9f9f9",
    padding: 8,
    borderRadius: 8,
  },
  itemName: { fontSize: 16, flex: 1 },
  itemDetails: { fontSize: 14, color: "#666", flex: 1, textAlign: "center" },
  itemTotal: { fontSize: 16, fontWeight: "bold", flex: 1, textAlign: "right" },
  totalText: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
    textAlign: "center",
  },
  loadingText: { fontSize: 16, textAlign: "center", marginTop: 20 },
  errorText: { fontSize: 16, textAlign: "center", marginTop: 20, color: "red" },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  button: {
    backgroundColor: "#6200ee",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    width: "30%",
  },
  buttonText: { color: "#fff", fontWeight: "bold", textAlign: "center" },
});
