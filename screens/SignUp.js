import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, firestore } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { getFirebaseErrorMessage } from "../utils/firebaseErrors";

export default function Signup({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [storename, setStorename] = useState("");
  const [error, setError] = useState("");


  const handleSignup = async () => {
    if (!storename) {
      setError("Store name is required");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      const user = userCredential.user;
      await setDoc(doc(firestore, "users", user.uid), {
        email: user.email,
        storename: storename,
        createdAt: new Date(),
      });

      navigation.navigate("Dashboard");
    } catch (err) {
        setError(getFirebaseErrorMessage(err.code));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Signup</Text>
      <TextInput
        style={styles.input}
        placeholder="Store Name"
        value={storename}
        onChangeText={setStorename}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        secureTextEntry
        onChangeText={setPassword}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={handleSignup}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.link}>Already have an account? Log In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 16 },
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 24 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 12, borderRadius: 8, marginBottom: 16 },
  button: { backgroundColor: "#000", padding: 12, borderRadius: 8, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "bold" },
  link: { textAlign: "center", marginTop: 16, color: "#666" },
  error: { color: "red", textAlign: "center", marginBottom: 16 },
});
