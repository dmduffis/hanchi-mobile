declare module "@iconscout/react-native-unicons/icons/*" {
  import type { ComponentType } from "react";

  type UniconProps = {
    color?: string;
    size?: string | number;
  };

  const Icon: ComponentType<UniconProps>;
  export default Icon;
}
