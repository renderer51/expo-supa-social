import React, { FC, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';

import Icon from '@/assets/icons';
import { Avatar, Loading, ScreenWrapper } from '@/components';
import { theme } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { hp, wp } from '@/helpers';

interface NearbyUser {
    id: string;
    username: string;
    image: string;
    distance: number;
    lastSeen: string;
}

const Bubble: FC = () => {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
    const [location, setLocation] = useState<Location.LocationObject | null>(null);

    const requestLocationPermission = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Permission Denied',
                'Location permission is required to find nearby users.',
                [{ text: 'OK' }]
            );
            return false;
        }
        return true;
    };

    const getCurrentLocation = async () => {
        try {
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });
            setLocation(location);
            return location;
        } catch (error) {
            Alert.alert('Error', 'Failed to get location');
            return null;
        }
    };

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

    const findNearbyUsers = async () => {
        if (!location) return;

        try {
            // Update user's location in the database
            await supabase
                .from('user_locations')
                .upsert({
                    user_id: user?.id,
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    last_updated: new Date().toISOString(),
                });

            // Fetch nearby users (within 10km)
            const { data: users, error } = await supabase
                .from('user_locations')
                .select('*, profiles:user_id(*)')
                .neq('user_id', user?.id);

            if (error) throw error;

            const nearbyUsersWithDistance = users
                .map(user => ({
                    id: user.user_id,
                    username: user.profiles.username,
                    image: user.profiles.image,
                    distance: calculateDistance(
                        location.coords.latitude,
                        location.coords.longitude,
                        user.latitude,
                        user.longitude
                    ),
                    lastSeen: user.last_updated,
                }))
                .filter(user => user.distance <= 10) // Filter users within 10km
                .sort((a, b) => a.distance - b.distance);

            setNearbyUsers(nearbyUsersWithDistance);
        } catch (error) {
            console.error('Error finding nearby users:', error);
            Alert.alert('Error', 'Failed to find nearby users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const initializeLocation = async () => {
            const hasPermission = await requestLocationPermission();
            if (hasPermission) {
                await getCurrentLocation();
                await findNearbyUsers();
            }
        };

        initializeLocation();
    }, []);

    const renderUser = ({ item }: { item: NearbyUser }) => (
        <Pressable
            style={styles.userCard}
            onPress={() => router.push(`/profile/${item.id}`)}
        >
            <Avatar rounded={theme.radius.sm} size={hp(5)} uri={item.image} />
            <View style={styles.userInfo}>
                <Text style={styles.username}>{item.username}</Text>
                <Text style={styles.distance}>
                    {item.distance.toFixed(1)} km away
                </Text>
            </View>
        </Pressable>
    );

    return (
        <ScreenWrapper bg={'white'}>
            <View style={styles.header}>
                <Text style={styles.title}>Bubble</Text>
                <Text style={styles.subtitle}>Find people nearby</Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <Loading />
                </View>
            ) : (
                <FlatList
                    data={nearbyUsers}
                    renderItem={renderUser}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>
                                No users found nearby
                            </Text>
                        </View>
                    }
                />
            )}
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: {
        marginBottom: 20,
        marginHorizontal: wp(4),
    },
    title: {
        color: theme.colors.text,
        fontSize: hp(3.2),
        fontWeight: theme.fonts.bold,
    },
    subtitle: {
        color: theme.colors.gray,
        fontSize: hp(1.8),
        marginTop: 5,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        paddingHorizontal: wp(4),
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: 'white',
        borderRadius: theme.radius.md,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    userInfo: {
        marginLeft: 15,
        flex: 1,
    },
    username: {
        fontSize: hp(1.8),
        fontWeight: theme.fonts.medium,
        color: theme.colors.text,
    },
    distance: {
        fontSize: hp(1.4),
        color: theme.colors.gray,
        marginTop: 2,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: hp(20),
    },
    emptyText: {
        fontSize: hp(1.8),
        color: theme.colors.gray,
    },
});

export default Bubble; 