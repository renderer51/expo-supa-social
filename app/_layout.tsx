import React, { FC, useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { getUserData } from '@/services';
import { LogBox } from 'react-native';

LogBox.ignoreLogs(['Warning: TNodeChildrenRender', 'Warning: MemoizedTNodeRender', 'Warning: TRenderEngineProvider']);
const _layout = () => {
    return (
        <AuthProvider>
            <MainLayout />
        </AuthProvider>
    );
};

const MainLayout: FC = () => {
    const router = useRouter();
    const { setAuth, setUserData } = useAuth();

    const updateUserData = async (user: any, email?: string) => {
        let res = await getUserData(user.id);
        if (res.success) {
            if (res.data) {
                setUserData?.({ ...res.data, email });
            }
        }
    };

    useEffect(() => {
        supabase.auth.onAuthStateChange((_event, session) => {
            console.log('Session >>:', session?.user);

            if (session) {
                /** Set auth */
                /** Move to home screen */
                setAuth?.(session.user as any);
                updateUserData(session.user, session.user.email);
                router.replace('/home');
            } else {
                /** Set auth null */
                /** Move to welcome screen */
                setAuth?.(null);
                router.replace('/welcome');
            }
        });
    }, []);

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name={'(main)/postDetails'} options={{ presentation: 'modal' }} />
        </Stack>
    );
};

export default _layout;
