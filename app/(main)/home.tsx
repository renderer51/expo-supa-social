import React, { FC } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import Icon from '@/assets/icons';
import { Avatar, ScreenWrapper } from '@/components';
import { theme } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { hp, wp } from '@/helpers';

const Home: FC = () => {
    const router = useRouter();
    const { user } = useAuth();

    return (
        <ScreenWrapper bg={'white'}>
            {/** Header */}
            <View style={styles.header}>
                <Text style={styles.title}>{'LinkedUp'}</Text>

                <View style={styles.icons}>
                    <Pressable onPress={() => router.push('/notifications')}>
                        <Icon color={theme.colors.text} name={'heart'} size={hp(3.2)} strokeWidth={2} />
                    </Pressable>
                    <Pressable onPress={() => router.push('/newPost')}>
                        <Icon color={theme.colors.text} name={'plus'} size={hp(3.2)} strokeWidth={2} />
                    </Pressable>
                    <Pressable onPress={() => router.push('/profile')}>
                        <Avatar rounded={theme.radius.sm} size={hp(4.3)} style={{ borderWidth: 2 }} uri={user?.image} />
                    </Pressable>
                </View>
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    avatarImage: {
        borderColor: theme.colors.gray,
        borderCurve: 'continuous',
        borderRadius: theme.radius.sm,
        borderWidth: 3,
        height: hp(4.3),
        width: hp(4.3),
    },
    container: {
        flex: 1,
    },
    header: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        marginHorizontal: wp(4),
    },
    icons: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 10,
        justifyContent: 'center',
    },
    listStyle: {
        paddingTop: 20,
        paddingHorizontal: wp(4),
    },
    noPosts: {
        color: theme.colors.text,
        fontSize: hp(2),
        textAlign: 'center',
    },
    pill: {
        alignItems: 'center',
        backgroundColor: theme.colors.roseLight,
        borderRadius: 20,
        height: hp(2.2),
        justifyContent: 'center',
        position: 'absolute',
        right: -10,
        top: -4,
        width: hp(2.2),
    },
    pillText: {
        color: 'white',
        fontSize: hp(1.2),
        fontWeight: theme.fonts.bold,
    },
    title: {
        color: theme.colors.text,
        fontSize: hp(3.2),
        fontWeight: theme.fonts.bold,
    },
});

export default Home;
