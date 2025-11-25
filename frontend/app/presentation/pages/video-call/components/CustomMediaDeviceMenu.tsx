/*
 * 25.08.02 kykint
 * https://github.com/livekit/components-js 에서 가져옴
 */

import { MoreOutlined } from "@ant-design/icons";
import {
  computeMenuPosition,
  log,
  wasClickOutside,
} from "@livekit/components-core";
import { Button } from "antd";
import type { LocalAudioTrack, LocalVideoTrack } from "livekit-client";
import * as React from "react";
import { CustomMediaDeviceSelect } from "./CustomMediaDeviceSelect";

/** @public */
export interface MediaDeviceMenuProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  kind?: MediaDeviceKind;
  initialSelection?: string;
  onActiveDeviceChange?: (kind: MediaDeviceKind, deviceId: string) => void;
  tracks?: Partial<
    Record<MediaDeviceKind, LocalAudioTrack | LocalVideoTrack | undefined>
  >;
  /**
   * this will call getUserMedia if the permissions are not yet given to enumerate the devices with device labels.
   * in some browsers multiple calls to getUserMedia result in multiple permission prompts.
   * It's generally advised only flip this to true, once a (preview) track has been acquired successfully with the
   * appropriate permissions.
   *
   * @see {@link PreJoin}
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices | MDN enumerateDevices}
   */
  requestPermissions?: boolean;
}

/**
 * The `MediaDeviceMenu` component is a button that opens a menu that lists
 * all media devices and allows the user to select them.
 *
 * @remarks
 * This component is implemented with the `MediaDeviceSelect` LiveKit components.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <MediaDeviceMenu />
 * </LiveKitRoom>
 * ```
 * @public
 */
export function CustomMediaDeviceMenu({
  kind,
  initialSelection,
  onActiveDeviceChange,
  tracks,
  requestPermissions = false,
  ...props
}: MediaDeviceMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [devices, setDevices] = React.useState<MediaDeviceInfo[]>([]);
  const [updateRequired, setUpdateRequired] = React.useState<boolean>(true);
  const [needPermissions, setNeedPermissions] =
    React.useState(requestPermissions);

  const handleActiveDeviceChange = (
    kind: MediaDeviceKind,
    deviceId: string,
  ) => {
    log.debug("handle device change");
    setIsOpen(false);
    onActiveDeviceChange?.(kind, deviceId);
  };

  const button = React.useRef<HTMLButtonElement>(null);
  const tooltip = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    if (isOpen) {
      setNeedPermissions(true);
    }
  }, [isOpen]);

  React.useLayoutEffect(() => {
    let cleanup: ReturnType<typeof computeMenuPosition> | undefined;
    if (button.current && tooltip.current && (devices || updateRequired)) {
      cleanup = computeMenuPosition(button.current, tooltip.current, (x, y) => {
        if (tooltip.current) {
          Object.assign(tooltip.current.style, {
            left: `${x}px`,
            top: `${y}px`,
          });
        }
      });
    }
    setUpdateRequired(false);
    return () => {
      cleanup?.();
    };
  }, [button, tooltip, devices, updateRequired]);

  const handleClickOutside = React.useCallback(
    (event: MouseEvent) => {
      if (!tooltip.current) {
        return;
      }
      if (event.target === button.current) {
        return;
      }
      if (isOpen && wasClickOutside(tooltip.current, event)) {
        setIsOpen(false);
      }
    },
    [isOpen, tooltip, button],
  );

  React.useEffect(() => {
    document.addEventListener<"click">("click", handleClickOutside);
    return () => {
      document.removeEventListener<"click">("click", handleClickOutside);
    };
  }, [handleClickOutside]);

  return (
    <>
      <Button
        aria-pressed={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        ref={button}
      >
        <>
          <MoreOutlined />
          {props.children}
        </>
      </Button>
      {/** only render when enabled in order to make sure that the permissions are requested only if the menu is enabled */}
      {!props.disabled && (
        <div
          className="lk-device-menu"
          ref={tooltip}
          style={{
            display: isOpen ? "block" : "none",
            backgroundColor: "white",
            borderColor: "#d9d9d9",
          }}
        >
          {kind ? (
            <CustomMediaDeviceSelect
              initialSelection={initialSelection}
              onActiveDeviceChange={(deviceId) =>
                handleActiveDeviceChange(kind, deviceId)
              }
              onDeviceListChange={setDevices}
              kind={kind}
              track={tracks?.[kind]}
              requestPermissions={needPermissions}
            />
          ) : (
            <>
              <div className="lk-device-menu-heading">Audio inputs</div>
              <CustomMediaDeviceSelect
                kind="audioinput"
                onActiveDeviceChange={(deviceId) =>
                  handleActiveDeviceChange("audioinput", deviceId)
                }
                onDeviceListChange={setDevices}
                track={tracks?.audioinput}
                requestPermissions={needPermissions}
              />
              <div className="lk-device-menu-heading">Video inputs</div>
              <CustomMediaDeviceSelect
                kind="videoinput"
                onActiveDeviceChange={(deviceId) =>
                  handleActiveDeviceChange("videoinput", deviceId)
                }
                onDeviceListChange={setDevices}
                track={tracks?.videoinput}
                requestPermissions={needPermissions}
              />
            </>
          )}
        </div>
      )}
    </>
  );
}
