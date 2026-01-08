import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Linking, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, AlertCircle, CheckCircle, ExternalLink, Image as ImageIcon } from 'lucide-react-native';
import { useAuth, useSmartWallet, generateMintId, formatTransactionError, validateNftMetadata, addSmartWalletToInstructions } from '@lazor-starter/core';
import { buildMetaplexInstructions, storeNftMetadata, REGULAR_NFT_SYMBOL } from '../src/lib/nft-utils';
import { Input, Card, CardContent } from '@lazor-starter/ui';
import { useState } from 'react';
import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, createInitializeMintInstruction, createAssociatedTokenAccountInstruction, createMintToInstruction, getAssociatedTokenAddress, MINT_SIZE } from '@solana/spl-token';
import { getConnection } from '@lazor-starter/core';

export default function NftMintScreen() {
    const router = useRouter();
    const { pubkey } = useAuth();
    const { wallet, signAndSendTransaction } = useSmartWallet();

    // State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [minting, setMinting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mintedNft, setMintedNft] = useState<{
        mintAddress: string;
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
            const connection = getConnection();
            const walletPubkey = new PublicKey(pubkey);

            // Store metadata
            const mintId = generateMintId('nft');
            const metadataUri = await storeNftMetadata(mintId, {
                name: name.trim(),
                description: description.trim(),
            });

            // Build mint instructions
            const mintSeed = `nft-${mintId}`;
            const mintPubkey = await PublicKey.createWithSeed(
                walletPubkey,
                mintSeed,
                TOKEN_PROGRAM_ID
            );

            const lamports = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);
            const associatedTokenAddress = await getAssociatedTokenAddress(
                mintPubkey,
                walletPubkey,
                true
            );

            const instructions: TransactionInstruction[] = [];

            // Create mint account
            instructions.push(
                SystemProgram.createAccountWithSeed({
                    fromPubkey: walletPubkey,
                    basePubkey: walletPubkey,
                    seed: mintSeed,
                    newAccountPubkey: mintPubkey,
                    lamports,
                    space: MINT_SIZE,
                    programId: TOKEN_PROGRAM_ID,
                })
            );

            // Initialize mint
            instructions.push(
                createInitializeMintInstruction(
                    mintPubkey,
                    0,
                    walletPubkey,
                    walletPubkey
                )
            );

            // Create ATA
            instructions.push(
                createAssociatedTokenAccountInstruction(
                    walletPubkey,
                    associatedTokenAddress,
                    walletPubkey,
                    mintPubkey
                )
            );

            // Mint token
            instructions.push(
                createMintToInstruction(
                    mintPubkey,
                    associatedTokenAddress,
                    walletPubkey,
                    1,
                    []
                )
            );

            // Metaplex instructions
            const metaplexInstructions = await buildMetaplexInstructions(
                pubkey,
                mintPubkey.toBase58(),
                name.trim(),
                metadataUri,
                REGULAR_NFT_SYMBOL
            );

            instructions.push(...metaplexInstructions);

            // Add smart wallet
            addSmartWalletToInstructions(instructions, pubkey);

            // Send transaction
            const signature = await signAndSendTransaction({
                instructions,
                transactionOptions: {
                    computeUnitLimit: 400_000,
                },
            });

            setMintedNft({
                mintAddress: mintPubkey.toBase58(),
                signature,
            });

            setName('');
            setDescription('');

        } catch (err: any) {
            setError(formatTransactionError(err, 'NFT Minting'));
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
                    <Text style={styles.headerTitle}>Mint NFT</Text>
                    <View style={{ width: 24 }} />
                </View>

                <Card style={styles.card}>
                    <CardContent style={styles.cardContent}>

                        <View style={styles.iconContainer}>
                            <ImageIcon color="#7857ff" size={40} />
                        </View>
                        <Text style={styles.subtitle}>Create your own digital collectible on Solana. Gasless for you!</Text>

                        <View style={styles.formSection}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>NFT Name</Text>
                                <Input
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="My Awesome NFT"
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
                                    placeholder="Describe your NFT..."
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
                                    <Text style={styles.successText}>NFT Minted Successfully!</Text>
                                    <Text style={styles.mintAddress}>Mint: {mintedNft.mintAddress.slice(0, 8)}...{mintedNft.mintAddress.slice(-8)}</Text>
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
                                        Mint NFT (Gasless!)
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
        backgroundColor: 'rgba(120, 87, 255, 0.1)',
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
});
