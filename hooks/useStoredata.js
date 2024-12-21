import { collection, getDocs, query, where } from "firebase/firestore";
import { firestore } from "../firebase";

export async function getStoreNameByEmail(email) {
    try {
      const q = query(collection(firestore, "users"), where("email", "==", email));
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        return userData.storename;
      } else {
        console.error("No user found with this email.");
        return null;
      }
    } catch (err) {
      console.error("Error fetching store name:", err.message);
      return null;
    }
};

export async function getStoreDataByEmail(email) {
  try {
    const q = query(collection(firestore, "users"), where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userData = querySnapshot.docs[0].data();
      return userData.config;
    } else {
      console.error("No user found with this email.");
      return null;
    }
  } catch (err) {
    console.error("Error fetching store name:", err.message);
    return null;
  }
};