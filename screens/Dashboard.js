import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../hooks/useAuth";
import { getStoreDataByEmail, getStoreNameByEmail } from "../hooks/useStoredata";
import { collection, getDocs } from "firebase/firestore";
import { auth, firestore } from "../firebase";
import DateTimePicker from "@react-native-community/datetimepicker";
import { signOut } from "firebase/auth";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [storename, setStorename] = useState(null);
  const [storedata, setStoredata] = useState(null);
  const navigation = useNavigation();

  const [receipts, setReceipts] = useState([]);
  const [itemsCount, setItemsCount] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [startDate, setStartDate] = useState(new Date(Date.now() - 24 * 3600 * 1000));
  const [endDate, setEndDate] = useState(new Date());
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [currentPicker, setCurrentPicker] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!loading && user === null) {
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    }

    async function fetchData() {
      let storename = await getStoreNameByEmail(user?.email);
      let storedata = await getStoreDataByEmail(user?.email);
      setStorename(storename);
      setStoredata(storedata);
      fetchReceipts();
    }

    if (!loading && user) {
      fetchData()
    }
  }, [user, loading]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } catch (error) {
      Alert.alert("Error", "Failed to log out. Please try again.");
      console.error("Logout error:", error);
    }
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      ),
      headerLeft: null
    });
  }, [navigation]);

  const fetchReceipts = async () => {
    try {
      const querySnapshot = await getDocs(collection(firestore, "receipts"));
      const fetchedReceipts = querySnapshot.docs
        .filter((doc) => doc.data().email === user.email)
        .map((doc) => ({ id: doc.id, ...doc.data() }));
      setReceipts(fetchedReceipts);
      return fetchedReceipts;
    } catch (error) {
      console.error("Error fetching receipts:", error);
      Alert.alert("Error", "Failed to fetch receipts.");
    }
  };

  const calculateTotals = () => {
    const filteredReceipts = receipts.filter((receipt) => {
      const receiptDate = new Date(receipt.createdAt);
      return receiptDate >= startDate && receiptDate <= endDate;
    });

    let totalItems = 0;
    let totalAmount = 0;

    filteredReceipts.forEach((receipt) => {
      receipt.items.forEach((item) => {
        totalItems += item.quantity;
      });
      totalAmount += receipt.total;
    });

    setItemsCount(totalItems);
    setTotalSales(totalAmount);
  };

  useEffect(() => {
    calculateTotals();
  }, [startDate, endDate, receipts]);

  const handleDateChange = (event, selectedDate) => {
    if (selectedDate) {
      if (currentPicker === "start") {
        setStartDate(selectedDate);
      } else if (currentPicker === "end") {
        setEndDate(selectedDate);
      }
    }
    setDatePickerVisible(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    let storename = await getStoreNameByEmail(user?.email);
    let storedata = await getStoreDataByEmail(user?.email);
    setStorename(storename);
    setStoredata(storedata);
    fetchReceipts().then(() => {
      calculateTotals();
      setRefreshing(false);
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.title}>{storename ? storename : "Loading..."}</Text>

        <Text style={styles.infoText}>Items Sold: {itemsCount}</Text>
        <Text style={styles.infoText}>Total Sales: {storedata?.currencySymbol ? storedata.currencySymbol : "₹"}{totalSales.toFixed(2)}</Text>

        <View style={styles.datePickerContainer}>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => {
              setCurrentPicker("start");
              setDatePickerVisible(true);
            }}
          >
            <Text style={styles.dateButtonText}>
              Start Date: {startDate.toLocaleDateString()}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => {
              setCurrentPicker("end");
              setDatePickerVisible(true);
            }}
          >
            <Text style={styles.dateButtonText}>
              End Date: {endDate.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        </View>

        {datePickerVisible && (
          <DateTimePicker
            value={currentPicker === "start" ? startDate : endDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("Add Items")}
        >
          <Text style={styles.buttonText}>Add Items</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("Create Receipt")}
        >
          <Text style={styles.buttonText}>Create New Receipt</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("Items List")}
        >
          <Text style={styles.buttonText}>Items List</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("All Receipts")}
        >
          <Text style={styles.buttonText}>View All Receipts</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.buttonSecondary}
          onPress={() => navigation.navigate("Store Settings")}
        >
          <Text style={styles.buttonText}>Store Settings</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContainer: { padding: 16 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 24, textAlign: "center" },
  infoText: { fontSize: 18, marginBottom: 8, textAlign: "center" },
  datePickerContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  dateButton: {
    backgroundColor: "#6200ee",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  dateButtonText: { color: "#fff", fontWeight: "bold", textAlign: "center" },
  button: {
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  logoutButton: { marginRight: 10 },
  logoutButtonText: { color: "#007bff", fontSize: 16, fontWeight: "bold" },
  buttonSecondary: {
    backgroundColor: "#3456ff",
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: "center",
  },
});
