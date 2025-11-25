import { Button, Typography } from "antd";
import { useNavigate } from "react-router";
import Footer from "../../components/templates/components/Footer";
import { Header } from "../../components/templates/components/Header";

const { Title, Paragraph, Text } = Typography;

export default function Home() {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate("/login", {
      state: { previousLocation: location.pathname },
    });
  };

  return (
    <div
      className="bg-gray-50"
      style={{ ["--responsiveBase" as any]: "clamp(16px, 5vw, 48px)" }}
    >
      <Header />

      {/* Hero Section */}
      <section className="w-full">
        <div className="relative overflow-hidden">
          {/* Background Image */}
          <img
            src="/images/Onboarding-banner.png"
            alt="Onboarding-banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 pointer-events-none" />

          {/* Content Overlay */}
          <div className="absolute inset-0 flex items-center">
            <div
              className="text-left px-6 md:px-12 max-w-6xl mx-auto w-full"
              style={{ ["--heroSize" as any]: "var(--responsiveBase)" }}
            >
              <style>{`
                @media (max-width: 499.98px) {
                  .start-btn { min-width: 130px !important; width: 130px !important; }
                }
                .start-btn { transition: background-color 200ms ease, box-shadow 160ms ease, color 160ms ease; }
                .start-btn:hover, .start-btn.ant-btn:hover, .start-btn.ant-btn-default:hover {
                  background-color: #EDF4F4 !important;
                  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.10) !important;
                  color: #007a86 !important;
                }
              `}</style>
              <Title
                level={1}
                className="text-3xl md:text-5xl mb-4"
                style={{ color: "#006D75", fontSize: "var(--heroSize)" }}
              >
                <span
                  className="font-nanum-yethangul font-semibold"
                  style={{
                    fontSize: "inherit",
                    fontFamily: "NanumBarunGothicYetHangul, serif",
                  }}
                >
                  ᄒᆞᆫ디
                </span>
                <span
                  className="font-pretendard font-extralight"
                  style={{ fontSize: "inherit" }}
                >
                  와 함께하는
                  <br /> 스마트한 돌봄
                </span>
              </Title>
              <Paragraph
                className="text-base md:text-xl mb-6 md:mb-8"
                style={{
                  color: "#006D75",
                  fontSize: "calc(var(--heroSize) * 0.5)",
                }}
              >
                <span
                  className="font-pretendard font-normal"
                  style={{ fontSize: "inherit" }}
                >
                  케어에 몰입할 수 있게,
                </span>
                <span
                  className="font-pretendard font-bold"
                  style={{ fontSize: "inherit" }}
                >
                  {" "}
                  Handi
                </span>
              </Paragraph>

              <Button
                type="default"
                size="large"
                onClick={handleStart}
                className="hidden sm:inline-flex start-btn bg-white border-transparent transition-colors duration-200"
                style={{
                  color: "#08979c",
                  fontFamily: "Noto Sans",
                  fontWeight: 600,
                  fontSize: "clamp(14px, 4.5vw, 20px)",
                  padding: "20px 20px",
                  height: "25px",
                  minWidth: "200px",
                  border: "none",
                  outline: "none",
                  position: "fixed",
                  bottom: "30px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 1000,
                  borderRadius: "25px",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                }}
              >
                지금 시작하기
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full" style={{ backgroundColor: "#FFFFFF" }}>
        <div className="max-w-6xl mx-auto px-6 md:px-8 py-8 md:py-8">
          <div className="text-center mb-12 md:mb-16">
            <Title
              level={2}
              className="text-2xl md:text-3xl font-bold text-gray-800 mb-6"
              style={{
                color: "#006D75",
                fontSize:
                  "clamp(16pt, calc(var(--responsiveBase) * 0.8), 40px)",
              }}
            >
              <span
                className="font-nanum-yethangul"
                style={{ fontFamily: "NanumBarunGothicYetHangul, serif" }}
              >
                ᄒᆞᆫ디
              </span>
              만의 특별한 기능
            </Title>
            <Paragraph
              className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto"
              style={{ fontSize: "clamp(12px, 3vw, 16px)" }}
            >
              <strong>
                <span style={{ fontSize: "inherit" }}>
                  모두를 하나로 연결하는 스마트 케어 솔루션
                </span>
              </strong>
              <br />
              <span
                className="feature-desc-plain"
                style={{ fontSize: "inherit" }}
              >
                AI 기술, 따뜻한 마음이 만나 더 편리하고 체계적인 돌봄을
                제공합니다.
              </span>
            </Paragraph>
          </div>

          <style>{`
            @media (min-width: 820px) and (max-width: 1023.98px) {
              .features-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
            }
            @media (max-width: 499.98px) {
              .features-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
              .feature-desc-plain { display: none; }
            }
            @media (min-width: 500px) and (max-width: 819.98px) {
              .features-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            }
            /* 카드 본문에 기본 좌우 패딩 30 적용 (Features 영역의 6개 카드에만) */
            .features-grid .feature-card p { padding-left: 30px !important; padding-right: 30px !important; }
            .feature-card .feature-icon { transition: transform 160ms ease; transform-origin: center center; }
            .feature-card:hover .feature-icon, .feature-card:focus-within .feature-icon { transform: scale(1.05); }
            .feature-card:active .feature-icon { transform: scale(1.08); }
          `}</style>

          <div className="features-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 sm:gap-x-8 md:gap-x-16 gap-y-8 sm:gap-y-12 md:gap-y-20">
            {/* 복약 알리미 */}
            <div className="feature-card flex flex-col items-center text-center w-full">
              <div
                className="rounded-2xl flex items-center justify-center mb-2 md:mb-3 bg-gray-100"
                style={{
                  width: "clamp(6rem, 12vw, 10rem)",
                  height: "clamp(4.5rem, 8.5vw, 8rem)",
                  boxShadow: "inset 0 3px 4px rgba(0,0,0,0.10)",
                }}
              >
                <img
                  src="/images/Green pill box.png"
                  alt="복약 알리미"
                  className="feature-icon object-contain"
                  style={{
                    width: "clamp(3.2rem, 6.5vw, 7.5rem)",
                    height: "auto",
                  }}
                />
              </div>
              <h3
                className="text-lg sm:text-xl md:text-2xl font-bold mb-1 md:mb-2"
                style={{
                  color: "#006D75",
                  fontSize: "clamp(14px, 4vw, 22px)",
                }}
              >
                약품 정보 조회
              </h3>
              <p
                className="text-sm md:text-base text-gray-600 leading-5 md:leading-6"
                style={{
                  fontSize: "clamp(9px, 2.8vw, 15px)",
                  paddingLeft: 30,
                  paddingRight: 30,
                }}
              >
                <strong>처방전 촬영만 하면 끝</strong>
                <span className="feature-desc-plain">
                  <br />
                  시니어별 복용 약품을 사진으로 등록하면 약품 정보를
                  안내드립니다.
                </span>
              </p>
            </div>

            {/* 의료문서 마스킹 */}
            <div className="feature-card flex flex-col items-center text-center w-full">
              <div
                className="rounded-2xl flex items-center justify-center mb-2 md:mb-3 bg-gray-100"
                style={{
                  width: "clamp(6rem, 12vw, 10rem)",
                  height: "clamp(4.5rem, 8.5vw, 8rem)",
                  boxShadow: "inset 0 3px 4px rgba(0,0,0,0.10)",
                }}
              >
                <img
                  src="/images/secure document.png"
                  alt="의료문서 마스킹"
                  className="feature-icon object-contain"
                  style={{
                    width: "clamp(3.2rem, 6.5vw, 7.5rem)",
                    height: "auto",
                  }}
                />
              </div>
              <h3
                className="text-lg sm:text-xl md:text-2xl font-bold mb-1 md:mb-2"
                style={{
                  color: "#006D75",
                  fontSize: "clamp(14px, 4vw, 22px)",
                }}
              >
                의료문서 마스킹
              </h3>
              <p
                className="text-sm md:text-base text-gray-600 leading-5 md:leading-6"
                style={{
                  fontSize: "clamp(9px, 2.8vw, 15px)",
                  paddingLeft: 30,
                  paddingRight: 30,
                }}
              >
                <strong>개인정보도 안심</strong>
                <span className="feature-desc-plain">
                  <br />
                  서류의 원하는 영역을 선택해 마스킹 처리한 후 보관할 수
                  있습니다.
                </span>
              </p>
            </div>

            {/* 건강정보 추적 */}
            <div className="feature-card flex flex-col items-center text-center w-full">
              <div
                className="rounded-2xl flex items-center justify-center mb-2 md:mb-3 bg-gray-100"
                style={{
                  width: "clamp(6rem, 12vw, 10rem)",
                  height: "clamp(4.5rem, 8.5vw, 8rem)",
                  boxShadow: "inset 0 3px 4px rgba(0,0,0,0.10)",
                }}
              >
                <img
                  src="/images/documents with diagram and pen.png"
                  alt="건강정보 추적"
                  className="feature-icon object-contain"
                  style={{
                    width: "clamp(3.2rem, 6.5vw, 7.5rem)",
                    height: "auto",
                  }}
                />
              </div>
              <h3
                className="text-lg sm:text-xl md:text-2xl font-bold mb-1 md:mb-2"
                style={{
                  color: "#006D75",
                  fontSize: "clamp(14px, 4vw, 22px)",
                }}
              >
                건강정보 추적
              </h3>
              <p
                className="text-sm md:text-base text-gray-600 leading-5 md:leading-6"
                style={{
                  fontSize: "clamp(9px, 2.8vw, 15px)",
                  paddingLeft: 30,
                  paddingRight: 30,
                }}
              >
                <strong>수기 기록은 이제 안녕!</strong>
                <span className="feature-desc-plain">
                  <br />
                  혈압, 혈당, 체온의 차트 확인 및 실시간 건강 모니터링이
                  가능합니다.
                </span>
              </p>
            </div>

            {/* 원격 의료 상담 */}
            <div className="feature-card flex flex-col items-center text-center w-full">
              <div
                className="rounded-2xl flex items-center justify-center mb-2 md:mb-3 bg-gray-100"
                style={{
                  width: "clamp(6rem, 12vw, 10rem)",
                  height: "clamp(4.5rem, 8.5vw, 8rem)",
                  boxShadow: "inset 0 3px 4px rgba(0,0,0,0.10)",
                }}
              >
                <img
                  src="/images/two speech bubbles.png"
                  alt="원격 의료 상담"
                  className="feature-icon object-contain"
                  style={{
                    width: "clamp(3.2rem, 6.5vw, 7.5rem)",
                    height: "auto",
                  }}
                />
              </div>
              <h3
                className="text-lg sm:text-xl md:text-2xl font-bold mb-1 md:mb-2"
                style={{
                  color: "#006D75",
                  fontSize: "clamp(14px, 4vw, 22px)",
                }}
              >
                원격 의료 상담
              </h3>
              <p
                className="text-sm md:text-base text-gray-600 leading-5 md:leading-6"
                style={{
                  fontSize: "clamp(9px, 2.8vw, 15px)",
                  paddingLeft: 30,
                  paddingRight: 30,
                }}
              >
                <strong>멀리 사는 보호자분이라면</strong>
                <span className="feature-desc-plain">
                  <br />
                  멀리 사는 보호자도 원격으로 병원 상담에 참가할 수 있습니다.
                </span>
              </p>
            </div>

            {/* 스마트 일정 조율 */}
            <div className="feature-card flex flex-col items-center text-center w-full">
              <div
                className="rounded-2xl flex items-center justify-center mb-2 md:mb-3 bg-gray-100"
                style={{
                  width: "clamp(6rem, 12vw, 10rem)",
                  height: "clamp(4.5rem, 8.5vw, 8rem)",
                  boxShadow: "inset 0 3px 4px rgba(0,0,0,0.10)",
                }}
              >
                <img
                  src="/images/calendar with notes and reminders.png"
                  alt="스마트 일정 매칭"
                  className="feature-icon object-contain"
                  style={{
                    width: "clamp(3.2rem, 6.5vw, 7.5rem)",
                    height: "auto",
                  }}
                />
              </div>
              <h3
                className="text-lg sm:text-xl md:text-2xl font-bold mb-1 md:mb-2"
                style={{
                  color: "#006D75",
                  fontSize: "clamp(14px, 4vw, 22px)",
                }}
              >
                스마트 상담 매칭
              </h3>
              <p
                className="text-sm md:text-base text-gray-600 leading-5 md:leading-6"
                style={{
                  fontSize: "clamp(9px, 2.8vw, 15px)",
                  paddingLeft: 30,
                  paddingRight: 30,
                }}
              >
                <strong>번거로운 일정 조율은 그만</strong>
                <span className="feature-desc-plain">
                  <br />
                  보호자와 근로자 사이에 전화로 이루어지던 일정 조율을
                  온라인으로 진행할 수 있습니다.
                </span>
              </p>
            </div>

            {/* 상담일지 생성 */}
            <div className="feature-card flex flex-col items-center text-center w-full">
              <div
                className="rounded-2xl flex items-center justify-center mb-2 md:mb-3 bg-gray-100"
                style={{
                  width: "clamp(6rem, 12vw, 10rem)",
                  height: "clamp(4.5rem, 8.5vw, 8rem)",
                  boxShadow: "inset 0 3px 4px rgba(0,0,0,0.10)",
                }}
              >
                <img
                  src="/images/candidate resumes and briefcase.png"
                  alt="상담일지 생성"
                  className="feature-icon object-contain"
                  style={{
                    width: "clamp(3.2rem, 6.5vw, 7.5rem)",
                    height: "auto",
                  }}
                />
              </div>
              <h3
                className="text-lg sm:text-xl md:text-2xl font-bold mb-1 md:mb-2"
                style={{
                  color: "#006D75",
                  fontSize: "clamp(14px, 4vw, 22px)",
                }}
              >
                상담일지 생성
              </h3>
              <p
                className="text-sm md:text-base text-gray-600 leading-5 md:leading-6"
                style={{
                  fontSize: "clamp(9px, 2.8vw, 15px)",
                  paddingLeft: 30,
                  paddingRight: 30,
                }}
              >
                <strong>문서 보관함에 자동 생성</strong>
                <span className="feature-desc-plain">
                  <br />
                  화상 상담으로 생성된 상담일지와 마스킹한 의료 문서들을
                  열람하고, 인수인계시 공유할 수 있습니다.
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Section */}
      <section className="w-full" style={{ backgroundColor: "#F5F5F5" }}>
        <style>{`
          .section-illustration { transition: box-shadow 160ms ease; }
          .section-illustration:hover, .section-illustration:focus { box-shadow: 0 6px 12px rgba(0,0,0,0.12), 0 3px 8px rgba(0,0,0,0.08) !important; }
          .section-illustration:active { box-shadow: 0 6px 12px rgba(0,0,0,0.14), 0 4px 10px rgba(0,0,0,0.10) !important; }
        `}</style>
        <div className="max-w-6xl mx-auto px-6 md:px-8 py-4 md:py-12">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4 md:gap-12 mb-6 md:mb-16">
            <div className="order-2 md:order-1 w-full md:w-7/12 md:pr-12 text-center md:text-left">
              <Title
                level={2}
                className="text-4xl md:text-6xl font-pretendard-black mb-2 md:mb-6"
                style={{ color: "#006D75", fontSize: "clamp(16pt, 7vw, 48px)" }}
              >
                활력징후 차트
              </Title>
              <Paragraph
                className="text-base md:text-lg text-gray-600 max-w-xs md:max-w-none mx-auto md:mx-0"
                style={{
                  fontSize: "clamp(12px, 3.6vw, 18px)",
                  marginBottom: 0,
                }}
              >
                주간 활력징후가 그래프로 표시됩니다. <br />
                <span className="feature-desc-plain">
                  매일 측정하는 혈압과 혈당, 체온을 시니어별로 확인하세요.
                </span>
              </Paragraph>
            </div>
            <div className="order-1 md:order-2 w-full md:w-5/12">
              <img
                src="/images/mockup01.png?v=2"
                alt="Dashboard Mockup"
                className="section-illustration w-full h-auto rounded-xl shadow-md md:rounded-2xl md:shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Health Monitoring Section */}
      <section className="w-full" style={{ backgroundColor: "#F5F5F5" }}>
        <div className="max-w-6xl mx-auto px-6 md:px-8 py-4 md:py-12">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4 md:gap-12 mb-6 md:mb-16">
            <div className="order-1 md:order-1 w-full md:w-5/12">
              <img
                src="/images/mockup02.png?v=2"
                alt="Health Monitoring Mockup"
                className="section-illustration w-full h-auto rounded-xl shadow-md md:rounded-2xl md:shadow-lg"
              />
            </div>
            <div className="order-2 md:order-2 w-full md:w-7/12 md:pl-12 text-center md:text-right">
              <Title
                level={2}
                className="text-4xl md:text-6xl font-pretendard-black mb-2 md:mb-6"
                style={{ color: "#006D75", fontSize: "clamp(16pt, 7vw, 48px)" }}
              >
                복약 체크
              </Title>
              <Paragraph
                className="text-base md:text-lg text-gray-600 max-w-xs md:max-w-none mx-auto md:mx-0"
                style={{
                  fontSize: "clamp(12px, 3.6vw, 18px)",
                  marginBottom: 0,
                }}
              >
                일일 복약 내역, 약품 정보를 안내합니다. <br />
                <span className="feature-desc-plain">
                  사진을 업로드하면 자동으로 약품 정보를 찾아드립니다.
                </span>
              </Paragraph>
            </div>
          </div>
        </div>
      </section>

      {/* Schedule Matching Section */}
      <section className="w-full" style={{ backgroundColor: "#F5F5F5" }}>
        <div className="max-w-6xl mx-auto px-6 md:px-8 py-4 md:py-12">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4 md:gap-12 mb-6 md:mb-16">
            <div className="order-2 md:order-1 w-full md:w-7/12 md:pr-12 text-center md:text-left">
              <Title
                level={2}
                className="text-4xl md:text-6xl font-pretendard-black mb-2 md:mb-6"
                style={{ color: "#006D75", fontSize: "clamp(16pt, 7vw, 48px)" }}
              >
                대시보드 요약
              </Title>
              <Paragraph
                className="text-base md:text-lg text-gray-600 max-w-xs md:max-w-none mx-auto md:mx-0"
                style={{
                  fontSize: "clamp(12px, 3.6vw, 18px)",
                  marginBottom: 0,
                }}
              >
                대시보드에서 오늘 일정을 확인하세요. <br />
                <span className="feature-desc-plain">
                  오늘의 상담 일정과 복약 스케줄, 시니어 리스트 등이 표시됩니다.
                </span>
              </Paragraph>
            </div>
            <div className="order-1 md:order-2 w-full md:w-5/12">
              <img
                src="/images/mockup03.png?v=2"
                alt="Schedule Matching Mockup"
                className="section-illustration w-full h-auto rounded-xl shadow-md md:rounded-2xl md:shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
