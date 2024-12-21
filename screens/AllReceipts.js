import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { collection, query, where, orderBy, limit, startAfter, getDocs } from "firebase/firestore";
import { firestore } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import { useNavigation } from "@react-navigation/native";

export default function ReceiptViewer() {
  const { user } = useAuth();
  const navigation = useNavigation();

  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (user) {
      fetchReceipts();
    }
  }, [user]);

  const fetchReceipts = async (isLoadMore = false) => {
    if (!user) return;

    try {
      const receiptsQuery = query(
        collection(firestore, "receipts"),
        where("email", "==", user.email),
        orderBy("createdAt", "desc"),
        limit(10),
        ...(isLoadMore && lastVisible ? [startAfter(lastVisible)] : [])
      );

      const querySnapshot = await getDocs(receiptsQuery);
      const fetchedReceipts = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (fetchedReceipts.length < 10) {
        setHasMore(false); // No more receipts to fetch
      }

      if (isLoadMore) {
        setReceipts((prev) => [...prev, ...fetchedReceipts]);
      } else {
        setReceipts(fetchedReceipts);
      }

      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
    } catch (error) {
      console.error("Error fetching receipts:", error);
      Alert.alert("Error", "Failed to fetch receipts.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      setLoadingMore(true);
      fetchReceipts(true);
    }
  };

  const renderReceiptItem = ({ item }) => (
    <TouchableOpacity
      style={styles.receiptContainer}
      onPress={() => navigation.navigate("Receipt Details", { receiptId: item.id })}
    >
      <Text style={styles.receiptTitle}>Receipt #{item.id}</Text>
      <Text style={styles.receiptDate}>
        Date: {new Date(item.createdAt).toLocaleDateString()}
      </Text>
      <Text style={styles.receiptTotal}>Total: ₹{item.total.toFixed(2)}</Text>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return <ActivityIndicator style={{ marginVertical: 16 }} />;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  if (!receipts.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No receipts available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={receipts}
        renderItem={renderReceiptItem}
        keyExtractor={(item) => item.id}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 16, color: "#666" },
  receiptContainer: {
    backgroundColor: "#f9f9f9",
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  receiptTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  receiptDate: { fontSize: 14, color: "#666" },
  receiptTotal: { fontSize: 14, fontWeight: "bold", marginTop: 8 },
});
