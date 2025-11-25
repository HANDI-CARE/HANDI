import {
  AudioOutlined,
  PhoneOutlined,
  UserOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import {
  Button as AntButton,
  Card as AntCard,
  Avatar,
  Col,
  Row,
  Tag,
} from "antd";
import { useState } from "react";
import { Card } from "../../components/atoms";
import { AppLayout } from "../../components/templates/AppLayout";

export default function VideoCall() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const startCall = () => {
    setIsCallActive(true);
  };

  const endCall = () => {
    setIsCallActive(false);
    setIsMuted(false);
    setIsVideoOff(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff);
  };

  if (isCallActive) {
    return (
      <AppLayout>
        <div className="h-[calc(100vh-80px)] bg-gray-900 relative">
          {/* 메인 비디오 영역 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-gray-800 rounded-lg w-full h-full max-w-4xl max-h-[600px] relative">
              {isVideoOff ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center text-white">
                    <Avatar
                      size={120}
                      icon={<UserOutlined />}
                      className="mb-4"
                    />
                    <h3 className="text-xl">김환자</h3>
                    <p className="text-gray-300">비디오가 꺼져있습니다</p>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                  <div className="text-white text-center">
                    <h3 className="text-2xl mb-2">김환자</h3>
                    <p className="text-blue-100">화상 상담 진행 중...</p>
                  </div>
                </div>
              )}

              {/* 작은 내 화면 */}
              <div className="absolute top-4 right-4 w-32 h-24 bg-gray-700 rounded-lg">
                <div className="w-full h-full bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">내 화면</span>
                </div>
              </div>

              {/* 상담 정보 */}
              <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-3 rounded-lg">
                <div className="text-sm">환자: 김환자 (65세, 남성)</div>
                <div className="text-xs text-gray-300">
                  상담 시간: 10:30 - 11:00
                </div>
                <Tag color="green" className="mt-1">
                  정기 상담
                </Tag>
              </div>
            </div>
          </div>

          {/* 통화 컨트롤 */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center gap-4 bg-gray-800 rounded-full px-6 py-3">
              <AntButton
                shape="circle"
                size="large"
                icon={<AudioOutlined />}
                onClick={toggleMute}
                className={
                  isMuted
                    ? "bg-red-500 border-red-500"
                    : "bg-gray-600 border-gray-600"
                }
                style={{ color: "white" }}
              />
              <AntButton
                shape="circle"
                size="large"
                icon={<VideoCameraOutlined />}
                onClick={toggleVideo}
                className={
                  isVideoOff
                    ? "bg-red-500 border-red-500"
                    : "bg-gray-600 border-gray-600"
                }
                style={{ color: "white" }}
              />
              <AntButton
                shape="circle"
                size="large"
                icon={<PhoneOutlined />}
                onClick={endCall}
                className="bg-red-500 border-red-500"
                style={{ color: "white" }}
              />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">화상 상담</h1>
            <p className="text-gray-600 mt-1">
              환자와 실시간으로 화상 상담을 진행하세요
            </p>
          </div>
        </div>

        {/* 예정된 화상 상담 */}
        <Card title="오늘의 화상 상담 일정">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12} lg={8}>
              <AntCard hoverable className="border-l-4 border-l-blue-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar icon={<UserOutlined />} size="large" />
                    <div>
                      <h4 className="font-medium">김환자</h4>
                      <p className="text-sm text-gray-500">65세, 남성</p>
                    </div>
                  </div>
                  <Tag color="processing">예정</Tag>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>시간:</span>
                    <span className="font-medium">10:30 - 11:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>유형:</span>
                    <span>정기 상담</span>
                  </div>
                  <div className="flex justify-between">
                    <span>연락처:</span>
                    <span>010-1234-5678</span>
                  </div>
                </div>
                <AntButton
                  type="primary"
                  block
                  className="mt-4"
                  icon={<VideoCameraOutlined />}
                  onClick={startCall}
                >
                  상담 시작
                </AntButton>
              </AntCard>
            </Col>

            <Col xs={24} md={12} lg={8}>
              <AntCard hoverable className="border-l-4 border-l-green-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar icon={<UserOutlined />} size="large" />
                    <div>
                      <h4 className="font-medium">이할머니</h4>
                      <p className="text-sm text-gray-500">78세, 여성</p>
                    </div>
                  </div>
                  <Tag color="success">완료</Tag>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>시간:</span>
                    <span className="font-medium">09:00 - 09:30</span>
                  </div>
                  <div className="flex justify-between">
                    <span>유형:</span>
                    <span>건강 체크</span>
                  </div>
                  <div className="flex justify-between">
                    <span>상태:</span>
                    <span className="text-green-600">상담 완료</span>
                  </div>
                </div>
                <AntButton block className="mt-4" disabled>
                  상담 완료됨
                </AntButton>
              </AntCard>
            </Col>

            <Col xs={24} md={12} lg={8}>
              <AntCard hoverable className="border-l-4 border-l-orange-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar icon={<UserOutlined />} size="large" />
                    <div>
                      <h4 className="font-medium">박할아버지</h4>
                      <p className="text-sm text-gray-500">72세, 남성</p>
                    </div>
                  </div>
                  <Tag color="warning">대기</Tag>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>시간:</span>
                    <span className="font-medium">14:00 - 14:30</span>
                  </div>
                  <div className="flex justify-between">
                    <span>유형:</span>
                    <span>약물 상담</span>
                  </div>
                  <div className="flex justify-between">
                    <span>연락처:</span>
                    <span>010-5555-1234</span>
                  </div>
                </div>
                <AntButton block className="mt-4" disabled>
                  시간 대기 중
                </AntButton>
              </AntCard>
            </Col>
          </Row>
        </Card>

        {/* 화상 상담 가이드 */}
        <Card title="화상 상담 가이드">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <div className="text-center p-4">
                <VideoCameraOutlined className="text-4xl text-blue-500 mb-3" />
                <h4 className="font-medium mb-2">상담 전 준비</h4>
                <ul className="text-sm text-gray-600 text-left space-y-1">
                  <li>• 카메라와 마이크 확인</li>
                  <li>• 조용한 환경 조성</li>
                  <li>• 환자 정보 미리 확인</li>
                  <li>• 상담 계획 준비</li>
                </ul>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div className="text-center p-4">
                <UserOutlined className="text-4xl text-green-500 mb-3" />
                <h4 className="font-medium mb-2">상담 중 주의사항</h4>
                <ul className="text-sm text-gray-600 text-left space-y-1">
                  <li>• 명확하고 천천히 대화</li>
                  <li>• 환자의 질문에 성심성의껏 답변</li>
                  <li>• 필요시 화면 공유 활용</li>
                  <li>• 상담 내용 기록</li>
                </ul>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div className="text-center p-4">
                <PhoneOutlined className="text-4xl text-purple-500 mb-3" />
                <h4 className="font-medium mb-2">상담 후 관리</h4>
                <ul className="text-sm text-gray-600 text-left space-y-1">
                  <li>• 상담 결과 기록</li>
                  <li>• 후속 조치 계획</li>
                  <li>• 다음 상담 일정 안내</li>
                  <li>• 환자 만족도 확인</li>
                </ul>
              </div>
            </Col>
          </Row>
        </Card>
      </div>
    </AppLayout>
  );
}
