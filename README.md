# StoreFlow

**Easy to use store management and receipt generator app.**

A store management app designed for small businesses, allowing users to manage items, create and view receipts, and track sales. The app includes features like barcode scanning and customizable settings such as currency symbols and receipt notes.

---

## Features

1. **Multi-Device, Cloud Synced:**
   - Access and manage your store data seamlessly across multiple devices with real-time cloud syncing.

2. **Barcode Scanner:**
   - Effortlessly add and scan products using an integrated barcode scanner for faster checkout and inventory management.

3. **Send Receipts Instantly:**
   - Share receipts with customers directly via WhatsApp or text message.

4. **Customizable Settings:**
   - Personalize your store configuration, including:
     - Currency symbols.
     - Mobile number prefix.
     - Custom receipt notes.

5. **Sales Tracking:**
   - Track items sold and total sales within a customizable date range to analyze business performance.

6. **Secure Account Management:**
   - Secure login and account management features, including account deletion.

7. **Item Management:**
   - Add, edit, and delete items with an intuitive interface.

8. **Receipt Management:**
   - View all past receipts with endless scrolling and detailed information.

---

## Installation

Follow these steps to install and run the app on your local machine:

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/ktshacx/storeflow.git
   cd storeflow
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Firebase:**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/).
   - Enable Firestore and Email Authentication.
   - Replace the `firebaseConfig` in the `firebase.js` file with your Firebase credentials.

4. **Run the App:**
   ```bash
   npm start
   ```

---

## Roadmap

- **Upcoming Features:**
  1. Advanced analytics and reporting.
  2. Enhanced customer handling
  3. Integration with payment gateways.
