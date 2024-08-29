import React, { FC, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Header, NotificationItem, ScreenWrapper } from '@/components';
import { theme } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { hp, wp } from '@/helpers';
import { fetchNotifications } from '@/services';
import { INotification } from '@/types';

const Notifications: FC = () => {
    const router = useRouter();

    const [notifications, setNotifications] = useState<INotification[]>([]);
    const { user } = useAuth();

    const getNotifications = async () => {
        let res = await fetchNotifications(user?.id);
        if (res.success) {
            setNotifications(res.data || []);
        }
    };

    useEffect(() => {
        getNotifications();
    }, []);

    return (
        <ScreenWrapper>
            <View style={styles.container}>
                <Header title={'Notifications'} />
                <ScrollView contentContainerStyle={styles.listStyle} showsVerticalScrollIndicator={false}>
                    {notifications.map((item) => (
                        <NotificationItem item={item} key={item.id} router={router} />
                    ))}
                    {notifications.length === 0 && <Text style={styles.noData}>{'No notifications yet'}</Text>}
                </ScrollView>
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: wp(4),
    },
    listStyle: {
        gap: 10,
        paddingVertical: 20,
    },
    noData: {
        color: theme.colors.text,
        fontSize: hp(1.8),
        fontWeight: theme.fonts.medium,
        textAlign: 'center',
    },
});

export default Notifications;
