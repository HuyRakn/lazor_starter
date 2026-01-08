import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Linking, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowDownUp, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react-native';
import { useAuth, useJupiterSwap, TOKEN_MINTS, useNetworkStore, useWalletBalance } from '@lazor-starter/core';
import { Input, Card, CardContent } from '@lazor-starter/ui';
import { useState, useEffect } from 'react';

export default function SwapScreen() {
    const router = useRouter();
    const { pubkey } = useAuth();
    const { network } = useNetworkStore();
    const { executeSwap, getQuote, loading: swapLoading, error: swapError, lastSignature } = useJupiterSwap();

    // State
    const [inputMint, setInputMint] = useState<string>(TOKEN_MINTS.SOL_MINT);
    const [outputMint, setOutputMint] = useState<string>(network === 'devnet' ? TOKEN_MINTS.USDC_DEVNET : TOKEN_MINTS.USDC_MAINNET);
    const [amount, setAmount] = useState('');
    const [quote, setQuote] = useState<any>(null);
    const [quoteLoading, setQuoteLoading] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    // Balances
    const { solBalance, usdcBalance } = useWalletBalance(pubkey, network === 'devnet' ? TOKEN_MINTS.USDC_DEVNET : TOKEN_MINTS.USDC_MAINNET);

    // Tokens metadata
    const TOKENS = {
        [TOKEN_MINTS.SOL_MINT]: { symbol: 'SOL', name: 'Solana', decimals: 9 },
        [TOKEN_MINTS.USDC_DEVNET]: { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
        [TOKEN_MINTS.USDC_MAINNET]: { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    };

    const getInputSymbol = () => TOKENS[inputMint as keyof typeof TOKENS]?.symbol || 'Unknown';
    const getOutputSymbol = () => TOKENS[outputMint as keyof typeof TOKENS]?.symbol || 'Unknown';

    const handleSwapDirection = () => {
        setInputMint(outputMint);
        setOutputMint(inputMint);
        setAmount('');
        setQuote(null);
    };

    const handleGetQuote = async () => {
        if (!amount || parseFloat(amount) <= 0) return;

        setQuoteLoading(true);
        setLocalError(null);
        setQuote(null);

        try {
            const quoteData = await getQuote({
                inputMint,
                outputMint,
                amount: parseFloat(amount),
                slippageBps: 50, // 0.5%
            });
            setQuote(quoteData);
        } catch (err: any) {
            setLocalError(err.message || 'Failed to get quote');
        } finally {
            setQuoteLoading(false);
        }
    };

    const handleSwap = async () => {
        if (!quote) return;

        setLocalError(null);

        try {
            await executeSwap({
                inputMint,
                outputMint,
                amount: parseFloat(amount),
                slippageBps: 50,
            });
            // Success is handled by checking lastSignature in UI
            setAmount('');
            setQuote(null);
        } catch (err: any) {
            // Error is handled by useJupiterSwap error state, but we can also set local
            console.error(err);
        }
    };

    // Debounced quote fetch
    useEffect(() => {
        const timer = setTimeout(() => {
            if (amount && parseFloat(amount) > 0) {
                handleGetQuote();
            } else {
                setQuote(null);
            }
        }, 600);
        return () => clearTimeout(timer);
    }, [amount, inputMint, outputMint]);

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft color="#FFF" size={24} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Swap Tokens</Text>
                    <View style={{ width: 24 }} />
                </View>

                <Card style={styles.card}>
                    <CardContent style={styles.cardContent}>

                        {/* Input Token */}
                        <View style={styles.tokenSection}>
                            <View style={styles.tokenHeader}>
                                <Text style={styles.label}>You Pay</Text>
                                <Text style={styles.balance}>
                                    Balance: {inputMint === TOKEN_MINTS.SOL_MINT ? (solBalance || 0).toFixed(4) : (usdcBalance || 0).toFixed(2)}
                                </Text>
                            </View>
                            <View style={styles.inputRow}>
                                <Input
                                    value={amount}
                                    onChangeText={setAmount}
                                    placeholder="0.00"
                                    keyboardType="decimal-pad"
                                    style={styles.amountInput}
                                    {...({} as any)}
                                />
                                <View style={styles.tokenBadge}>
                                    <Text style={styles.tokenSymbol}>{getInputSymbol()}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Swap Direction Button */}
                        <View style={styles.dividerContainer}>
                            <View style={styles.dividerLine} />
                            <TouchableOpacity onPress={handleSwapDirection} style={styles.swapButton}>
                                <ArrowDownUp color="#7857ff" size={20} />
                            </TouchableOpacity>
                        </View>

                        {/* Output Token */}
                        <View style={styles.tokenSection}>
                            <View style={styles.tokenHeader}>
                                <Text style={styles.label}>You Receive</Text>
                                <Text style={styles.balance}>
                                    Balance: {outputMint === TOKEN_MINTS.SOL_MINT ? (solBalance || 0).toFixed(4) : (usdcBalance || 0).toFixed(2)}
                                </Text>
                            </View>
                            <View style={styles.inputRow}>
                                {quoteLoading ? (
                                    <ActivityIndicator color="#7857ff" />
                                ) : (
                                    <Text style={[styles.amountDisplay, !quote && styles.placeholder]}>
                                        {quote ? (parseFloat(quote.outAmount) / Math.pow(10, TOKENS[outputMint as keyof typeof TOKENS]?.decimals || 6)).toFixed(6) : '0.00'}
                                    </Text>
                                )}
                                <View style={styles.tokenBadge}>
                                    <Text style={styles.tokenSymbol}>{getOutputSymbol()}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Quote Details */}
                        {quote && (
                            <View style={styles.quoteDetails}>
                                <View style={styles.quoteRow}>
                                    <Text style={styles.quoteLabel}>Rate</Text>
                                    <Text style={styles.quoteValue}>
                                        1 {getInputSymbol()} ≈ {(parseFloat(quote.outAmount) / parseFloat(quote.inAmount) * Math.pow(10, (TOKENS[inputMint as keyof typeof TOKENS]?.decimals || 0) - (TOKENS[outputMint as keyof typeof TOKENS]?.decimals || 0))).toFixed(4)} {getOutputSymbol()}
                                    </Text>
                                </View>
                                <View style={styles.quoteRow}>
                                    <Text style={styles.quoteLabel}>Price Impact</Text>
                                    <Text style={[styles.quoteValue, { color: Number(quote.priceImpactPct) > 1 ? '#EF4444' : '#10B981' }]}>
                                        {quote.priceImpactPct}%
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Error Message */}
                        {(localError || swapError) && (
                            <View style={styles.errorContainer}>
                                <AlertCircle size={16} color="#EF4444" />
                                <Text style={styles.errorText}>
                                    {localError || swapError?.message}
                                </Text>
                            </View>
                        )}

                        {/* Success Message */}
                        {lastSignature && !swapError && !localError && (
                            <View style={styles.successContainer}>
                                <CheckCircle size={16} color="#10B981" />
                                <View>
                                    <Text style={styles.successText}>Swap Successful!</Text>
                                    <TouchableOpacity onPress={() => Linking.openURL(`https://solscan.io/tx/${lastSignature}${network === 'devnet' ? '?cluster=devnet' : ''}`)}>
                                        <View style={styles.linkRow}>
                                            <Text style={styles.linkText}>View Transaction</Text>
                                            <ExternalLink size={12} color="#60A5FA" />
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* Action Button */}
                        <View style={{ marginTop: 24 }}>
                            {network === 'devnet' ? (
                                <View style={styles.warningBox}>
                                    <AlertCircle size={20} color="#F59E0B" />
                                    <Text style={styles.warningText}>
                                        Jupiter Swap is only available on Mainnet. Switch networks in Dashboard to use.
                                    </Text>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    onPress={handleSwap}
                                    disabled={swapLoading || !quote || !amount}
                                    style={[
                                        styles.actionButton,
                                        (swapLoading || !quote || !amount) && styles.disabledButton
                                    ]}
                                >
                                    {swapLoading ? (
                                        <ActivityIndicator color="#FFF" />
                                    ) : (
                                        <Text style={styles.actionButtonText}>
                                            {!amount ? 'Enter Amount' : 'Swap'}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            )}
                        </View>

                    </CardContent>
                </Card>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    scrollContent: {
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
        marginTop: 20,
    },
    backButton: {
        padding: 8,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    card: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 24,
    },
    cardContent: {
        padding: 20,
    },
    tokenSection: {
        gap: 12,
    },
    tokenHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    label: {
        color: '#9CA3AF',
        fontSize: 14,
        fontWeight: '600',
    },
    balance: {
        color: '#9CA3AF',
        fontSize: 12,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    amountInput: {
        flex: 1,
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
        padding: 0,
        backgroundColor: 'transparent',
        borderWidth: 0,
    },
    amountDisplay: {
        flex: 1,
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
    },
    placeholder: {
        color: '#6B7280',
    },
    tokenBadge: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
    },
    tokenSymbol: {
        color: '#FFF',
        fontWeight: '600',
    },
    dividerContainer: {
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 4,
        zIndex: 10,
    },
    dividerLine: {
        position: 'absolute',
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        width: '100%',
    },
    swapButton: {
        backgroundColor: '#1F2937',
        padding: 8,
        borderRadius: 999,
        borderWidth: 4,
        borderColor: '#18181b', // approximate card bg
    },
    quoteDetails: {
        marginTop: 20,
        padding: 16,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        gap: 8,
    },
    quoteRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    quoteLabel: {
        color: '#9CA3AF',
        fontSize: 12,
    },
    quoteValue: {
        color: '#D1D5DB',
        fontSize: 12,
        fontWeight: '500',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(239,68,68,0.1)',
        padding: 12,
        borderRadius: 12,
        marginTop: 16,
    },
    errorText: {
        color: '#FCA5A5',
        fontSize: 13,
        flex: 1,
    },
    successContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: 'rgba(16,185,129,0.1)',
        padding: 12,
        borderRadius: 12,
        marginTop: 16,
    },
    successText: {
        color: '#6EE7B7',
        fontWeight: '600',
    },
    linkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    linkText: {
        color: '#60A5FA',
        fontSize: 12,
        textDecorationLine: 'underline',
    },
    actionButton: {
        height: 56,
        borderRadius: 16,
        backgroundColor: '#7857ff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabledButton: {
        backgroundColor: 'rgba(120, 87, 255, 0.5)',
        opacity: 0.7,
    },
    actionButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    warningBox: {
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    warningText: {
        color: '#FCD34D',
        fontSize: 14,
        flex: 1,
    },
});
