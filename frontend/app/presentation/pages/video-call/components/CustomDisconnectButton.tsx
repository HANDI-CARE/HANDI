/*
 * 25.08.02 kykint
 * https://github.com/livekit/components-js 의 컴포넌트를 기반으로 제작함
 */

import { useDisconnectButton, useRoomContext } from "@livekit/components-react";
import { Button } from "antd";
import * as React from "react";
import { httpClient } from "~/shared/infrastructure/api/httpClient";

/** @public */
export interface DisconnectButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  stopTracks?: boolean;
}

/**
 * The `DisconnectButton` is a basic html button with the added ability to disconnect from a LiveKit room.
 * Normally this is the big red button that allows end users to leave the video or audio call.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <DisconnectButton>Leave room</DisconnectButton>
 * </LiveKitRoom>
 * ```
 * @public
 */
export const CustomDisconnectButton: (
  props: DisconnectButtonProps & React.RefAttributes<HTMLButtonElement>
) => React.ReactNode = /* @__PURE__ */ React.forwardRef<
  HTMLButtonElement,
  DisconnectButtonProps
>(function DisconnectButton(props: DisconnectButtonProps, ref) {
  const { buttonProps } = useDisconnectButton(props);
  const room = useRoomContext();

  const { onClick, disabled } = buttonProps;

  const handleDisconnectClick = React.useCallback(async () => {
    onClick?.();
    // 통화 종료 버튼을 누르면 강제로 녹음 종료
    await httpClient.post("/api/v1/video/stop", {
      roomName: room.name,
    });
  }, [onClick, room.name]);

  return (
    <Button
      ref={ref}
      onClick={handleDisconnectClick}
      disabled={disabled}
      danger
    >
      {props.children}
    </Button>
  );
});
