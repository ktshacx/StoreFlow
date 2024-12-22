import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAwOGVTO3qqYYxXznj0EfBEIug37CQxtNc",
    authDomain: "storeflow-native.firebaseapp.com",
    projectId: "storeflow-native",
    storageBucket: "storeflow-native.firebasestorage.app",
    messagingSenderId: "330176619400",
    appId: "1:330176619400:web:f907439e1036700c10903d"
};

const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});
export const firestore = getFirestore(app);