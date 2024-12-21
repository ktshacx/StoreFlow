import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        currentUser
          .getIdTokenResult(true)
          .then(() => {
            setUser(currentUser);
            setLoading(false);
          })
          .catch((error) => {
            console.error("Error refreshing user token:", error);
            setUser(null);
            setLoading(false);
          });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  return { user, loading };
}
