import React, { FC, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import Icon from '@/assets/icons';
import { Avatar, Loading, PostCard, ScreenWrapper } from '@/components';
import { theme } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { hp, wp } from '@/helpers';
import { fetchPosts, getUserData } from '@/services';
import { IPost } from '@/types';

let limit = 0;
const Home: FC = () => {
    const router = useRouter();
    const { user } = useAuth();

    const [hasMore, setHasMore] = useState<boolean>(true);
    const [posts, setPosts] = useState<IPost[]>([]);
    const [notificationCount, setNotificationCount] = useState(0);

    const getPosts = async () => {
        limit = limit + 10;

        /** Call the api here */
        if (!hasMore) {
            return null;
        }
        let res = await fetchPosts(limit);

        if (res.success) {
            if (posts.length === res.data?.length) {
                setHasMore(false);
            }
            setPosts(Array(res.data) ? (res.data as IPost[]) : []);
        }
    };

    const handlePostEvent = async (payload: any) => {
        if (payload.eventType === 'INSERT' && payload?.new?.id) {
            let newPost = { ...payload.new };
            let res = await getUserData(newPost.userId);
            newPost.postLikes = [];
            newPost.comments = [{ count: 0 }];
            newPost.user = res.success ? res.data : {};

            setPosts((prev) => [newPost, ...prev]);
        }
        if (payload.eventType === 'DELETE' && payload?.old?.id) {
            setPosts((prev) => prev.filter((e) => e.id !== payload?.old?.id));
        }
        if (payload.eventType === 'UPDATE' && payload?.new?.id) {
            setPosts((prev) =>
                prev.map((e) => {
                    if (e.id === payload?.new?.id) {
                        e.body = payload?.new?.body;
                        e.file = payload?.new?.file;
                    }

                    return e;
                }),
            );
        }
    };

    const handleNewNotification = (payload: any) => {
        if (payload.eventType === 'INSERT' && payload?.new?.id) {
            setNotificationCount((prev) => prev + 1);
        }
    };

    useEffect(() => {
        let postChannel = supabase
            .channel('posts')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, handlePostEvent)
            .subscribe();

        let notificationChannel = supabase
            .channel('notifications')
            .on(
                'postgres_changes',
                { event: 'INSERT', filter: `receiverId=eq.${user?.id}`, schema: 'public', table: 'notifications' },
                handleNewNotification,
            )
            .subscribe();

        return () => {
            supabase.removeChannel(postChannel);
            supabase.removeChannel(notificationChannel);
        };
    }, []);

    return (
        <ScreenWrapper bg={'white'}>
            {/** Header */}
            <View style={styles.header}>
                <Text style={styles.title}>{'LinkedUp'}</Text>

                <View style={styles.icons}>
                    <Pressable
                        onPress={() => {
                            setNotificationCount(0);
                            router.push('/notifications');
                        }}
                    >
                        <Icon color={theme.colors.text} name={'heart'} size={hp(3.2)} strokeWidth={2} />
                        {notificationCount > 0 && (
                            <View style={styles.pill}>
                                <Text style={styles.pillText}>{notificationCount}</Text>
                            </View>
                        )}
                    </Pressable>
                    <Pressable onPress={() => router.push('/newPost')}>
                        <Icon color={theme.colors.text} name={'plus'} size={hp(3.2)} strokeWidth={2} />
                    </Pressable>
                    <Pressable onPress={() => router.push('/profile')}>
                        <Avatar rounded={theme.radius.sm} size={hp(4.3)} style={{ borderWidth: 2 }} uri={user?.image} />
                    </Pressable>
                </View>
            </View>

            {/** Posts */}
            <FlatList
                ListFooterComponent={
                    hasMore ? (
                        <View style={{ marginVertical: posts.length === 0 ? 200 : 30 }}>
                            <Loading />
                        </View>
                    ) : (
                        <View style={{ marginVertical: 30 }}>
                            <Text style={styles.noPosts}>{'No more posts'}</Text>
                        </View>
                    )
                }
                contentContainerStyle={styles.listStyle}
                data={posts}
                keyExtractor={(item) => `Post-${item.id}`}
                onEndReached={() => getPosts()}
                onEndReachedThreshold={0}
                renderItem={({ item }) => <PostCard currentUser={user} item={item} router={router} />}
                showsVerticalScrollIndicator={false}
            />
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
