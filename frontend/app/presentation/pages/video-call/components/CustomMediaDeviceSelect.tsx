/*
 * 25.08.02 kykint
 * https://github.com/livekit/components-js 의 컴포넌트를 기반으로 제작함
 */

import {
  useMaybeRoomContext,
  useMediaDeviceSelect,
} from "@livekit/components-react";
import { Radio } from "antd";
import {
  RoomEvent,
  type LocalAudioTrack,
  type LocalVideoTrack,
} from "livekit-client";
import * as React from "react";
import { mergeProps } from "~/shared/utils/mergeProps";

/** @public */
export interface MediaDeviceSelectProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onError"> {
  kind: MediaDeviceKind;
  onActiveDeviceChange?: (deviceId: string) => void;
  onDeviceListChange?: (devices: MediaDeviceInfo[]) => void;
  onDeviceSelectError?: (e: Error) => void;
  initialSelection?: string;
  /** will force the browser to only return the specified device
   * will call `onDeviceSelectError` with the error in case this fails
   */
  exactMatch?: boolean;
  track?: LocalAudioTrack | LocalVideoTrack;
  /**
   * this will call getUserMedia if the permissions are not yet given to enumerate the devices with device labels.
   * in some browsers multiple calls to getUserMedia result in multiple permission prompts.
   * It's generally advised only flip this to true, once a (preview) track has been acquired successfully with the
   * appropriate permissions.
   *
   * @see {@link MediaDeviceMenu}
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices | MDN enumerateDevices}
   */
  requestPermissions?: boolean;
  onError?: (e: Error) => void;
}

/**
 * The `MediaDeviceSelect` list all media devices of one kind.
 * Clicking on one of the listed devices make it the active media device.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <MediaDeviceSelect kind='audioinput' />
 * </LiveKitRoom>
 * ```
 * @public
 */
export const CustomMediaDeviceSelect: (
  props: MediaDeviceSelectProps & React.RefAttributes<HTMLDivElement>,
) => React.ReactNode = /* @__PURE__ */ React.forwardRef<
  HTMLDivElement,
  MediaDeviceSelectProps
>(function MediaDeviceSelect(
  {
    kind,
    initialSelection,
    onActiveDeviceChange,
    onDeviceListChange,
    onDeviceSelectError,
    exactMatch,
    track,
    requestPermissions,
    onError,
    ...props
  }: MediaDeviceSelectProps,
  ref,
) {
  const room = useMaybeRoomContext();
  const previousActiveDeviceId = React.useRef<string>("default");
  const handleError = React.useCallback(
    (e: Error) => {
      if (room) {
        // awkwardly emit the event from outside of the room, as we don't have other means to raise a MediaDeviceError
        room.emit(RoomEvent.MediaDevicesError, e);
      }
      onError?.(e);
    },
    [room, onError],
  );
  const { devices, activeDeviceId, setActiveMediaDevice, className } =
    useMediaDeviceSelect({
      kind,
      room,
      track,
      requestPermissions,
      onError: handleError,
    });
  React.useEffect(() => {
    if (initialSelection !== undefined) {
      setActiveMediaDevice(initialSelection);
    }
  }, [setActiveMediaDevice]);

  React.useEffect(() => {
    if (typeof onDeviceListChange === "function") {
      onDeviceListChange(devices);
    }
  }, [onDeviceListChange, devices]);

  React.useEffect(() => {
    if (activeDeviceId !== previousActiveDeviceId.current) {
      onActiveDeviceChange?.(activeDeviceId);
    }
    previousActiveDeviceId.current = activeDeviceId;
  }, [activeDeviceId]);

  const handleActiveDeviceChange = async (deviceId: string) => {
    try {
      await setActiveMediaDevice(deviceId, { exact: exactMatch ?? true });
    } catch (e) {
      if (e instanceof Error) {
        onDeviceSelectError?.(e);
      } else {
        throw e;
      }
    }
  };

  // Merge Props
  const mergedProps = React.useMemo(
    () => mergeProps(props, { className }, { className: "lk-list" }),
    [className, props],
  );

  const hasDefault = !!devices.find((info) =>
    info.label.toLowerCase().startsWith("default"),
  );

  function isActive(deviceId: string, activeDeviceId: string, index: number) {
    return (
      deviceId === activeDeviceId ||
      (!hasDefault && index === 0 && activeDeviceId === "default")
    );
  }

  // Radio options 생성
  const radioOptions = React.useMemo(
    () =>
      devices.map((device, index) => ({
        label: device.label,
        value: device.deviceId,
        disabled: false,
      })),
    [devices],
  );

  return (
    <div ref={ref} {...mergedProps}>
      <Radio.Group
        value={activeDeviceId}
        onChange={(e) => handleActiveDeviceChange(e.target.value)}
        options={radioOptions}
        optionType="default"
        size="large"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          padding: 8,
        }}
      />
    </div>
  );
});
