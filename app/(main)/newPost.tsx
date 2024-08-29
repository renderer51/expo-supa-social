import React, { FC, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { RichEditor } from 'react-native-pell-rich-editor';
import * as ImagePicker from 'expo-image-picker';

import Icon from '@/assets/icons';
import { Avatar, Button, Header, RichTextEditor, ScreenWrapper } from '@/components';
import { theme } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { hp, wp } from '@/helpers';
import { createOrUpdatePost, getSupabaseFileUrl } from '@/services';

const NewPost: FC = () => {
    const { user } = useAuth();
    const router = useRouter();
    const post: any = useLocalSearchParams();

    const bodyRef = useRef<string>('');
    const editorRef = useRef<RichEditor>(null);
    const [file, setFile] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const onPick = async (isImage: boolean) => {
        let mediaConfig: any = {
            allowsEditing: true,
            aspect: [4, 3],
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
        };
        if (!isImage) {
            mediaConfig = {
                allowsEditing: true,
                mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            };
        }

        let result = await ImagePicker.launchImageLibraryAsync(mediaConfig);

        if (!result.canceled) {
            setFile(result.assets[0]);
        }
    };

    const isLocalFile = (file: any) => {
        if (!file) {
            return null;
        }
        if (typeof file === 'object') {
            return true;
        }

        return false;
    };

    const getFileType = (file: any) => {
        if (!file) {
            return null;
        }
        if (isLocalFile(file)) {
            return file?.type;
        }

        /** Check image or video for remote file */
        if (file.includes('postImage')) {
            return 'image';
        }

        return 'video';
    };

    const getFileUri = (file: any) => {
        if (!file) {
            return null;
        }
        if (isLocalFile(file)) {
            return file.uri;
        }

        return getSupabaseFileUrl(file)?.uri;
    };

    const onSubmit = async () => {
        if (!bodyRef.current && !file) {
            Alert.alert('Post', 'Please choose an image or add post body');
            return;
        }

        let data: any = {
            body: bodyRef.current,
            file,
            userId: user?.id,
        };

        if (post && post?.id) {
            data.id === post.id;
        }

        /** Create post */
        setLoading(true);
        let res = await createOrUpdatePost(data);
        setLoading(false);

        if (res.success) {
            setFile(null);
            bodyRef.current = '';
            editorRef.current?.setContentHTML('');
            router.back();
        } else {
            if ('msg' in res) {
                Alert.alert('Post', res.msg);
            }
        }
    };

    useEffect(() => {
        if (post & post?.id) {
            bodyRef.current = post?.body;
            setFile(post?.file || null);
            setTimeout(() => {
                editorRef?.current?.setContentHTML(post?.body);
            }, 300);
        }
    }, []);

    return (
        <ScreenWrapper bg={'white'}>
            <View style={styles.container}>
                <Header title={'Create Post'} />

                <ScrollView contentContainerStyle={{ gap: 20 }}>
                    {/** Avatar */}
                    <View style={styles.header}>
                        <Avatar rounded={theme.radius.xl} size={hp(6.5)} uri={user?.image} />

                        <View style={{ gap: 2 }}>
                            <Text style={styles.username}>{user && user.name}</Text>
                            <Text style={styles.publicText}>{'Public'}</Text>
                        </View>
                    </View>

                    {/** Editor */}
                    <View style={styles.textEditor}>
                        <RichTextEditor ref={editorRef} onChange={(body) => (bodyRef.current = body)} />
                    </View>

                    {/** File picked */}
                    {file && (
                        <View style={styles.file}>
                            {getFileType(file) === 'video' ? (
                                <Video
                                    isLooping
                                    resizeMode={ResizeMode.COVER}
                                    source={{ uri: getFileUri(file) }}
                                    style={{ flex: 1 }}
                                    useNativeControls
                                />
                            ) : (
                                <Image contentFit={'cover'} source={{ uri: getFileUri(file) }} style={{ flex: 1 }} />
                            )}

                            <Pressable onPress={() => setFile(null)} style={styles.closeIcon}>
                                <Icon color={'white'} name={'delete'} size={25} />
                            </Pressable>
                        </View>
                    )}

                    {/** Attach */}
                    <View style={styles.media}>
                        <Text style={styles.addImageText}>{'Add to your post'}</Text>
                        <Text style={styles.mediaIcons}>
                            <TouchableOpacity activeOpacity={0.7} onPress={() => onPick(true)}>
                                <Icon color={theme.colors.dark} name={'image'} size={30} />
                            </TouchableOpacity>
                            <TouchableOpacity activeOpacity={0.7} onPress={() => onPick(false)}>
                                <Icon color={theme.colors.dark} name={'video'} size={33} />
                            </TouchableOpacity>
                        </Text>
                    </View>
                </ScrollView>

                {/** Button submit */}
                <Button
                    buttonStyle={{ height: hp(6.2) }}
                    hasShadow={false}
                    loading={loading}
                    onPress={onSubmit}
                    title={post && post?.id ? 'Update' : 'Post'}
                />
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    addImageText: {
        color: theme.colors.text,
        fontSize: hp(1.9),
        fontWeight: theme.fonts.semibold,
    },
    avatar: {
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderCurve: 'continuous',
        borderRadius: theme.radius.xl,
        borderWidth: 1,
        height: hp(6.5),
        width: hp(6.5),
    },
    closeIcon: {
        backgroundColor: 'rgba(255, 0, 0, 0.6)',
        borderRadius: 50,
        padding: 7,
        position: 'absolute',
        right: 10,
        top: 10,
    },
    container: {
        flex: 1,
        gap: 15,
        marginBottom: 30,
        paddingHorizontal: wp(4),
    },
    file: {
        borderCurve: 'continuous',
        borderRadius: theme.radius.xl,
        height: hp(30),
        overflow: 'hidden',
        width: '100%',
    },
    header: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 12,
    },
    imageIcon: {
        borderRadius: theme.radius.md,
    },
    media: {
        alignItems: 'center',
        borderColor: theme.colors.gray,
        borderCurve: 'continuous',
        borderRadius: theme.radius.xl,
        borderWidth: 1.5,
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 12,
        paddingHorizontal: 18,
    },
    mediaIcons: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 15,
    },
    publicText: {
        color: theme.colors.textLight,
        fontSize: hp(1.7),
        fontWeight: theme.fonts.medium,
    },
    textEditor: {},
    title: {
        color: theme.colors.text,
        fontSize: hp(2.5),
        fontWeight: theme.fonts.semibold,
        textAlign: 'center',
    },
    username: {
        color: theme.colors.text,
        fontSize: hp(2.2),
        fontWeight: theme.fonts.semibold,
    },
    video: {},
});

export default NewPost;
