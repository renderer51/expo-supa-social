import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { theme } from '@/constants';

interface SwitchProps {
    value: boolean;
    onValueChange: (value: boolean) => void;
}

export const Switch: React.FC<SwitchProps> = ({ value, onValueChange }) => {
    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onValueChange(!value)}
            style={[styles.container, value && styles.activeContainer]}
        >
            <View style={[styles.thumb, value && styles.activeThumb]} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.gray,
        borderRadius: 16,
        height: 32,
        padding: 2,
        width: 56,
    },
    activeContainer: {
        backgroundColor: theme.colors.primary,
    },
    thumb: {
        backgroundColor: 'white',
        borderRadius: 14,
        height: 28,
        width: 28,
    },
    activeThumb: {
        transform: [{ translateX: 24 }],
    },
}); 