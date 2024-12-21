import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
  SafeAreaView,
} from "react-native";
import { collection, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { firestore } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import { getStoreDataByEmail } from "../hooks/useStoredata";

export default function ItemsList() {
  const { user, loading: userLoading  } = useAuth();
  const [items, setItems] = useState([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [storedata, setStoredata] = useState();

  useEffect(() => {
    if(user) {
        getStoreDataByEmail(user.email)
        .then(data => {
            setStoredata(data);
        })
        fetchItems();
    }
  }, [user, userLoading]);

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
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await deleteDoc(doc(firestore, "items", itemId));
      setItems((prev) => prev.filter((item) => item.id !== itemId));
      Alert.alert("Success", "Item deleted successfully!");
    } catch (error) {
      console.error("Error deleting item:", error);
      Alert.alert("Error", "Failed to delete item.");
    }
  };

  const handleEditItem = async () => {
    if (!selectedItem.itemName || !selectedItem.itemPrice) {
      Alert.alert("Error", "Please provide valid item details.");
      return;
    }

    try {
      const itemRef = doc(firestore, "items", selectedItem.id);
      await updateDoc(itemRef, {
        itemName: selectedItem.itemName,
        itemPrice: parseFloat(selectedItem.itemPrice),
        barcode: selectedItem.barcode,
      });

      setItems((prev) =>
        prev.map((item) =>
          item.id === selectedItem.id ? { ...item, ...selectedItem } : item
        )
      );

      setEditModalVisible(false);
      Alert.alert("Success", "Item updated successfully!");
    } catch (error) {
      console.error("Error updating item:", error);
      Alert.alert("Error", "Failed to update item.");
    }
  };

  const openEditModal = (item) => {
    setSelectedItem(item);
    setEditModalVisible(true);
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemName}>{item.itemName}</Text>
      <Text style={styles.itemPrice}>{storedata ? storedata.currencySymbol : '₹'}{Number(item.itemPrice).toFixed(2)}</Text>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => openEditModal(item)}
        >
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteItem(item.id)}
        >
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading items...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>No items found.</Text>}
      />

      {/* Edit Modal */}
      {editModalVisible && selectedItem && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={editModalVisible}
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Edit Item</Text>
            <TextInput
              style={styles.input}
              placeholder="Item Name"
              value={selectedItem.itemName}
              onChangeText={(text) =>
                setSelectedItem((prev) => ({ ...prev, itemName: text }))
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Item Price"
              value={selectedItem.itemPrice.toString()}
              onChangeText={(text) =>
                setSelectedItem((prev) => ({ ...prev, itemPrice: text }))
              }
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Barcode"
              value={selectedItem.barcode || ""}
              onChangeText={(text) =>
                setSelectedItem((prev) => ({ ...prev, barcode: text }))
              }
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleEditItem}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 16, textAlign: "center" },
  itemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
  },
  itemName: { fontSize: 16, flex: 1 },
  itemPrice: { fontSize: 16, fontWeight: "bold", textAlign: "right", flex: 1 },
  actions: { flexDirection: "row", flex: 1, justifyContent: "space-evenly" },
  editButton: { backgroundColor: "#6200ee", padding: 8, borderRadius: 4 },
  deleteButton: { backgroundColor: "#ff1744", padding: 8, borderRadius: 4 },
  actionText: { color: "#fff", fontWeight: "bold" },
  loadingText: { textAlign: "center", fontSize: 16, marginTop: 20 },
  emptyText: { textAlign: "center", fontSize: 16, marginTop: 20 },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 16, color: "#fff" },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    width: "80%",
  },
  modalActions: { flexDirection: "row", justifyContent: "space-between", width: "80%" },
  saveButton: { backgroundColor: "#6200ee", padding: 12, borderRadius: 8, flex: 1, marginRight: 8 },
  saveButtonText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
  cancelButton: { backgroundColor: "#ff1744", padding: 12, borderRadius: 8, flex: 1, marginLeft: 8 },
  cancelButtonText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
});
