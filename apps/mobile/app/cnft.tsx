import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Linking, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, AlertCircle, CheckCircle, ExternalLink, Database } from 'lucide-react-native';
import { useAuth, useSmartWallet, generateMintId, formatTransactionError, validateNftMetadata, addSmartWalletToInstructions } from '@lazor-starter/core';
import { buildCNftMintInstruction, storeNftMetadata, extractCNftAssetId, DEMO_MERKLE_TREE, CNFT_SYMBOL } from '../src/lib/nft-utils';
import { Input, Card, CardContent } from '@lazor-starter/ui';
import { useState } from 'react';

export default function CNftMintScreen() {
    const router = useRouter();
    const { pubkey } = useAuth();
    const { wallet, signAndSendTransaction } = useSmartWallet();

    // State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [minting, setMinting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mintedNft, setMintedNft] = useState<{
        assetId: string;
        signature: string;
    } | null>(null);

    const handleMint = async () => {
        if (!pubkey || !wallet) return;

        const validation = validateNftMetadata(name, description);
        if (!validation.valid) {
            setError(validation.error || 'Invalid input');
            return;
        }

        setMinting(true);
        setError(null);
        setMintedNft(null);

        try {
            // Store metadata
            const mintId = generateMintId('cnft');
            const metadataUri = await storeNftMetadata(mintId, {
                name: name.trim(),
                description: description.trim(),
            });

            // Build cNFT mint instruction
            const instructions = buildCNftMintInstruction(
                pubkey,
                DEMO_MERKLE_TREE,
                name.trim(),
                metadataUri,
                CNFT_SYMBOL
            );

            addSmartWalletToInstructions(instructions, pubkey);

            // Send transaction
            const signature = await signAndSendTransaction({
                instructions,
                transactionOptions: {
                    computeUnitLimit: 400_000,
                },
            });

            // Extract asset ID
            const assetId = await extractCNftAssetId(signature);

            setMintedNft({
                assetId: assetId,
                signature,
            });

            setName('');
            setDescription('');

        } catch (err: any) {
            setError(formatTransactionError(err, 'cNFT Minting'));
        } finally {
            setMinting(false);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft color="#FFF" size={24} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Mint cNFT</Text>
                    <View style={{ width: 24 }} />
                </View>

                <Card style={styles.card}>
                    <CardContent style={styles.cardContent}>

                        <View style={styles.iconContainer}>
                            <Database color="#10B981" size={40} />
                        </View>
                        <Text style={styles.subtitle}>Compressed NFTs are 100x cheaper! Mint thousands on Solana for pennies.</Text>

                        <View style={styles.formSection}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>cNFT Name</Text>
                                <Input
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="My Compressed NFT"
                                    style={styles.input}
                                    maxLength={32}
                                    {...({} as any)}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Description</Text>
                                <Input
                                    value={description}
                                    onChangeText={setDescription}
                                    placeholder="Describe your compressed NFT..."
                                    style={styles.textArea}
                                    multiline
                                    numberOfLines={4}
                                    maxLength={200}
                                    textAlignVertical="top"
                                    {...({} as any)}
                                />
                            </View>
                        </View>

                        {/* Error Message */}
                        {error && (
                            <View style={styles.errorContainer}>
                                <AlertCircle size={16} color="#EF4444" />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        {/* Success Message */}
                        {mintedNft && (
                            <View style={styles.successContainer}>
                                <CheckCircle size={16} color="#10B981" />
                                <View>
                                    <Text style={styles.successText}>cNFT Minted Successfully!</Text>
                                    <Text style={styles.mintAddress}>Asset ID: {mintedNft.assetId.slice(0, 8)}...{mintedNft.assetId.slice(-8)}</Text>
                                    <TouchableOpacity onPress={() => Linking.openURL(`https://solscan.io/tx/${mintedNft.signature}?cluster=devnet`)}>
                                        <View style={styles.linkRow}>
                                            <Text style={styles.linkText}>View Transaction</Text>
                                            <ExternalLink size={12} color="#60A5FA" />
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        <View style={{ marginTop: 24 }}>
                            <TouchableOpacity
                                onPress={handleMint}
                                disabled={minting || !name || !description}
                                style={[
                                    styles.actionButton,
                                    (minting || !name || !description) && styles.disabledButton
                                ]}
                            >
                                {minting ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={styles.actionButtonText}>
                                        Mint cNFT (Gasless!)
                                    </Text>
                                )}
                            </TouchableOpacity>
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
        padding: 24,
    },
    iconContainer: {
        alignSelf: 'center',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    subtitle: {
        color: '#D1D5DB',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    formSection: {
        gap: 16,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        color: '#9CA3AF',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        color: '#FFF',
    },
    textArea: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        color: '#FFF',
        minHeight: 100,
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
    mintAddress: {
        color: '#9CA3AF',
        fontSize: 12,
        marginTop: 2,
        fontFamily: 'monospace',
    },
    linkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    linkText: {
        color: '#60A5FA',
        fontSize: 12,
        textDecorationLine: 'underline',
    },
    actionButton: {
        height: 52,
        borderRadius: 12,
        backgroundColor: '#10B981',
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabledButton: {
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        opacity: 0.7,
    },
    actionButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
