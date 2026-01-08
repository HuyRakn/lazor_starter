import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Copy, LogOut, Info, Link2, AlertCircle, CheckCircle, ArrowRightLeft, Image as ImageIcon, Database } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import {
  useWalletBalance,
  useAirdrop,
  useNetworkStore,
  TOKEN_MINTS,
} from '@lazor-starter/core';
import { useMobileAuth } from '../src/hooks/useMobileAuth';
import { useMobileGaslessTx } from '../src/hooks/useMobileGaslessTx';
import {
  Button,
  Input,
  Card,
  CardContent,
  Text,
  WalletBanner,
  Tabs,
  type TabItem,
} from '@lazor-starter/ui';
import { useState, useMemo, useEffect } from 'react';
import * as Clipboard from 'expo-clipboard';

// Feature Components
import { SwapFeature } from '../src/features/SwapFeature';
import { NftMintFeature } from '../src/features/NftMintFeature';

import { CNftMintFeature } from '../src/features/CNftMintFeature';
import { CodeExample } from '../src/components/CodeExample';
import { codeExamples } from '../src/data/codeExamples';

type DashboardView = 'home' | 'swap' | 'nft' | 'cnft';

/**
 * Dashboard screen component for mobile app
 *
 * Displays wallet information, transfer, and airdrop functionality.
 * Uses tabs for Transfer and Airdrop sections.
 * Refactored to include sub-features (Swap, NFT, cNFT) within the same view.
 *
 * @returns Dashboard screen component
 */
export default function DashboardScreen() {
  const router = useRouter();
  const { pubkey, logout, isInitialized, isLoggedIn } = useMobileAuth();
  const { transferSOL, transferSPLToken } = useMobileGaslessTx();
  const { requestSOLAirdrop, requestUSDCAirdrop, loading: airdropLoading } = useAirdrop();
  const { network, setNetwork } = useNetworkStore();

  // Navigation State
  const [activeView, setActiveView] = useState<DashboardView>('home');

  // Select correct USDC mint by network
  const usdcMintAddress = useMemo(
    () => (network === 'devnet' ? TOKEN_MINTS.USDC_DEVNET : TOKEN_MINTS.USDC_MAINNET),
    [network]
  );
  const defaultMint = usdcMintAddress;

  // Fetch balances onchain (SOL + network-specific USDC)
  const { solBalance, usdcBalance, solBalanceText, usdcBalanceText } = useWalletBalance(
    pubkey,
    usdcMintAddress
  );
  const solAmountValue = solBalance ?? 0;
  const usdcAmountValue = usdcBalance ?? 0;

  // Unified Transfer State
  const [transferRecipient, setTransferRecipient] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferToken, setTransferToken] = useState<'SOL' | 'USDC'>('SOL');
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);
  const [transferSignature, setTransferSignature] = useState<string | null>(null);

  // Airdrop State
  const [airdropAmount, setAirdropAmount] = useState<string>('1');
  const [airdropToken, setAirdropToken] = useState<'SOL' | 'USDC'>('SOL');
  const [airdropError, setAirdropError] = useState<string | null>(null);
  const [airdropSuccess, setAirdropSuccess] = useState<string | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<string>('transfer');

  // Redirect to home if not logged in
  useEffect(() => {
    if (isInitialized && (!isLoggedIn || !pubkey)) {
      router.replace('/');
    }
  }, [isInitialized, isLoggedIn, pubkey, router]);

  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!isLoggedIn || !pubkey) {
    return null;
  }

  /**
   * Formats error messages to be more user-friendly
   *
   * @param error - The error object or string to format
   * @returns Formatted error message string
   */
  const formatErrorMessage = (error: any): string => {
    if (!error) return 'An unknown error occurred';

    const errorMessage = error?.message || error?.toString() || 'An unknown error occurred';

    try {
      const jsonMatch = errorMessage.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed?.error?.message) {
          return parsed.error.message;
        }
      }

      if (errorMessage.toLowerCase().includes('rate limit')) {
        return 'Rate limit exceeded. The devnet faucet has a limit of 1 SOL per project per day. Please try again later.';
      }

      if (errorMessage.includes('403')) {
        return 'Request denied. You may have exceeded the rate limit. Please try again later.';
      }

      if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
        return 'Request timed out. Please check your connection and try again.';
      }

      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        return 'Network error. Please check your internet connection and try again.';
      }
    } catch {
      // If parsing fails, return the original message
    }

    return errorMessage;
  };

  /**
   * Handles unified transfer (SOL / USDC)
   *
   * @throws Error if recipient or amount is invalid
   */
  const handleTransfer = async () => {
    if (!transferRecipient || !transferAmount) {
      setTransferError('Please enter recipient and amount');
      return;
    }

    setTransferLoading(true);
    setTransferError(null);
    setTransferSuccess(null);
    setTransferSignature(null);

    try {
      const amountNumber = parseFloat(transferAmount);
      if (isNaN(amountNumber) || amountNumber <= 0) {
        throw new Error('Invalid amount');
      }

      let signature: string;
      if (transferToken === 'SOL') {
        signature = await transferSOL(transferRecipient, amountNumber);
      } else {
        signature = await transferSPLToken(transferRecipient, amountNumber, defaultMint, 6);
      }
      setTransferSuccess(`Transaction sent! Signature: ${signature.slice(0, 16)}...`);
      setTransferSignature(signature);
      setTransferRecipient('');
      setTransferAmount('');
    } catch (error: any) {
      setTransferError(error?.message || 'Transfer failed');
    } finally {
      setTransferLoading(false);
    }
  };

  /**
   * Resets transfer form state to initial values
   */
  const handleResetTransfer = () => {
    setTransferRecipient('');
    setTransferAmount('');
    setTransferError(null);
    setTransferSuccess(null);
    setTransferSignature(null);
  };

  /**
   * Handles airdrop request for SOL or USDC
   *
   * @returns Promise that resolves when airdrop is requested
   */
  const handleAirdrop = async () => {
    if (!pubkey) {
      setAirdropError('Wallet not connected');
      return;
    }

    if (airdropToken === 'SOL') {
      const amount = parseFloat(airdropAmount);
      if (isNaN(amount) || amount <= 0) {
        setAirdropError('Please enter a valid amount');
        return;
      }
    }

    setAirdropError(null);
    setAirdropSuccess(null);

    try {
      if (airdropToken === 'SOL') {
        const amount = parseFloat(airdropAmount);
        await requestSOLAirdrop(pubkey, amount);
        setAirdropSuccess(`SOL airdrop requested! ${amount} SOL will arrive shortly.`);
      } else {
        await requestUSDCAirdrop(pubkey, 1);
        setAirdropSuccess(
          `Circle Faucet opened. Please complete the USDC request there. Rate limit: 1 USDC every 2 hours per address.`
        );
      }
    } catch (error: any) {
      setAirdropError(formatErrorMessage(error));
    }
  };

  /**
   * Handles logout action
   */
  const handleLogout = () => {
    logout();
    setAirdropError(null);
    setAirdropSuccess(null);
    setTransferError(null);
    setTransferSuccess(null);
    setNetwork('mainnet');
    router.replace('/');
  };

  /**
   * Handles clipboard paste for recipient address
   */
  const handlePasteAddress = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      setTransferRecipient(text);
      setTransferError(null);
    } catch {
      setTransferError('Clipboard unavailable');
    }
  };

  const tabItems: TabItem[] = [
    {
      value: 'transfer',
      label: 'Transfer',
      content: (
        <View style={styles.tabContent}>
          <Card style={styles.formCard}>
            <CardContent style={styles.cardContent}>
              <View style={styles.formSection}>
                {/* Token Selector */}
                <View style={styles.tokenSelectorRow}>
                  {[
                    { value: 'SOL' as const, label: 'SOL', balance: solBalanceText },
                    { value: 'USDC' as const, label: 'USDC', balance: usdcBalanceText || 'Balance —' },
                  ].map((item) => {
                    const active = transferToken === item.value;
                    return (
                      <TouchableOpacity
                        key={item.value}
                        onPress={() => {
                          setTransferToken(item.value);
                          setTransferAmount('');
                          setTransferRecipient('');
                          setTransferError(null);
                          setTransferSuccess(null);
                          setTransferSignature(null);
                        }}
                        style={[
                          styles.tokenButton,
                          active ? styles.tokenButtonActive : styles.tokenButtonInactive,
                        ]}
                      >
                        <View>
                          <Text style={styles.tokenLabel}>{item.label}</Text>
                          <Text style={styles.tokenBalance}>{item.balance}</Text>
                        </View>
                        <View style={styles.radioOuter}>
                          {active && <View style={styles.radioInner} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Recipient Address */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Recipient Address</Text>
                  <View style={styles.inputWithButton}>
                    <Input
                      value={transferRecipient}
                      onChangeText={setTransferRecipient}
                      placeholder="Enter recipient address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      style={styles.inputField}
                      {...({} as any)}
                    />
                    <TouchableOpacity onPress={handlePasteAddress} style={styles.pasteButton}>
                      <Copy size={16} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Amount */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Amount ({transferToken})</Text>
                  <Input
                    value={transferAmount}
                    onChangeText={setTransferAmount}
                    placeholder="Enter Amount"
                    keyboardType="decimal-pad"
                    style={styles.amountInput}
                    {...({} as any)}
                  />
                  <View style={styles.quickAmountRow}>
                    <TouchableOpacity
                      onPress={() => {
                        const balance = transferToken === 'SOL' ? solAmountValue : usdcAmountValue;
                        setTransferAmount((balance / 2).toString());
                      }}
                      style={styles.quickAmountButton}
                    >
                      <Text style={styles.quickAmountText}>Half</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() =>
                        setTransferAmount(
                          transferToken === 'SOL' ? solAmountValue.toString() : usdcAmountValue.toString()
                        )
                      }
                      style={styles.quickAmountButton}
                    >
                      <Text style={styles.quickAmountText}>Max</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.actionRow}>
                <TouchableOpacity onPress={handleResetTransfer} style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleTransfer}
                  disabled={transferLoading || !transferRecipient || !transferAmount}
                  style={[
                    styles.nextButton,
                    (transferLoading || !transferRecipient || !transferAmount) && styles.buttonDisabled,
                  ]}
                >
                  <Text style={styles.nextButtonText}>{transferLoading ? 'Sending...' : 'Next →'}</Text>
                </TouchableOpacity>
              </View>

              {/* Error */}
              {transferError && (
                <View style={styles.errorAlert}>
                  <View style={styles.errorRow}>
                    <AlertCircle size={16} color="#FCA5A5" />
                    <Text style={styles.errorAlertText}>{formatErrorMessage(transferError)}</Text>
                  </View>
                </View>
              )}

              {/* Success */}
              {transferSuccess && (
                <View style={styles.successAlert}>
                  <View style={styles.successRow}>
                    <CheckCircle size={16} color="#86EFAC" />
                    <Text style={styles.successAlertText}>{transferSuccess}</Text>
                  </View>
                  {transferSignature && (
                    <TouchableOpacity
                      onPress={() => {
                        const cluster = network === 'devnet' ? '?cluster=devnet' : '';
                        Linking.openURL(`https://solscan.io/tx/${transferSignature}${cluster}`);
                      }}
                      style={{ marginTop: 8, marginLeft: 24 }}
                    >
                      <Text style={styles.linkText}>View on Solscan →</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Info */}
              <View style={styles.infoBox}>
                <View style={styles.infoRow}>
                  <Info size={16} color="#9CA3AF" />
                  <Text style={styles.infoText}>
                    Gasless transaction! You saved on gas fees thanks to Lazorkit!
                  </Text>
                </View>
              </View>
            </CardContent>
          </Card>

        </View>
      ),
    },
    {
      value: 'airdrop',
      label: 'Airdrop',
      disabled: network !== 'devnet',
      content: (
        <View style={styles.tabContent}>
          <Card style={styles.formCard}>
            <CardContent style={styles.cardContent}>
              <View style={styles.airdropHeader}>
                <Text style={styles.airdropTitle}>Devnet Airdrop</Text>
                <Text style={styles.airdropSubtitle}>Request SOL or USDC from devnet faucet</Text>
              </View>

              <View style={styles.formSection}>
                {/* Token Selector */}
                <View style={styles.tokenSelectorRow}>
                  {[
                    { value: 'SOL' as const, label: 'SOL', balance: solBalanceText },
                    { value: 'USDC' as const, label: 'USDC', balance: usdcBalanceText || 'Balance —' },
                  ].map((item) => {
                    const active = airdropToken === item.value;
                    return (
                      <TouchableOpacity
                        key={item.value}
                        onPress={() => {
                          setAirdropToken(item.value);
                          setAirdropAmount('1');
                          setAirdropError(null);
                          setAirdropSuccess(null);
                        }}
                        style={[
                          styles.tokenButton,
                          active ? styles.tokenButtonActive : styles.tokenButtonInactive,
                        ]}
                      >
                        <View>
                          <Text style={styles.tokenLabel}>{item.label}</Text>
                          <Text style={styles.tokenBalance}>{item.balance}</Text>
                        </View>
                        <View style={styles.radioOuter}>
                          {active && <View style={styles.radioInner} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* SOL Amount Input */}
                {airdropToken === 'SOL' && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Amount (SOL)</Text>
                    <Input
                      value={airdropAmount}
                      onChangeText={setAirdropAmount}
                      placeholder="Enter SOL amount"
                      keyboardType="decimal-pad"
                      style={styles.amountInput}
                      {...({} as any)}
                    />
                    <Text style={styles.recommendedText}>Recommended: 1-2 SOL</Text>
                    <View style={styles.quickAmountRow}>
                      <TouchableOpacity onPress={() => setAirdropAmount('1')} style={styles.quickAmountButton}>
                        <Text style={styles.quickAmountText}>1 SOL</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setAirdropAmount('2')} style={styles.quickAmountButton}>
                        <Text style={styles.quickAmountText}>2 SOL</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Request Button */}
                <TouchableOpacity
                  onPress={handleAirdrop}
                  disabled={
                    network !== 'devnet' ||
                    airdropLoading ||
                    (airdropToken === 'SOL' && !airdropAmount) ||
                    !pubkey
                  }
                  style={[
                    styles.nextButton,
                    styles.fullWidthButton,
                    (network !== 'devnet' ||
                      airdropLoading ||
                      (airdropToken === 'SOL' && !airdropAmount) ||
                      !pubkey) &&
                    styles.buttonDisabled,
                  ]}
                >
                  <Text style={styles.nextButtonText}>
                    {airdropLoading
                      ? 'Requesting...'
                      : airdropToken === 'SOL'
                        ? 'Request Airdrop'
                        : 'Open Circle Faucet'}
                  </Text>
                </TouchableOpacity>

                {/* Error */}
                {airdropError && (
                  <View style={styles.errorAlert}>
                    <View style={styles.errorRow}>
                      <AlertCircle size={16} color="#FCA5A5" />
                      <Text style={styles.errorAlertText}>{formatErrorMessage(airdropError)}</Text>
                    </View>
                    {airdropToken === 'SOL' && (
                      <TouchableOpacity
                        onPress={() => Linking.openURL('https://faucet.solana.com')}
                        style={styles.exploreLinkRow}
                      >
                        <Link2 size={16} color="#9CA3AF" />
                        <Text style={styles.linkText}>Explore Solana Faucet</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Success */}
                {airdropSuccess && (
                  <View style={styles.successAlert}>
                    <View style={styles.successRow}>
                      <CheckCircle size={16} color="#86EFAC" />
                      <Text style={styles.successAlertText}>{airdropSuccess}</Text>
                    </View>
                  </View>
                )}

                {/* Info */}
                <View style={styles.infoBox}>
                  <View style={styles.infoRow}>
                    <Info size={16} color="#9CA3AF" />
                    <Text style={styles.infoText}>
                      {airdropToken === 'SOL'
                        ? 'SOL airdrop requests tokens directly from Solana devnet faucet. Tokens will arrive in a few seconds.'
                        : 'USDC airdrop opens Circle Faucet website. You can request 1 USDC every 2 hours per address.'}
                    </Text>
                  </View>
                  {airdropToken === 'SOL' && (
                    <TouchableOpacity
                      onPress={() => Linking.openURL('https://faucet.solana.com')}
                      style={styles.exploreLinkRow}
                    >
                      <Link2 size={16} color="#9CA3AF" />
                      <Text style={styles.linkText}>Explore Solana Faucet</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </CardContent>
          </Card>

        </View>
      ),
    },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header} />

        {/* Wallet Banner - Always visible */}
        <View style={styles.bannerContainer}>
          <WalletBanner
            walletAddress={pubkey}
            solBalance={solBalance}
            usdcBalance={usdcBalance}
            solBalanceText={solBalanceText}
            usdcBalanceText={usdcBalanceText}
            network={network}
            onExploreClick={() => {
              const cluster = network === 'devnet' ? '?cluster=devnet' : '';
              Linking.openURL(`https://explorer.solana.com/address/${pubkey}${cluster}`);
            }}
          />
        </View>

        {activeView === 'home' ? (
          <>
            {/* Quick Actions */}
            <View style={styles.quickActionsContainer}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionsRow}>
                <TouchableOpacity onPress={() => setActiveView('swap')} style={styles.actionCard}>
                  <View style={[styles.actionIcon, { backgroundColor: 'rgba(120, 87, 255, 0.2)' }]}>
                    <ArrowRightLeft size={24} color="#7857ff" />
                  </View>
                  <Text style={styles.actionLabel}>Swap</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setActiveView('nft')} style={styles.actionCard}>
                  <View style={[styles.actionIcon, { backgroundColor: 'rgba(236, 72, 153, 0.2)' }]}>
                    <ImageIcon size={24} color="#EC4899" />
                  </View>
                  <Text style={styles.actionLabel}>Mint NFT</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setActiveView('cnft')} style={styles.actionCard}>
                  <View style={[styles.actionIcon, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                    <Database size={24} color="#10B981" />
                  </View>
                  <Text style={styles.actionLabel}>Mint cNFT</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
              <Tabs items={tabItems} value={activeTab} onValueChange={setActiveTab} />
            </View>

            {/* Logout button */}
            <View style={styles.logoutContainer}>
              <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                <LogOut size={18} color="#FFFFFF" />
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>

            {/* Code Example Area */}
            {activeTab && (activeTab === 'transfer' || activeTab === 'airdrop') && (
              <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
                <CodeExample
                  title={activeTab === 'transfer' ? codeExamples.transfer.title : codeExamples.airdrop.title}
                  description={activeTab === 'transfer' ? codeExamples.transfer.description : codeExamples.airdrop.description}
                  code={activeTab === 'transfer' ? codeExamples.transfer.code : codeExamples.airdrop.code}
                />
              </View>
            )}
          </>
        ) : (
          <View style={styles.featureContainer}>
            {activeView === 'swap' && <SwapFeature onBack={() => setActiveView('home')} />}
            {activeView === 'nft' && <NftMintFeature onBack={() => setActiveView('home')} />}
            {activeView === 'cnft' && <CNftMintFeature onBack={() => setActiveView('home')} />}
          </View>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  scrollContent: {
    paddingBottom: 20,
    flexGrow: 1,
  },
  header: {
    height: 60,
  },
  bannerContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionCard: {
    flex: 1, // Ensure equal width
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    color: '#D1D5DB',
    fontSize: 12, // Reduced font slightly to fit
    fontWeight: '500',
    textAlign: 'center',
  },
  tabsContainer: {
    paddingHorizontal: 20,
  },
  featureContainer: {
    paddingHorizontal: 20,
  },
  tabContent: {
    gap: 24,
  },
  formCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  cardContent: {
    padding: 20,
    gap: 20,
  },
  formSection: {
    gap: 16,
  },
  tokenSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tokenButton: {
    flex: 1,
    minWidth: 140,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tokenButtonActive: {
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  tokenButtonInactive: {
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  tokenLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tokenBalance: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#E5E7EB',
  },
  inputWithButton: {
    position: 'relative',
  },
  inputField: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingRight: 48,
    fontSize: 16,
    color: '#FFFFFF',
  },
  pasteButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -8, // Half of icon size
  },
  amountInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
  },
  quickAmountRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  quickAmountButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  quickAmountText: {
    color: '#D1D5DB',
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 2,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#7857ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidthButton: {
    flex: 1,
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  errorAlert: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 12,
    padding: 12,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorAlertText: {
    color: '#FCA5A5',
    fontSize: 13,
    flex: 1,
  },
  successAlert: {
    backgroundColor: 'rgba(134,239,172,0.1)',
    borderRadius: 12,
    padding: 12,
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  successAlertText: {
    color: '#86EFAC',
    fontSize: 13,
    flex: 1,
  },
  infoBox: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 12,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  infoText: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  exploreLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    marginLeft: 24,
  },
  linkText: {
    color: '#60A5FA',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  airdropHeader: {
    marginBottom: 4,
  },
  airdropTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  airdropSubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  recommendedText: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 4,
    marginLeft: 4,
  },
  logoutContainer: {
    padding: 20,
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#DC2626',
    width: '100%',
    justifyContent: 'center',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
