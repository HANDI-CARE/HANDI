/*
 * 25.08.02 kykint
 * https://github.com/livekit/components-js 의 컴포넌트를 기반으로 제작함
 */

import {
  MessageOutlined,
  SettingOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { supportsScreenSharing } from "@livekit/components-core";
import {
  ChatToggle,
  StartMediaButton,
  useLocalParticipantPermissions,
  useMaybeLayoutContext,
  usePersistentUserChoices,
} from "@livekit/components-react";
import { Space } from "antd";
import { Track } from "livekit-client";
import * as React from "react";
import { useMediaQuery } from "~/features/video-call/application/hooks/useMediaQuery";
import { mergeProps } from "~/shared/utils/mergeProps";
import { CustomDisconnectButton } from "./CustomDisconnectButton";
import { CustomMediaDeviceMenu } from "./CustomMediaDeviceMenu";
import { SettingsMenuToggle } from "./SettingsMenuToggle";
import { CustomTrackToggle } from "./trackToggle";

/** @public */
export type ControlBarControls = {
  microphone?: boolean;
  camera?: boolean;
  chat?: boolean;
  screenShare?: boolean;
  leave?: boolean;
  settings?: boolean;
};

const trackSourceToProtocol = (source: Track.Source) => {
  // NOTE: this mapping avoids importing the protocol package as that leads to a significant bundle size increase
  switch (source) {
    case Track.Source.Camera:
      return 1;
    case Track.Source.Microphone:
      return 2;
    case Track.Source.ScreenShare:
      return 3;
    default:
      return 0;
  }
};

/** @public */
export interface ControlBarProps extends React.HTMLAttributes<HTMLDivElement> {
  onDeviceError?: (error: { source: Track.Source; error: Error }) => void;
  variation?: "minimal" | "verbose" | "textOnly";
  controls?: ControlBarControls;
  /**
   * If `true`, the user's device choices will be persisted.
   * This will enable the user to have the same device choices when they rejoin the room.
   * @defaultValue true
   * @alpha
   */
  saveUserChoices?: boolean;
}

/**
 * The `ControlBar` prefab gives the user the basic user interface to control their
 * media devices (camera, microphone and screen share), open the `Chat` and leave the room.
 *
 * @remarks
 * This component is build with other LiveKit components like `TrackToggle`,
 * `DeviceSelectorButton`, `DisconnectButton` and `StartAudio`.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <ControlBar />
 * </LiveKitRoom>
 * ```
 * @public
 */
export function CustomControlBar({
  variation,
  controls,
  saveUserChoices = true,
  onDeviceError,
  ...props
}: ControlBarProps) {
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const layoutContext = useMaybeLayoutContext();
  React.useEffect(() => {
    if (layoutContext?.widget.state?.showChat !== undefined) {
      setIsChatOpen(layoutContext?.widget.state?.showChat);
    }
  }, [layoutContext?.widget.state?.showChat]);
  const isTooLittleSpace = useMediaQuery(
    `(max-width: ${isChatOpen ? 1000 : 760}px)`,
  );

  const defaultVariation = isTooLittleSpace ? "minimal" : "verbose";
  variation ??= defaultVariation;

  const visibleControls = { leave: true, ...controls };

  const localPermissions = useLocalParticipantPermissions();

  if (!localPermissions) {
    visibleControls.camera = false;
    visibleControls.chat = false;
    visibleControls.microphone = false;
    visibleControls.screenShare = false;
  } else {
    const canPublishSource = (source: Track.Source) => {
      return (
        localPermissions.canPublish &&
        (localPermissions.canPublishSources.length === 0 ||
          localPermissions.canPublishSources.includes(
            trackSourceToProtocol(source),
          ))
      );
    };
    visibleControls.camera ??= canPublishSource(Track.Source.Camera);
    visibleControls.microphone ??= canPublishSource(Track.Source.Microphone);
    visibleControls.screenShare ??= canPublishSource(Track.Source.ScreenShare);
    visibleControls.chat ??= localPermissions.canPublishData && controls?.chat;
  }

  const showIcon = React.useMemo(
    () => variation === "minimal" || variation === "verbose",
    [variation],
  );
  const showText = React.useMemo(
    () => variation === "textOnly" || variation === "verbose",
    [variation],
  );

  const browserSupportsScreenSharing = supportsScreenSharing();

  const [isScreenShareEnabled, setIsScreenShareEnabled] = React.useState(false);

  const onScreenShareChange = React.useCallback(
    (enabled: boolean) => {
      setIsScreenShareEnabled(enabled);
    },
    [setIsScreenShareEnabled],
  );

  const htmlProps = mergeProps({ className: "lk-control-bar" }, props);

  const {
    saveAudioInputEnabled,
    saveVideoInputEnabled,
    saveAudioInputDeviceId,
    saveVideoInputDeviceId,
  } = usePersistentUserChoices({ preventSave: !saveUserChoices });

  const microphoneOnChange = React.useCallback(
    (enabled: boolean, isUserInitiated: boolean) =>
      isUserInitiated ? saveAudioInputEnabled(enabled) : null,
    [saveAudioInputEnabled],
  );

  const cameraOnChange = React.useCallback(
    (enabled: boolean, isUserInitiated: boolean) =>
      isUserInitiated ? saveVideoInputEnabled(enabled) : null,
    [saveVideoInputEnabled],
  );

  return (
    <div {...htmlProps}>
      {visibleControls.microphone && (
        <Space.Compact>
          <CustomTrackToggle
            source={Track.Source.Microphone}
            showIcon={showIcon}
            onChange={microphoneOnChange}
            onDeviceError={(error) =>
              onDeviceError?.({ source: Track.Source.Microphone, error })
            }
          >
            {showText && "마이크"}
          </CustomTrackToggle>
          <div className="lk-button-group-menu">
            <CustomMediaDeviceMenu
              kind="audioinput"
              onActiveDeviceChange={(_kind, deviceId) =>
                saveAudioInputDeviceId(deviceId ?? "default")
              }
            />
          </div>
        </Space.Compact>
      )}
      {visibleControls.camera && (
        <div className="lk-button-group">
          <Space.Compact>
            <CustomTrackToggle
              source={Track.Source.Camera}
              showIcon={showIcon}
              onChange={cameraOnChange}
              onDeviceError={(error) =>
                onDeviceError?.({ source: Track.Source.Camera, error })
              }
            >
              {showText && "Camera"}
            </CustomTrackToggle>
            <div className="lk-button-group-menu">
              <CustomMediaDeviceMenu
                kind="videoinput"
                onActiveDeviceChange={(_kind, deviceId) =>
                  saveVideoInputDeviceId(deviceId ?? "default")
                }
              />
            </div>
          </Space.Compact>
        </div>
      )}
      {visibleControls.screenShare && browserSupportsScreenSharing && (
        <CustomTrackToggle
          source={Track.Source.ScreenShare}
          captureOptions={{ audio: true, selfBrowserSurface: "include" }}
          showIcon={showIcon}
          onChange={onScreenShareChange}
          onDeviceError={(error) =>
            onDeviceError?.({ source: Track.Source.ScreenShare, error })
          }
        >
          {showText &&
            (isScreenShareEnabled ? "Stop screen share" : "Share screen")}
        </CustomTrackToggle>
      )}
      {visibleControls.chat && (
        <ChatToggle>
          {showIcon && <MessageOutlined />}
          {showText && "Chat"}
        </ChatToggle>
      )}
      {visibleControls.settings && (
        <SettingsMenuToggle>
          {showIcon && <SettingOutlined />}
          {showText && "Settings"}
        </SettingsMenuToggle>
      )}
      {visibleControls.leave && (
        <CustomDisconnectButton>
          {showIcon && <StopOutlined />}
          {showText && "Leave"}
        </CustomDisconnectButton>
      )}
      <StartMediaButton />
    </div>
  );
}
