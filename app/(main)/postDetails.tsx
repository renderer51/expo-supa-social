import React, { FC, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import Icon from '@/assets/icons';
import { CommentItem, Loading, PostCard, TextField } from '@/components';
import { theme } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { hp, wp } from '@/helpers';
import { supabase } from '@/lib/supabase';
import {
    createNotification,
    createPostComment,
    fetchPostDetails,
    getUserData,
    removePost,
    removePostComment,
} from '@/services';
import { IPost } from '@/types';

const PostDetails: FC = () => {
    const { user } = useAuth();
    const { commentId, postId } = useLocalSearchParams();
    const router = useRouter();

    const commentRef = useRef<string>('');
    const inputRef = useRef<TextInput>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [post, setPost] = useState<any>(null);
    const [startLoading, setStartLoading] = useState<boolean>(true);

    const onNewComment = async () => {
        if (!commentRef.current) {
            return;
        }

        let data = {
            postId: post?.id,
            text: commentRef.current,
            userId: user?.id,
        };

        /** Create comment */
        setLoading(true);
        const res = await createPostComment(data);
        setLoading(false);

        if (res.success) {
            /** Send notification later */
            if (user?.id !== post?.id) {
                let notify = {
                    data: JSON.stringify({ postId: post.id, commentId: res?.data?.id }),
                    receiverId: post.userId,
                    senderId: user?.id,
                    title: 'Commented on your post',
                };
                createNotification(notify);
            }

            inputRef.current?.clear();
            commentRef.current = '';
        } else {
            Alert.alert('Comment', res.msg);
        }
    };

    const getPostDetail = async () => {
        /** Fetch post details here */
        let res = await fetchPostDetails(postId as string);

        if (res.success) {
            setPost(res.data);
        }

        setStartLoading(false);
    };

    const onDeleteComment = async (comment: any) => {
        let res = await removePostComment(comment?.id);

        if (res.success) {
            setPost((prev: any) => {
                let updatePost = { ...prev };
                updatePost.comments = updatePost.comments.filter((e: any) => e.id !== comment.id);

                return updatePost;
            });
        } else {
            Alert.alert('Comment', res.msg);
        }
    };

    const handleNewComment = async (payload: any) => {
        if (payload.new) {
            let newComment = { ...payload.new };
            let res = await getUserData(newComment.userId);
            newComment.user = res.success ? res.data : {};

            setPost((prev: any) => {
                return {
                    ...prev,
                    comments: [newComment, ...prev.comments],
                };
            });
        }
    };

    const onDeletePost = async (item: IPost) => {
        let res = await removePost(item.id);
        if (res.success) {
            router.back();
        } else {
            Alert.alert('Post', res.msg);
        }
    };

    const onEditPost = (item: IPost) => {
        router.back();
        router.push({ pathname: '/(main)/newPost', params: { ...item } });
    };

    useEffect(() => {
        let commentChannel = supabase
            .channel('comments')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'comments', filter: `postId=eq.${postId}` },
                handleNewComment,
            )
            .subscribe();

        getPostDetail();

        return () => {
            supabase.removeChannel(commentChannel);
        };
    }, []);

    if (startLoading) {
        return (
            <View style={styles.center}>
                <Loading />
            </View>
        );
    }

    if (!post) {
        return (
            <View style={[styles.center, { justifyContent: 'flex-start', marginTop: 100 }]}>
                <Text style={styles.notFound}>{'Post not found !'}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
                <PostCard
                    currentUser={user}
                    hasShadow={false}
                    item={{ ...post, comments: [{ count: post.comments.length }] }}
                    onDelete={onDeletePost}
                    onEdit={onEditPost}
                    router={router}
                    showDelete={true}
                    showMoreIcon={false}
                />

                {/** Comment Input */}
                <View style={styles.inputContainer}>
                    <TextField
                        containerStyle={{ borderRadius: theme.radius.xl, flex: 1, height: hp(6.2) }}
                        onChangeText={(value) => (commentRef.current = value)}
                        placeholder={'Type comment...'}
                        placeholderTextColor={theme.colors.textLight}
                        ref={inputRef}
                    />

                    {loading ? (
                        <View style={styles.loading}>
                            <Loading size={'small'} />
                        </View>
                    ) : (
                        <TouchableOpacity activeOpacity={0.7} onPress={onNewComment} style={styles.sendIcon}>
                            <Icon color={theme.colors.primaryDark} name={'send'} />
                        </TouchableOpacity>
                    )}
                </View>

                {/** Comment List */}
                <View style={{ gap: 17, marginVertical: 15 }}>
                    {post?.comments?.map((item: any) => (
                        <CommentItem
                            canDelete={item.userId === user?.id || user?.id === post.userId}
                            comment={item}
                            highlight={item.id === commentId}
                            key={item?.id?.toString()}
                            onDelete={onDeleteComment}
                        />
                    ))}

                    {post?.comments?.length === 0 && (
                        <Text style={{ color: theme.colors.text, marginLeft: 5 }}>{'Be first to comment!'}</Text>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    center: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    container: {
        backgroundColor: 'white',
        flex: 1,
        paddingVertical: wp(7),
    },
    inputContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 10,
    },
    list: {
        paddingHorizontal: wp(4),
    },
    loading: {
        alignItems: 'center',
        height: hp(5.8),
        justifyContent: 'center',
        transform: [{ scale: 1.3 }],
        width: hp(5.8),
    },
    notFound: {
        color: theme.colors.text,
        fontSize: hp(2.5),
        fontWeight: theme.fonts.medium,
    },
    sendIcon: {
        alignItems: 'center',
        borderColor: theme.colors.primary,
        borderCurve: 'continuous',
        borderRadius: theme.radius.lg,
        borderWidth: 0.8,
        height: hp(5.8),
        justifyContent: 'center',
        width: hp(5.8),
    },
});

export default PostDetails;
