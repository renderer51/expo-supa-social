import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

import Icon from '@/assets/icons';
import { Button, Header, ScreenWrapper, TextField } from '@/components';
import { theme } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { hp, wp } from '@/helpers';
import { getUserImageSrc, updateUser, uploadFile } from '@/services';

const EditProfile = () => {
    const { user: currentUser, setUserData } = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState<boolean>(false);
    const [user, setUser] = useState<{
        address: string;
        bio: string;
        image: null | string;
        name: string;
        phoneNumber: string;
    }>({ address: '', bio: '', image: null, name: '', phoneNumber: '' });

    const onPickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [4, 3],
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            quality: 1,
        });

        if (!result.canceled) {
            setUser((prev) => ({ ...prev, image: result.assets[0].uri }));
        }
    };

    const onSubmit = async () => {
        let userData = { ...user };
        let { address, bio, image, name, phoneNumber } = userData;

        if (!address || !bio || !image || !name || !phoneNumber) {
            Alert.alert('Profile', 'Please fill all the fields');
            return;
        }

        setLoading(true);
        if (image.includes('///')) {
            /** Upload image */
            let imageRes = await uploadFile('profiles', image, true);
            if (imageRes.success) {
                userData.image = imageRes.data || '';
            } else {
                userData.image = null;
            }
        }

        /** Update user */
        const res = await updateUser(userData, currentUser?.id);
        setLoading(false);

        if (res.success) {
            setUserData?.({ ...currentUser, ...userData });
            router.back();
        }

        console.log('Update user result >>:', res);
    };

    useEffect(() => {
        if (currentUser) {
            setUser({
                address: currentUser.address || '',
                bio: currentUser.bio || '',
                image: currentUser.image || null,
                name: currentUser.name || '',
                phoneNumber: currentUser.phoneNumber || '',
            });
        }
    }, [currentUser]);

    return (
        <ScreenWrapper bg={'white'}>
            <View style={styles.container}>
                <ScrollView style={{ flex: 1 }}>
                    <Header title={'Edit Profile'} />

                    {/** Form */}
                    <View style={styles.form}>
                        {/** Avatar */}
                        <View style={styles.avatarContainer}>
                            <Image
                                source={user.image?.includes('///') ? { uri: user.image } : getUserImageSrc(user.image)}
                                style={styles.avatar}
                            />
                            <Pressable onPress={onPickImage} style={styles.cameraIcon}>
                                <Icon name={'camera'} size={20} strokeWidth={2.5} />
                            </Pressable>
                        </View>

                        <Text style={{ color: theme.colors.text, fontSize: hp(1.5) }}>
                            {'Please fill your profile details'}
                        </Text>
                        <TextField
                            icon={<Icon name={'user'} />}
                            onChangeText={(value) => setUser((prev) => ({ ...prev, name: value }))}
                            placeholder={'Enter your name'}
                            value={user.name}
                        />

                        <TextField
                            icon={<Icon name={'call'} />}
                            onChangeText={(value) => setUser((prev) => ({ ...prev, phoneNumber: value }))}
                            placeholder={'Enter your phone number'}
                            value={user.phoneNumber}
                        />

                        <TextField
                            icon={<Icon name={'location'} />}
                            onChangeText={(value) => setUser((prev) => ({ ...prev, address: value }))}
                            placeholder={'Enter your address'}
                            value={user.address}
                        />

                        <TextField
                            containerStyle={styles.bio}
                            multiline
                            onChangeText={(value) => setUser((prev) => ({ ...prev, bio: value }))}
                            placeholder={'Enter your bio'}
                            value={user.bio}
                        />

                        <Button loading={loading} onPress={onSubmit} title={'Update'} />
                    </View>
                </ScrollView>
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    avatar: {
        borderColor: theme.colors.darkLight,
        borderCurve: 'continuous',
        borderRadius: theme.radius.xxl * 1.8,
        borderWidth: 1,
        height: '100%',
        width: '100%',
    },
    avatarContainer: {
        alignSelf: 'center',
        height: hp(14),
        width: hp(14),
    },
    bio: {
        alignItems: 'flex-start',
        flexDirection: 'row',
        height: hp(15),
        paddingVertical: 15,
    },
    cameraIcon: {
        backgroundColor: 'white',
        borderRadius: 50,
        bottom: 0,
        elevation: 7,
        padding: 8,
        position: 'absolute',
        right: -10,
        shadowOffset: { height: 4, width: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
    },
    container: {
        flex: 1,
        paddingHorizontal: wp(4),
    },
    form: {
        gap: 18,
        marginTop: 20,
    },
    input: {
        flexDirection: 'row',
        borderColor: theme.colors.text,
        borderCurve: 'continuous',
        borderRadius: theme.radius.xxl,
        borderWidth: 0.4,
        gap: 15,
        padding: 17,
        paddingHorizontal: 20,
    },
});

export default EditProfile;
