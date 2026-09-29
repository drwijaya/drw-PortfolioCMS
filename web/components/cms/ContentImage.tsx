import Image, {
  getImageProps as originalImageProps,
  type ImageProps,
} from "next/image";
import { forwardRef } from "react";
function privateProps(props: ImageProps) {
  return {
    ...props,
    unoptimized:
      props.unoptimized ||
      (typeof props.src === "string" && props.src.startsWith("/media/")),
  };
}
/** CMS assets enforce visibility on every request, including after unpublish. */
const ContentImage = forwardRef<HTMLImageElement, ImageProps>(
  function ContentImage(props, ref) {
    return <Image {...privateProps(props)} ref={ref} alt={props.alt} />;
  },
);
export default ContentImage;
export function getImageProps(props: ImageProps) {
  return originalImageProps(privateProps(props));
}
