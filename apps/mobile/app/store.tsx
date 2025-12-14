import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useLazorAuth } from '@lazor-starter/core';
import { Card, CardContent, CardHeader, CardTitle, Alert, AlertDescription, LazorPayButton, Text } from '@lazor-starter/ui';
import { CheckCircle2, AlertCircle } from 'lucide-react-native';
import { useState } from 'react';

const STORE_WALLET_ADDRESS = '11111111111111111111111111111111';

export default function StoreScreen() {
  const router = useRouter();
  const { isLoggedIn, isInitialized } = useLazorAuth();
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <Text className="text-gray-400">Loading...</Text>
      </View>
    );
  }

  if (!isLoggedIn) {
    router.replace('/');
    return null;
  }

  /**
   * Handles successful payment
   */
  const handlePaymentSuccess = (signature: string) => {
    setPaymentSuccess(`Payment successful! Transaction: ${signature.slice(0, 16)}...`);
    setPaymentError(null);
  };

  /**
   * Handles payment error
   */
  const handlePaymentError = (error: Error) => {
    setPaymentError(error.message);
    setPaymentSuccess(null);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="h1" className="text-4xl font-bold text-white text-center mb-2">
          Lazor Merch Store
        </Text>
        <Text className="text-gray-400 text-center">Pay with Solana - Gasless Transactions</Text>
      </View>

      <View style={styles.products}>
        <Card className="bg-gray-900 border-gray-800 mx-5 mb-5">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-white">☕ Coffee</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <View className="space-y-2">
              <Text className="text-gray-400 text-sm">Premium Coffee</Text>
              <Text className="text-2xl font-bold text-green-500">1 USDC</Text>
            </View>
            <LazorPayButton
              to={STORE_WALLET_ADDRESS}
              amount={1}
              productName="Coffee"
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              className="w-full bg-green-600"
            />
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800 mx-5 mb-5">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-white">🎨 T-Shirt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <View className="space-y-2">
              <Text className="text-gray-400 text-sm">Lazor Starter T-Shirt</Text>
              <Text className="text-2xl font-bold text-green-500">10 USDC</Text>
            </View>
            <LazorPayButton
              to={STORE_WALLET_ADDRESS}
              amount={10}
              productName="T-Shirt"
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              className="w-full bg-green-600"
            />
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800 mx-5 mb-5">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-white">🚀 Premium Package</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <View className="space-y-2">
              <Text className="text-gray-400 text-sm">Complete Starter Kit</Text>
              <Text className="text-2xl font-bold text-green-500">50 USDC</Text>
            </View>
            <LazorPayButton
              to={STORE_WALLET_ADDRESS}
              amount={50}
              productName="Premium Package"
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              className="w-full bg-green-600"
            />
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800 mx-5 mb-5">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-white">💎 VIP Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <View className="space-y-2">
              <Text className="text-gray-400 text-sm">Lifetime VIP Membership</Text>
              <Text className="text-2xl font-bold text-green-500">100 USDC</Text>
            </View>
            <LazorPayButton
              to={STORE_WALLET_ADDRESS}
              amount={100}
              productName="VIP Access"
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              className="w-full bg-green-600"
            />
          </CardContent>
        </Card>
      </View>

      {paymentSuccess && (
        <Alert icon={CheckCircle2} className="bg-green-900/50 border-green-500 mx-5 mb-5">
          <AlertDescription className="text-green-200 text-sm">
            {paymentSuccess}
          </AlertDescription>
        </Alert>
      )}

      {paymentError && (
        <Alert variant="destructive" icon={AlertCircle} className="bg-red-900/50 border-red-500 mx-5 mb-5">
          <AlertDescription className="text-red-200 text-sm">
            {paymentError}
          </AlertDescription>
        </Alert>
      )}

      <Card className="bg-blue-900/30 border-blue-500/50 mx-5 mb-5">
        <CardContent className="pt-6">
          <Text className="text-blue-200 text-sm text-center">
            💡 All payments are processed gasless via Lazorkit Paymaster. No SOL required!
          </Text>
        </CardContent>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  products: {
    paddingBottom: 20,
  },
});


