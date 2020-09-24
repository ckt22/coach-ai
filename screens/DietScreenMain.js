import * as React from 'react';
import { Button, Text, View } from 'react-native';

export default function DietScreenMain({ navigation }) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Diet Screen Main</Text>
        <Button
          title="Go to Details"
          onPress={() => navigation.navigate('Details')}
        />
      </View>
    );
  }