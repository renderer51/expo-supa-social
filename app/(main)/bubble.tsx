import React, { FC, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View, Alert, Platform, Image } from 'react-native';
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
    lastSeen: string;
}

// Dummy data for demonstration
const DUMMY_USERS: NearbyUser[] = [
    {
        id: '1',
        username: 'Sarah Johnson',
        image: 'https://i.pravatar.cc/150?img=1',
        lastSeen: '2 minutes ago'
    },
    {
        id: '2',
        username: 'Mike Chen',
        image: 'https://i.pravatar.cc/150?img=2',
        lastSeen: '5 minutes ago'
    },
    {
        id: '3',
        username: 'Emma Wilson',
        image: 'https://i.pravatar.cc/150?img=3',
        lastSeen: '10 minutes ago'
    },
    {
        id: '4',
        username: 'David Kim',
        image: 'https://i.pravatar.cc/150?img=4',
        lastSeen: '15 minutes ago'
    },
    {
        id: '5',
        username: 'Lisa Anderson',
        image: 'https://i.pravatar.cc/150?img=5',
        lastSeen: '20 minutes ago'
    },
    {
        id: '6',
        username: 'James Smith',
        image: 'https://i.pravatar.cc/150?img=6',
        lastSeen: '30 minutes ago'
    },
    {
        id: '7',
        username: 'Sophie Brown',
        image: 'https://i.pravatar.cc/150?img=7',
        lastSeen: '45 minutes ago'
    },
    {
        id: '8',
        username: 'Alex Turner',
        image: 'https://i.pravatar.cc/150?img=8',
        lastSeen: '1 hour ago'
    }
];

const Bubble: FC = () => {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [error, setError] = useState<string | null>(null);

    const requestLocationPermission = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setError('Location permission is required to find nearby users.');
                Alert.alert(
                    'Permission Denied',
                    'Location permission is required to find nearby users.',
                    [{ text: 'OK' }]
                );
                return false;
            }
            return true;
        } catch (err) {
            setError('Failed to request location permission');
            console.error('Location permission error:', err);
            return false;
        }
    };

    const getCurrentLocation = async () => {
        try {
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });
            setLocation(location);
            return location;
        } catch (error) {
            setError('Failed to get location');
            console.error('Location error:', error);
            Alert.alert('Error', 'Failed to get location. Please make sure location services are enabled.');
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
        try {
            // For demonstration, we'll use dummy data
            // In a real app, this would fetch from the database
            setNearbyUsers(DUMMY_USERS);
            
            // Update user's location in the database (for real app)
            if (location && user?.id) {
                await supabase
                    .from('user_locations')
                    .upsert({
                        user_id: user.id,
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        last_updated: new Date().toISOString(),
                    });
            }
        } catch (error) {
            console.error('Error finding nearby users:', error);
            setError('Failed to find nearby users');
            Alert.alert('Error', 'Failed to find nearby users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const initializeLocation = async () => {
            if (Platform.OS === 'web') {
                setError('Location services are not available in web browser');
                setLoading(false);
                return;
            }

            const hasPermission = await requestLocationPermission();
            if (hasPermission) {
                const location = await getCurrentLocation();
                if (location) {
                    await findNearbyUsers();
                } else {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };

        initializeLocation();
    }, []);

    const renderUser = ({ item }: { item: NearbyUser }) => (
        <Pressable
            style={styles.userCard}
            onPress={() => router.push({
                pathname: '/(main)/profile',
                params: { id: item.id }
            })}
        >
            <Image
                source={{ uri: item.image }}
                style={[styles.avatar, { borderRadius: theme.radius.sm, height: hp(5), width: hp(5) }]}
            />
            <View style={styles.userInfo}>
                <Text style={styles.username}>{item.username}</Text>
                <Text style={styles.lastSeen}>{item.lastSeen}</Text>
            </View>
        </Pressable>
    );

    const renderEmptyComponent = () => (
        <View style={styles.emptyContainer}>
            <Icon name="user" size={hp(8)} color={theme.colors.textLight} />
            <Text style={styles.emptyText}>No users nearby</Text>
            <Text style={styles.emptySubText}>Check back later to find people around you</Text>
        </View>
    );

    return (
        <ScreenWrapper bg={'white'}>
            <View style={styles.header}>
                <Text style={styles.title}>Bubble</Text>
                <Text style={styles.subtitle}>Find people nearby</Text>
                <Text style={styles.radiusText}>Users in a 500m radius</Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <Loading />
                </View>
            ) : error ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : (
                <FlatList
                    data={nearbyUsers}
                    renderItem={renderUser}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={renderEmptyComponent}
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
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: hp(20),
    },
    errorText: {
        fontSize: hp(1.8),
        color: theme.colors.rose,
        textAlign: 'center',
        marginHorizontal: wp(4),
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
    lastSeen: {
        fontSize: hp(1.2),
        color: theme.colors.textLight,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: hp(20),
        paddingHorizontal: wp(4),
    },
    emptyText: {
        fontSize: hp(2.2),
        color: theme.colors.text,
        marginTop: hp(2),
        textAlign: 'center',
    },
    emptySubText: {
        fontSize: hp(1.6),
        color: theme.colors.textLight,
        marginTop: hp(1),
        textAlign: 'center',
    },
    avatar: {
        borderColor: theme.colors.darkLight,
        borderCurve: 'continuous',
        borderWidth: 1,
    },
    radiusText: {
        color: theme.colors.textLight,
        fontSize: hp(2),
        marginTop: hp(1),
        fontWeight: theme.fonts.medium,
    },
});

export default Bubble; 