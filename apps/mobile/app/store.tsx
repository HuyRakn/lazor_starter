import { View, StyleSheet, ScrollView } from 'react-native';
import { AlertCircle, CheckCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useMobileAuth } from '../src/hooks/useMobileAuth';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LazorPayButton,
  Text,
} from '@lazor-starter/ui';
import { useState, useEffect } from 'react';

const STORE_WALLET_ADDRESS = '11111111111111111111111111111111';

export default function StoreScreen() {
  const router = useRouter();
  const { isLoggedIn, isInitialized } = useMobileAuth();
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Redirect to home if not logged in
  useEffect(() => {
    if (isInitialized && !isLoggedIn) {
      router.replace('/');
    }
  }, [isInitialized, isLoggedIn, router]);

  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  /**
   * Handles successful payment
   * @param signature - Transaction signature from blockchain
   */
  const handlePaymentSuccess = (signature: string) => {
    setPaymentSuccess(`Payment successful! Transaction: ${signature.slice(0, 16)}...`);
    setPaymentError(null);
  };

  /**
   * Handles payment error
   * @param error - Error object from payment attempt
   */
  const handlePaymentError = (error: Error) => {
    setPaymentError(error.message);
    setPaymentSuccess(null);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lazor Merch Store</Text>
        <Text style={styles.headerSubtitle}>Pay with Solana - Gasless Transactions</Text>
      </View>

      <View style={styles.products}>
        {/* Coffee Card */}
        <Card style={styles.productCard}>
          <CardHeader>
            <CardTitle style={styles.cardTitle}>Coffee</CardTitle>
          </CardHeader>
          <CardContent style={styles.cardContent}>
            <View style={styles.productInfo}>
              <Text style={styles.productDescription}>Premium Coffee</Text>
              <Text style={styles.productPrice}>1 USDC</Text>
            </View>
            <LazorPayButton
              to={STORE_WALLET_ADDRESS}
              amount={1}
              productName="Coffee"
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              style={styles.payButton}
              {...({} as any)}
            />
          </CardContent>
        </Card>

        {/* T-Shirt Card */}
        <Card style={styles.productCard}>
          <CardHeader>
            <CardTitle style={styles.cardTitle}>T-Shirt</CardTitle>
          </CardHeader>
          <CardContent style={styles.cardContent}>
            <View style={styles.productInfo}>
              <Text style={styles.productDescription}>Lazor Starter T-Shirt</Text>
              <Text style={styles.productPrice}>10 USDC</Text>
            </View>
            <LazorPayButton
              to={STORE_WALLET_ADDRESS}
              amount={10}
              productName="T-Shirt"
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              style={styles.payButton}
              {...({} as any)}
            />
          </CardContent>
        </Card>

        {/* Premium Package Card */}
        <Card style={styles.productCard}>
          <CardHeader>
            <CardTitle style={styles.cardTitle}>Premium Package</CardTitle>
          </CardHeader>
          <CardContent style={styles.cardContent}>
            <View style={styles.productInfo}>
              <Text style={styles.productDescription}>Complete Starter Kit</Text>
              <Text style={styles.productPrice}>50 USDC</Text>
            </View>
            <LazorPayButton
              to={STORE_WALLET_ADDRESS}
              amount={50}
              productName="Premium Package"
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              style={styles.payButton}
              {...({} as any)}
            />
          </CardContent>
        </Card>

        {/* VIP Access Card */}
        <Card style={styles.productCard}>
          <CardHeader>
            <CardTitle style={styles.cardTitle}>VIP Access</CardTitle>
          </CardHeader>
          <CardContent style={styles.cardContent}>
            <View style={styles.productInfo}>
              <Text style={styles.productDescription}>Lifetime VIP Membership</Text>
              <Text style={styles.productPrice}>100 USDC</Text>
            </View>
            <LazorPayButton
              to={STORE_WALLET_ADDRESS}
              amount={100}
              productName="VIP Access"
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              style={styles.payButton}
              {...({} as any)}
            />
          </CardContent>
        </Card>
      </View>

      {/* Success Alert */}
      {paymentSuccess && (
        <View style={styles.successAlert}>
          <View style={styles.successRow}>
            <CheckCircle size={16} color="#86EFAC" />
            <Text style={styles.successText}>{paymentSuccess}</Text>
          </View>
        </View>
      )}

      {/* Error Alert */}
      {paymentError && (
        <View style={styles.errorAlert}>
          <View style={styles.errorRow}>
            <AlertCircle size={16} color="#FCA5A5" />
            <Text style={styles.errorText}>{paymentError}</Text>
          </View>
        </View>
      )}

      {/* Info Card */}
      <Card style={styles.infoCard}>
        <CardContent style={styles.infoContent}>
          <Text style={styles.infoText}>
            All payments are processed gasless via Lazorkit Paymaster. No SOL required!
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
  loadingText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    color: '#9CA3AF',
    textAlign: 'center',
    fontSize: 14,
  },
  products: {
    paddingBottom: 20,
  },
  productCard: {
    backgroundColor: '#111827',
    borderColor: '#1F2937',
    borderWidth: 1,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardContent: {
    gap: 16,
  },
  productInfo: {
    gap: 8,
  },
  productDescription: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  productPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#22C55E',
  },
  payButton: {
    backgroundColor: '#16A34A',
    borderRadius: 8,
    paddingVertical: 12,
  },
  successAlert: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: '#22C55E',
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 12,
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  successText: {
    color: '#86EFAC',
    fontSize: 14,
    flex: 1,
  },
  errorAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 12,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 14,
    flex: 1,
  },
  infoCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
    borderWidth: 1,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  infoContent: {
    paddingTop: 16,
  },
  infoText: {
    color: '#93C5FD',
    fontSize: 14,
    textAlign: 'center',
  },
});
