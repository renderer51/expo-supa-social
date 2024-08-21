import React, { FC } from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

const PostDetails: FC = () => {
    const { postId } = useLocalSearchParams();

    return (
        <View>
            <Text>PostDetails</Text>
        </View>
    );
};

export default PostDetails;
