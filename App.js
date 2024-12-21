import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import Home from './screens/Dashboard';
import Login from './screens/Login';
import Signup from './screens/SignUp';
import AddItems from './screens/Additems';
import CreateReceipt from './screens/CreateReceipt';
import ReceiptView from './screens/ReceiptView';
import ItemsList from './screens/ItemsList';
import StoreSettings from './screens/StoreSettings';
import ReceiptViewer from './screens/AllReceipts';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name='Dashboard' component={Home} options={{headerShown: true}}/>
        <Stack.Screen name='Login' component={Login} options={{headerShown: false}}/>
        <Stack.Screen name='SignUp' component={Signup} options={{headerShown: false}}/>
        <Stack.Screen name='Add Items' component={AddItems} options={{headerShown: true}}/>
        <Stack.Screen name='Create Receipt' component={CreateReceipt} options={{headerShown: true}}/>
        <Stack.Screen name='Receipt Details' component={ReceiptView} options={{headerShown: true}}/>
        <Stack.Screen name='Items List' component={ItemsList} options={{headerShown: true}}/>
        <Stack.Screen name='Store Settings' component={StoreSettings} options={{headerShown: true}}/>
        <Stack.Screen name='All Receipts' component={ReceiptViewer} options={{headerShown: true}}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
