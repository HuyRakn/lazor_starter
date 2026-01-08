import { View, Text, StyleSheet } from 'react-native';

interface CodeExampleProps {
    title: string;
    description: string;
    code: string;
}

export function CodeExample({ title, description, code }: CodeExampleProps) {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.description}>{description}</Text>
            </View>
            <View style={styles.codeContainer}>
                <Text style={styles.code}>{code}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 24,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        overflow: 'hidden',
    },
    header: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(255,255,255,0.02)',
    },
    title: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    description: {
        color: '#9CA3AF',
        fontSize: 12,
    },
    codeContainer: {
        padding: 16,
        backgroundColor: '#0F1115', // Darker background for code
    },
    code: {
        color: '#D1D5DB', // Light gray/white text
        fontFamily: 'monospace', // Ensure monospace font if available (might need Platform.select for Courier/Menlo)
        fontSize: 11,
        lineHeight: 16,
    },
});
