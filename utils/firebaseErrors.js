const firebaseErrorMessages = {
  "auth/invalid-email": "The email address is not valid. Please enter a valid email.",
  "auth/user-disabled": "This account has been disabled. Contact support for assistance.",
  "auth/user-not-found": "No account found with this email. Please sign up or check your email.",
  "auth/wrong-password": "Incorrect password. Please try again.",
  "auth/email-already-in-use": "This email is already registered. Please log in or use a different email.",
  "auth/weak-password": "Password is too weak. Please use at least 6 characters.",
  "auth/too-many-requests": "Too many attempts. Please try again later.",
  "auth/network-request-failed": "Network error. Please check your internet connection.",
  "auth/internal-error": "An unexpected error occurred. Please try again.",
  "auth/invalid-credential": "Incorrect email or password. Please try again.",
  "auth/invalid-login-credentials": "Incorrect email or password. Please try again."
};

export function getFirebaseErrorMessage(code) {
  console.log(code)
  return firebaseErrorMessages[code] || "An unknown error occurred. Please try again.";
}