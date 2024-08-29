import React, { FC, useEffect, useState } from 'react';
import { Alert, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Router } from 'expo-router';
import { Image } from 'expo-image';
import { ResizeMode, Video } from 'expo-av';
import RenderHtml from 'react-native-render-html';
import moment from 'moment';

import Avatar from './Avatar';
import Loading from './Loading';
import { theme } from '@/constants';
import { hp, stripHtmlTags, wp } from '@/helpers';
import { IPost, IUser } from '@/types';
import Icon from '@/assets/icons';
import { createPostLike, downloadFile, getSupabaseFileUrl, removePostLike } from '@/services';

interface PostCardProps {
    currentUser: IUser | null;
    hasShadow?: boolean;
    item: IPost;
    onDelete?: (item: IPost) => void;
    onEdit?: (item: IPost) => void;
    router: Router;
    showDelete?: boolean;
    showMoreIcon?: boolean;
}

const textStyle = {
    color: theme.colors.dark,
    fontSize: hp(1.75),
};

const tagsStyles = {
    div: textStyle,
    h1: {
        color: theme.colors.dark,
    },
    h4: {
        color: theme.colors.dark,
    },
    ol: textStyle,
    p: textStyle,
};

const PostCard: FC<PostCardProps> = ({
    currentUser,
    hasShadow = true,
    item,
    onDelete,
    onEdit,
    router,
    showDelete,
    showMoreIcon = true,
}) => {
    const shadowStyles = {
        elevation: 1,
        shadowOffset: { height: 2, width: 0 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
    };

    const [likes, setLikes] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const liked = likes.filter((like) => like.userId === currentUser?.id)[0] ? true : false;

    const handlePostDelete = () => {
        Alert.alert('Confirm', 'Are you sure you want to do this?', [
            { onPress: () => console.log('Modal cancelled'), text: 'Cancel', style: 'cancel' },
            { onPress: () => onDelete?.(item), text: 'Delete', style: 'destructive' },
        ]);
    };

    const onLike = async () => {
        if (liked) {
            setLikes((prev) => prev.filter((like) => like.userId !== currentUser?.id));

            let res = await removePostLike(item?.id, currentUser?.id);
            if (!res.success) {
                Alert.alert('Post', 'Something went wrong!');
            }
        } else {
            let data = { postId: item?.id, userId: currentUser?.id };
            setLikes((prev) => [...prev, data]);

            let res = await createPostLike(data);
            if (!res.success) {
                Alert.alert('Post', 'Something went wrong!');
            }
        }
    };

    const openPostDetails = async () => {
        if (!showMoreIcon) {
            return null;
        }

        router.push({ pathname: '/(main)/postDetails', params: { postId: item?.id } });
    };

    const onShare = async () => {
        let content: any = { message: stripHtmlTags(item?.body) };
        if (item.file) {
            /** Download the file then share the local uri */
            setLoading(true);
            let url = await downloadFile(getSupabaseFileUrl(item?.file)?.uri || '');
            setLoading(false);
            content.url = url;
        }

        Share.share(content);
    };

    useEffect(() => {
        setLikes(item?.postLikes);
    }, []);

    return (
        <View style={[styles.container, hasShadow && shadowStyles]}>
            <View style={styles.header}>
                {/** User info & post time */}
                <View style={styles.userInfo}>
                    <Avatar rounded={theme.radius.md} size={hp(4.5)} uri={item.user.image} />
                    <View style={{ gap: 2 }}>
                        <Text style={styles.username}>{item.user.name}</Text>
                        <Text style={styles.postTime}>{moment(item.created_at).format('MMM D')}</Text>
                    </View>
                </View>

                {showMoreIcon && (
                    <TouchableOpacity activeOpacity={0.7}>
                        <Icon color={theme.colors.text} name={'threeDotsHorizontal'} size={hp(3.4)} strokeWidth={3} />
                    </TouchableOpacity>
                )}

                {showDelete && currentUser?.id === item?.userId && (
                    <View style={styles.actions}>
                        <TouchableOpacity activeOpacity={0.7} onPress={() => onEdit?.(item)}>
                            <Icon color={theme.colors.text} name={'edit'} size={hp(2.5)} />
                        </TouchableOpacity>
                        <TouchableOpacity activeOpacity={0.7} onPress={handlePostDelete}>
                            <Icon color={theme.colors.rose} name={'delete'} size={hp(2.5)} />
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            <View style={styles.content}>
                <View style={styles.postBody}>
                    {item.body && (
                        <RenderHtml contentWidth={wp(100)} source={{ html: item.body }} tagsStyles={tagsStyles} />
                    )}
                </View>

                {/** Post Image */}
                {item.file && item.file.includes('postImages') && (
                    <Image
                        contentFit={'cover'}
                        source={getSupabaseFileUrl(item?.file)}
                        style={styles.postMedia}
                        transition={100}
                    />
                )}

                {/** Post Video */}
                {item.file && item.file.includes('postVideos') && (
                    <Video
                        isLooping
                        resizeMode={ResizeMode.COVER}
                        source={getSupabaseFileUrl(item?.file)}
                        style={[styles.postMedia, { height: hp(30) }]}
                        useNativeControls
                    />
                )}

                {/** Like, comment & share */}
                <View style={styles.footer}>
                    <View style={styles.footerButton}>
                        <TouchableOpacity activeOpacity={0.7} onPress={onLike}>
                            <Icon
                                color={liked ? theme.colors.rose : theme.colors.textLight}
                                fill={liked ? theme.colors.rose : 'transparent'}
                                name={'heart'}
                                size={24}
                            />
                        </TouchableOpacity>
                        <Text style={styles.count}>{likes.length}</Text>
                    </View>
                    <View style={styles.footerButton}>
                        <TouchableOpacity activeOpacity={0.7} onPress={openPostDetails}>
                            <Icon color={theme.colors.textLight} name={'comment'} size={24} />
                        </TouchableOpacity>
                        <Text style={styles.count}>{item?.comments[0]?.count}</Text>
                    </View>
                    <View style={styles.footerButton}>
                        {loading ? (
                            <Loading size={'small'} />
                        ) : (
                            <TouchableOpacity activeOpacity={0.7} onPress={onShare}>
                                <Icon color={theme.colors.rose} name={'share'} size={24} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    actions: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 18,
    },
    container: {
        backgroundColor: 'white',
        borderColor: theme.colors.gray,
        borderCurve: 'continuous',
        borderRadius: theme.radius.xxl * 1.1,
        borderWidth: 0.5,
        gap: 10,
        marginBottom: 15,
        padding: 10,
        paddingVertical: 12,
        shadowColor: '#000000',
    },
    content: {
        gap: 10,
    },
    count: {
        color: theme.colors.text,
        fontSize: hp(1.8),
    },
    footer: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 15,
    },
    footerButton: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 4,
        marginLeft: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    postBody: {
        marginLeft: 5,
    },
    postMedia: {
        borderCurve: 'continuous',
        borderRadius: theme.radius.xl,
        height: hp(40),
        width: '100%',
    },
    postTime: {
        color: theme.colors.textLight,
        fontSize: hp(1.4),
        fontWeight: theme.fonts.medium,
    },
    userInfo: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    username: {
        color: theme.colors.textDark,
        fontSize: hp(1.4),
        fontWeight: theme.fonts.medium,
    },
});

export default PostCard;
