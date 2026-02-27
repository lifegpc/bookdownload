declare module '*.css' {
    const content: { [className: string]: string };
    export = content;
}

declare module "*.svg" {
  import { ReactElement, SVGProps } from "react";
  const content: (props: SVGProps<SVGElement>) => ReactElement;
  export default content;
}
