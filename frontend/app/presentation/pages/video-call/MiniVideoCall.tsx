/*
 * 25.08.02 kykint
 * https://github.com/livekit/components-js 의 컴포넌트를 기반으로 제작함
 */

import { ArrowLeftOutlined } from "@ant-design/icons";
import {
  ParticipantTile,
  RoomAudioRenderer,
  RoomName,
  useRoomContext,
  useTracks,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { ConfigProvider, theme } from "antd";
import {
  ConnectionState as LiveKitConnectionState,
  Track,
} from "livekit-client";
import { Link, useMatch } from "react-router";
import { useVideoCallStore } from "~/presentation/stores/videoCallStore";

export default function MiniVideoCall() {
  const room = useRoomContext();
  const match = useMatch("video-call/:roomName");
  const videoCallState = useVideoCallStore();
  const cameraTracks = useTracks([Track.Source.Camera]);

  if (
    !room ||
    videoCallState.connectionState !== LiveKitConnectionState.Connected ||
    match
  ) {
    return null;
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
      }}
    >
      <div className="relative shadow-md">
        <Link
          to={`/video-call/${room.name}`}
          className="absolute left-[0.25rem] top-[0.25rem] z-10 select-none"
          draggable={false}
        >
          <div className="lk-participant-metdata">
            <div className="lk-participant-metadata-item">
              <span className="lk-participant-name flex items-center gap-2">
                <ArrowLeftOutlined />
                <RoomName />
              </span>
            </div>
          </div>
        </Link>

        <div
          className="w-[20vw] aspect-video overflow-hidden"
          data-lk-theme="default"
        >
          <RoomAudioRenderer />
          {cameraTracks.length > 0 && (
            <div className="w-full h-full">
              <ParticipantTile
                trackRef={cameraTracks[0]}
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </div>
      </div>
    </ConfigProvider>
  );
}
