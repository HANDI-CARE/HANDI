/*
 * 25.08.02 kykint
 * https://github.com/livekit/components-js 의 컴포넌트를 기반으로 제작함
 */

import {
  ParticipantTile,
  RoomAudioRenderer,
  TrackLoop,
  TrackRefContext,
  useRoomContext,
  useTracks,
} from "@livekit/components-react";
import "@livekit/components-styles";
import {
  Alert,
  Button,
  Card,
  ConfigProvider,
  Descriptions,
  Form,
  Space,
  Spin,
  Typography,
} from "antd";
import dayjs from "dayjs";
import {
  ConnectionState as LiveKitConnectionState,
  RoomEvent,
  Track,
} from "livekit-client";
import { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useGetMeeting } from "~/features/hospital/application/hooks/useHospitals";
import { AppLayout } from "~/presentation/components/templates/AppLayout";
import { useUserStore } from "~/presentation/stores/userStore";
import { useVideoCallStore } from "~/presentation/stores/videoCallStore";
import { DEFAULT_LIVEKIT_URL } from "~/shared/constants/url";
import { httpClient } from "~/shared/infrastructure/api/httpClient";
import { CustomControlBar } from "./components/CustomControlBar";

import "./VideoCall.module.css";

const { Title, Text } = Typography;

const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL ?? DEFAULT_LIVEKIT_URL;

export default function VideoCall() {
  const room = useRoomContext();

  const { user } = useUserStore();
  const { roomName } = useParams<{ roomName?: string }>();
  const navigate = useNavigate();

  if (roomName === undefined) {
    throw new Error("Room name is required");
  }

  const videoCallState = useVideoCallStore();

  const [isRoomEnded, setIsRoomEnded] = useState(false);

  const { data: meetingData, isLoading: isMeetingLoading } = useGetMeeting(
    Number(roomName)
  );

  const joinRoom = useCallback(async () => {
    try {
      if (user?.name === undefined) {
        window.alert("User name is required");
        throw new Error("User name is required");
      }
      const token = await getToken(roomName, user?.name);
      videoCallState.setToken(token);
      videoCallState.setConnectionState(LiveKitConnectionState.Connecting);
      room.on(RoomEvent.Disconnected, () => {
        videoCallState.setConnectionState(LiveKitConnectionState.Disconnected);
        setIsRoomEnded(true);
      });
      await room.connect(LIVEKIT_URL, token);
      videoCallState.setConnectionState(LiveKitConnectionState.Connected);
      try {
        await startRecording(roomName);
      } catch (error) {
        // 에러 아님!! 이미 들어가 있으면 에러가 날 수 있음
      }
    } catch (error) {
      console.log(
        "There was an error connecting to the room:",
        (error as Error).message
      );
      room.removeAllListeners();
      await room.disconnect(true);
      videoCallState.setConnectionState(LiveKitConnectionState.Disconnected);
    }
  }, [room]);

  const getToken = useCallback(
    async (roomName: string, participantName: string) => {
      const response = await httpClient.post("/api/v1/video/token", {
        roomName: roomName,
        participantName: participantName,
      });

      return response.data.result.token;
    },
    []
  );

  const startRecording = useCallback(async (roomName: string) => {
    await httpClient.post("/api/v1/video/start", {
      roomName: roomName,
    });
  }, []);

  const renderMeetingInfo = useCallback(() => {
    if (!meetingData) {
      console.warn("Meeting data is null");
      return <></>;
    }
    return (
      <Descriptions
        bordered
        column={{
          xs: 1,
          sm: 1,
          lg: 3,
        }}
        size="small"
        title="상담 정보"
      >
        <Descriptions.Item label="제목">{meetingData.title}</Descriptions.Item>
        <Descriptions.Item label="상담 시간">
          {dayjs(meetingData.meetingTime).locale("ko").format("YYYY-MM-DD")}
          <br />
          {meetingData.meetingTime.toLocaleString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })}
        </Descriptions.Item>
        <Descriptions.Item label="유형">
          {meetingData.meetingType === "withDoctor" ? "병원 상담" : "일반 상담"}
        </Descriptions.Item>
        <Descriptions.Item label="간호사">
          {meetingData.nurse?.name}
        </Descriptions.Item>
        <Descriptions.Item label="보호자">
          {meetingData.guardian?.name}
        </Descriptions.Item>
        <Descriptions.Item label="시니어">
          {meetingData.senior?.name}
        </Descriptions.Item>
      </Descriptions>
    );
  }, [meetingData]);

  return (
    <AppLayout>
      <ConfigProvider>
        {videoCallState.connectionState === LiveKitConnectionState.Connected ? (
          <div
            className="flex flex-col justify-center items-center"
            data-lk-theme="default"
            style={{
              height: "80vh",
              gap: "1rem",
            }}
          >
            <Card
              style={{
                maxWidth: "768px",
              }}
            >
              {renderMeetingInfo()}
            </Card>
            <RoomAudioRenderer />
            <Stage />
            <CustomControlBar variation="minimal" />
          </div>
        ) : (
          // 통화 시작 전 or 종료 후
          <div className="h-full flex flex-col justify-center pb-24">
            <Card
              title={isRoomEnded ? "통화 종료" : undefined}
              className="w-full"
            >
              {isRoomEnded ? (
                // 통화 종류 후 화면
                <Space
                  direction="vertical"
                  size="large"
                  style={{ width: "100%" }}
                >
                  <Alert
                    message="통화가 종료되었습니다."
                    type="info"
                    showIcon
                  />
                  <Button onClick={() => navigate(-1)} size="large" block>
                    뒤로가기
                  </Button>
                </Space>
              ) : (
                <Space
                  direction="vertical"
                  size="large"
                  style={{ width: "100%" }}
                >
                  {isMeetingLoading ? (
                    <div className="w-full flex flex-row justify-center">
                      <Spin size="large" tip="상담 정보를 불러오는 중..." />
                    </div>
                  ) : (
                    meetingData && renderMeetingInfo()
                  )}
                  <Alert
                    message="참여 시 바로 통화가 시작됩니다. 마이크/카메라 설정을 확인해주세요."
                    type="warning"
                    showIcon
                  />
                  <Form
                    layout="vertical"
                    onFinish={joinRoom}
                    initialValues={{
                      participantName: user?.name,
                      roomName: roomName,
                    }}
                  >
                    <Form.Item>
                      <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        block
                        disabled={!roomName}
                      >
                        참가하기
                      </Button>
                    </Form.Item>
                  </Form>
                </Space>
              )}
            </Card>
          </div>
        )}
      </ConfigProvider>
    </AppLayout>
  );
}

function Stage() {
  const cameraTracks = useTracks([Track.Source.Camera]);
  const screenShareTrackRef = useTracks([Track.Source.ScreenShare])[0];

  return (
    <div className="track-container grid grid-cols-1 lg:grid-cols-2 gap-4 place-items-center-safe">
      {screenShareTrackRef && (
        <ParticipantTile
          className=""
          style={{
            width: "100%",
            aspectRatio: "16/9",
            minWidth: "320px",
            maxWidth: "768px",
          }}
          trackRef={screenShareTrackRef}
        />
      )}
      <TrackLoop tracks={cameraTracks}>
        <TrackRefContext.Consumer>
          {(trackRef) => (
            <ParticipantTile
              style={{
                width: "100%",
                aspectRatio: "16/9",
                minWidth: "320px",
                maxWidth: "768px",
              }}
              trackRef={trackRef}
            />
          )}
        </TrackRefContext.Consumer>
      </TrackLoop>
    </div>
  );
}
