import React, { FC } from 'react';
import { View } from 'react-native';

import { Loading } from '@/components';

const index: FC = () => {
    return (
        <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
            <Loading />
        </View>
    );
};

export default index;
``;
