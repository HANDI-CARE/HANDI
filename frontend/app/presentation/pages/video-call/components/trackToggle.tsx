/*
 * 25.08.02 kykint
 * https://github.com/livekit/components-js 의 컴포넌트를 기반으로 제작함
 */

import type {
  CaptureOptionsBySource,
  ToggleSource,
} from "@livekit/components-core";
import {
  CameraDisabledIcon,
  CameraIcon,
  MicDisabledIcon,
  MicIcon,
  ScreenShareIcon,
  ScreenShareStopIcon,
  useTrackToggle,
} from "@livekit/components-react";
import { Button, type ButtonProps } from "antd";
import { Track, type TrackPublishOptions } from "livekit-client";
import * as React from "react";

/** @public */
export interface TrackToggleProps<T extends ToggleSource>
  extends Omit<ButtonProps, "onChange"> {
  source: T;
  showIcon?: boolean;
  initialState?: boolean;
  /**
   * Function that is called when the enabled state of the toggle changes.
   * The second function argument `isUserInitiated` is `true` if the change was initiated by a user interaction, such as a click.
   */
  onChange?: (enabled: boolean, isUserInitiated: boolean) => void;
  captureOptions?: CaptureOptionsBySource<T>;
  publishOptions?: TrackPublishOptions;
  onDeviceError?: (error: Error) => void;
}

/**
 * With the `TrackToggle` component it is possible to mute and unmute your camera and microphone.
 * The component uses an html button element under the hood so you can treat it like a button.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <TrackToggle source={Track.Source.Microphone} />
 *   <TrackToggle source={Track.Source.Camera} />
 * </LiveKitRoom>
 * ```
 * @public
 */
export const CustomTrackToggle: <T extends ToggleSource>(
  props: TrackToggleProps<T> & React.RefAttributes<HTMLButtonElement>,
) => React.ReactNode = /* @__PURE__ */ React.forwardRef(function TrackToggle<
  T extends ToggleSource,
>(
  { showIcon, type, color, ...props }: TrackToggleProps<T>,
  ref: React.ForwardedRef<HTMLButtonElement>,
) {
  // useTrackToggle에 전달할 props에서 Ant Design Button 전용 속성들을 제거
  const trackToggleProps = {
    ...props,
    type: "button" as const,
  };

  const { buttonProps, enabled } = useTrackToggle(trackToggleProps);
  const [isClient, setIsClient] = React.useState(false);
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // buttonProps에서 HTML button 전용 속성들을 제거하고 Ant Design Button에 맞는 props만 사용
  const {
    type: buttonType,
    color: buttonColor,
    ...restButtonProps
  } = buttonProps;

  delete restButtonProps.className;

  return (
    isClient && (
      <Button ref={ref} type={type} {...restButtonProps}>
        {(showIcon ?? true) && getSourceIcon(props.source, enabled)}
        {props.children}
      </Button>
    )
  );
});

export function getSourceIcon(source: Track.Source, enabled: boolean) {
  switch (source) {
    case Track.Source.Microphone:
      return enabled ? <MicIcon /> : <MicDisabledIcon />;
    case Track.Source.Camera:
      return enabled ? <CameraIcon /> : <CameraDisabledIcon />;
    case Track.Source.ScreenShare:
      return enabled ? <ScreenShareStopIcon /> : <ScreenShareIcon />;
    default:
      return undefined;
  }
}
