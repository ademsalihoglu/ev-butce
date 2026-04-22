declare module 'react-native-vector-icons/MaterialCommunityIcons' {
  import type { ComponentType } from 'react';
  import type { TextProps, TextStyle, StyleProp } from 'react-native';

  export interface IconProps extends TextProps {
    name: string;
    size?: number;
    color?: string;
    style?: StyleProp<TextStyle>;
  }

  const Icon: ComponentType<IconProps>;
  export default Icon;
}

declare module 'react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf' {
  const src: string;
  export default src;
}
