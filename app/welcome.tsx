import React, { FC } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { Button, ScreenWrapper } from '@/components';
import { theme } from '@/constants';
import { hp, wp } from '@/helpers';

const Welcome: FC = () => {
    const router = useRouter();

    return (
        <ScreenWrapper bg={'white'}>
            <StatusBar style={'dark'} />
            <View style={styles.container}>
                {/** Welcome Image */}
                <Image
                    resizeMode={'contain'}
                    source={require('@/assets/images/welcome.png')}
                    style={styles.welcomeImage}
                />

                {/** Title */}
                <View>
                    <Text style={styles.title}>{'LinkUp!'}</Text>
                    <Text style={styles.punchLine}>
                        {'Where every thought finds a home and every image tells a story.'}
                    </Text>
                </View>

                {/** Footer */}
                <View style={styles.footer}>
                    <Button buttonStyle={{ marginHorizontal: wp(3) }} onPress={() => {}} title={'Getting Started'} />

                    <View style={styles.bottomTextContainer}>
                        <Text style={styles.loginText}>{'Already have an account!'}</Text>

                        <Pressable onPress={() => router.push('/login')}>
                            <Text
                                style={[
                                    styles.loginText,
                                    { color: theme.colors.primary, fontWeight: theme.fonts.semibold },
                                ]}
                            >
                                {'Login'}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    bottomTextContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 5,
    },
    container: {
        alignItems: 'center',
        backgroundColor: 'white',
        flex: 1,
        justifyContent: 'space-around',
        paddingHorizontal: wp(4),
    },
    footer: {
        gap: 30,
        width: '100%',
    },
    loginText: {
        color: theme.colors.text,
        fontSize: hp(1.6),
        textAlign: 'center',
    },
    punchLine: {
        color: theme.colors.text,
        fontSize: hp(1.7),
        paddingHorizontal: wp(10),
        textAlign: 'center',
    },
    title: {
        color: theme.colors.text,
        fontSize: hp(4),
        fontWeight: theme.fonts.extraBold,
        textAlign: 'center',
    },
    welcomeImage: {
        alignSelf: 'center',
        height: hp(30),
        width: wp(100),
    },
});

export default Welcome;
