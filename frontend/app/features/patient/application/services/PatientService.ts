import type { DrugInfo } from "~/features/drug/application/domain/DrugInfo";
import type { DrugSummary } from "~/features/drug/application/domain/DrugSummary";
import type { OffsetPaginated } from "~/shared/domain/pagination";
import { formatDate, parseDate, parseDateTime } from "~/shared/utils/dateUtils";
import type { MedicationItem } from "../../domain/MedicationItem";
import type { ObservationRecord } from "../../domain/ObservationRecord";
import type {
  MedicationSchedule,
  MedicationSchedulesMinimal,
  ObservationRecords,
  Patient,
  PatientData,
  PatientDetailAll,
  PatientList,
  PatientMemo,
  SeniorEmployee,
  TodayMedicationSchedule,
} from "../../domain/Patient";
import type { VitalSign } from "../../domain/VitalSign";
import { patientApi } from "../../infrastructure/api/patientApi";
import type { PatientDataDto } from "../../infrastructure/dto/PatientDto";
import { PatientMapper } from "../mappers/PatientMapper";

export class PatientService {
  private readonly basePath = "/patients";

  // 싱글톤 인스턴스
  private static instance: PatientService | null = null;

  // 싱글톤 인스턴스 반환
  public static getInstance(): PatientService {
    if (!PatientService.instance) {
      PatientService.instance = new PatientService();
    }
    return PatientService.instance;
  }

  // 생성자를 private으로 만들어 외부에서 new로 생성 불가
  private constructor() {}

  /**
   * 대시보드용 환자 리스트 조회 (쿠키 기반 사용자 식별)
   */
  async getRecentSignificant(): Promise<PatientList[]> {
    try {
      const response = await patientApi.getRecentSignificant();
      return PatientMapper.patientListToEntityList(response);
    } catch (error) {
      console.warn("Recent significant API not available, using mock data");
      return this.getMockSignificantData();
    }
  }

  /**
   * 대시보드용 환자 데이터 조회
   */
  async getPatientDataForDashboard(nurseId: string): Promise<PatientData[]> {
    // Mock nurse ID인 경우 바로 mock 데이터 반환
    if (nurseId === "mock-nurse-id") {
      return this.getMockPatientData();
    }

    try {
      const response = await patientApi.getPatientDataForDashboard(nurseId);
      return response.map((dto) => this.mapDtoToEntity(dto));
    } catch (error) {
      console.warn("Patient dashboard API not available, using mock data");
      return this.getMockPatientData();
    }
  }

  /**
   * 전체 환자목록 (/nurse/patients)
   */
  async getPatientsForDashboard(nurseId: string): Promise<PatientData[]> {
    // API가 없는 경우 mock 데이터 반환
    console.warn("Patients for dashboard API not available, using mock data");
    return this.getMockPatientData();
  }

  /**
   * 오늘 복약 스케줄 조회 (쿠키 기반 사용자 식별)
   */
  async getTodayMedicationSchedules(): Promise<MedicationSchedule[]> {
    try {
      const response = await patientApi.getTodayMedicationSchedules();
      return PatientMapper.medicationScheduleToEntityList(response);
    } catch (error) {
      console.warn(
        "Today medication schedules API not available, using mock data"
      );
      return this.getMockMedicationSchedules();
    }
  }

  /**
   * 특정 복약 스케줄 조회
   */
  async getMedicationSchedule(id: number): Promise<MedicationSchedule> {
    try {
      const response = await patientApi.getMedicationSchedule(id);
      return PatientMapper.medicationScheduleToEntity(response);
    } catch (error) {
      console.warn("Medication schedule API not available, using mock data");
      return this.getMockMedicationSchedule(id);
    }
  }

  /**
   * 오늘 복약 내역 조회 (새로운 API 응답 구조)
   */
  async getTodayMedicationSchedulesNew(): Promise<TodayMedicationSchedule[]> {
    try {
      const response = await patientApi.getTodayMedicationSchedulesNew();
      return PatientMapper.todayMedicationScheduleToEntityList(response);
    } catch (error) {
      console.warn(
        "Today medication schedules new API not available, using mock data"
      );
      return this.getMockTodayMedicationSchedules();
    }
  }

  /**
   * 특정 기간 동안의 시니어의 복약 내역 조회
   */
  async getMedicationSchedulesByRange(
    seniorId: number,
    params: {
      page?: number;
      size?: number;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<MedicationSchedule[]> {
    try {
      const response = await patientApi.getMedicationSchedulesByRange(
        seniorId,
        {
          ...params,
          page: params.page ?? 1,
          size: params.size ?? 10,
        }
      );
      return PatientMapper.medicationScheduleToEntityList(response);
    } catch (error) {
      console.warn(
        "Medication schedules by range API not available, using mock data"
      );
      return this.getMockMedicationSchedules();
    }
  }

  /**
   * 투약 내역 한 건 조회
   */
  async getMedication(medicationId: number): Promise<MedicationItem> {
    try {
      const response = await patientApi.getMedication(medicationId);
      return PatientMapper.medicationToEntity(response);
    } catch (error) {
      console.warn("Medication API not available, using mock data");
      throw new Error("Medication API not available");
    }
  }

  /**
   * 투약 스케줄의 각 복약 내역을 조회
   */
  async getMedicationsByScheduleId(
    scheduleId: number
  ): Promise<MedicationSchedulesMinimal> {
    try {
      const response = await patientApi.getMedicationsByScheduleId(scheduleId);
      return PatientMapper.medicationSchedulesMinimalToEntity(response);
    } catch (error) {
      console.warn(
        "Medication schedules by schedule ID API not available, using mock data"
      );
      throw new Error("Medication schedules by schedule ID API not available");
    }
  }

  /**
   * 처방 생성
   */
  async createPrescription(
    patientId: number,
    data: {
      medicationName: string;
      startDate: string;
      endDate: string;
      description: {
        drug_candidates: DrugInfo[];
      };
      medicationTimes: string[];
      drug_summary: DrugSummary[];
    }
  ): Promise<void> {
    return patientApi.createPrescription(patientId, data);
  }

  /**
   * Mock 복약 스케줄 데이터 반환
   */
  private getMockMedicationSchedules(): MedicationSchedule[] {
    return [
      {
        id: 1,
        seniorId: 1,
        seniorName: "김할머니",
        medicationName: "아스피린",
        startDate: "2025-01-01",
        endDate: "2025-01-31",
        description: {
          drug_candidates: [
            {
              image:
                "https://nedrug.mfds.go.kr/pbp/cmn/itemImageDownload/1Oi0vWfEzG0",
              dosage: "",
              category: "소화성궤양용제",
              extraInfo: "시메티딘",
              appearance: "이약은연녹색의원형정제이다.",
              dosageForm: "원형",
              description: {
                상세: {
                  "용법 및 용량":
                    "노인 환자는 신장 기능이 저하될 수 있으므로, 일반 성인 용법인 1회 400mg을 하루 2회 또는 취침 시 800mg으로 투여할 수 있지만, 신장 기능에 따라 용량을 조절해야 합니다. 필요 시 1회 300mg을 하루 4회로 나누어 복용할 수 있으며, 최대 1일 2.4g을 초과하지 않도록 주의해야 합니다.",
                  "효능 및 효과":
                    "타가틴정은 위염, 위 및 십이지장 궤양, 역류성 식도염 등의 증상을 개선하는 데 도움을 줍니다. 특히 노인 환자에게는 위 점막의 병변을 개선하여 소화기 건강을 유지하는 데 중요한 역할을 합니다.",
                  "복약 시 주의 사항":
                    "타가틴정을 복용할 때는 졸음이 올 수 있으므로 운전이나 위험한 기계 조작을 피해야 합니다. 또한, 신장 기능이 저하된 환자는 용량을 조절해야 하며, 유당을 함유하고 있어 유당불내증이 있는 환자는 복용을 피해야 합니다. 이 약물은 다른 약물과 상호작용할 수 있으므로, 특히 쿠마린계 항응고제와 함께 복용할 경우 프로트롬빈 시간을 주의 깊게 관찰해야 합니다.",
                },
                키워드: {
                  "용법 및 용량": "1회 400mg, 하루 2회, 취침 시 800mg 가능",
                  "효능 및 효과": "위염 개선, 궤양 치료, 역류성 식도염 완화",
                  "복약 시 주의 사항":
                    "졸음 주의, 신장 기능 저하 시 용량 조절, 유당불내증 주의",
                },
              },
              productName: "타가틴정",
              thicknessMm: "4.7",
              formCodeName: "나정",
              manufacturer: "위더스제약(주)",
              similarity_score: 1,
            },
          ],
        },
        medicationInfo: "혈압 조절을 위한 약물",
        medicationTimes: ["AFTER_BREAKFAST", "AFTER_DINNER"],
        scheduledTimes: ["08:30", "19:30"],
        isCompleted: false,
        completedAt: undefined,
      },
      {
        id: 2,
        seniorId: 2,
        seniorName: "박할아버지",
        medicationName: "메트포르민",
        startDate: "2025-01-01",
        endDate: "2025-01-31",
        description: {
          drug_candidates: [
            {
              image:
                "https://nedrug.mfds.go.kr/pbp/cmn/itemImageDownload/1Oi0vWfEzG0",
              dosage: "",
              category: "소화성궤양용제",
              extraInfo: "시메티딘",
              appearance: "이약은연녹색의원형정제이다.",
              dosageForm: "원형",
              description: {
                상세: {
                  "용법 및 용량":
                    "노인 환자는 신장 기능이 저하될 수 있으므로, 일반 성인 용법인 1회 400mg을 하루 2회 또는 취침 시 800mg으로 투여할 수 있지만, 신장 기능에 따라 용량을 조절해야 합니다. 필요 시 1회 300mg을 하루 4회로 나누어 복용할 수 있으며, 최대 1일 2.4g을 초과하지 않도록 주의해야 합니다.",
                  "효능 및 효과":
                    "타가틴정은 위염, 위 및 십이지장 궤양, 역류성 식도염 등의 증상을 개선하는 데 도움을 줍니다. 특히 노인 환자에게는 위 점막의 병변을 개선하여 소화기 건강을 유지하는 데 중요한 역할을 합니다.",
                  "복약 시 주의 사항":
                    "타가틴정을 복용할 때는 졸음이 올 수 있으므로 운전이나 위험한 기계 조작을 피해야 합니다. 또한, 신장 기능이 저하된 환자는 용량을 조절해야 하며, 유당을 함유하고 있어 유당불내증이 있는 환자는 복용을 피해야 합니다. 이 약물은 다른 약물과 상호작용할 수 있으므로, 특히 쿠마린계 항응고제와 함께 복용할 경우 프로트롬빈 시간을 주의 깊게 관찰해야 합니다.",
                },
                키워드: {
                  "용법 및 용량": "1회 400mg, 하루 2회, 취침 시 800mg 가능",
                  "효능 및 효과": "위염 개선, 궤양 치료, 역류성 식도염 완화",
                  "복약 시 주의 사항":
                    "졸음 주의, 신장 기능 저하 시 용량 조절, 유당불내증 주의",
                },
              },
              productName: "타가틴정",
              thicknessMm: "4.7",
              formCodeName: "나정",
              manufacturer: "위더스제약(주)",
              similarity_score: 1,
            },
          ],
        },
        medicationInfo: "당뇨 관리 약물",
        medicationTimes: ["BEFORE_BREAKFAST", "BEFORE_DINNER"],
        scheduledTimes: ["07:30", "18:30"],
      },
      {
        id: 3,
        seniorId: 3,
        seniorName: "이할머니",
        medicationName: "칼슘제",
        startDate: "2025-01-01",
        endDate: "2025-01-31",
        description: {
          drug_candidates: [
            {
              image:
                "https://nedrug.mfds.go.kr/pbp/cmn/itemImageDownload/1Oi0vWfEzG0",
              dosage: "",
              category: "소화성궤양용제",
              extraInfo: "시메티딘",
              appearance: "이약은연녹색의원형정제이다.",
              dosageForm: "원형",
              description: {
                상세: {
                  "용법 및 용량":
                    "노인 환자는 신장 기능이 저하될 수 있으므로, 일반 성인 용법인 1회 400mg을 하루 2회 또는 취침 시 800mg으로 투여할 수 있지만, 신장 기능에 따라 용량을 조절해야 합니다. 필요 시 1회 300mg을 하루 4회로 나누어 복용할 수 있으며, 최대 1일 2.4g을 초과하지 않도록 주의해야 합니다.",
                  "효능 및 효과":
                    "타가틴정은 위염, 위 및 십이지장 궤양, 역류성 식도염 등의 증상을 개선하는 데 도움을 줍니다. 특히 노인 환자에게는 위 점막의 병변을 개선하여 소화기 건강을 유지하는 데 중요한 역할을 합니다.",
                  "복약 시 주의 사항":
                    "타가틴정을 복용할 때는 졸음이 올 수 있으므로 운전이나 위험한 기계 조작을 피해야 합니다. 또한, 신장 기능이 저하된 환자는 용량을 조절해야 하며, 유당을 함유하고 있어 유당불내증이 있는 환자는 복용을 피해야 합니다. 이 약물은 다른 약물과 상호작용할 수 있으므로, 특히 쿠마린계 항응고제와 함께 복용할 경우 프로트롬빈 시간을 주의 깊게 관찰해야 합니다.",
                },
                키워드: {
                  "용법 및 용량": "1회 400mg, 하루 2회, 취침 시 800mg 가능",
                  "효능 및 효과": "위염 개선, 궤양 치료, 역류성 식도염 완화",
                  "복약 시 주의 사항":
                    "졸음 주의, 신장 기능 저하 시 용량 조절, 유당불내증 주의",
                },
              },
              productName: "타가틴정",
              thicknessMm: "4.7",
              formCodeName: "나정",
              manufacturer: "위더스제약(주)",
              similarity_score: 1,
            },
          ],
        },
        medicationInfo: "뼈 건강을 위한 보조제",
        medicationTimes: ["AFTER_LUNCH", "BEDTIME"],
        scheduledTimes: ["13:30", "21:00"],
      },
      {
        id: 4,
        seniorId: 4,
        seniorName: "최할아버지",
        medicationName: "비타민D",
        startDate: "2025-01-01",
        endDate: "2025-01-31",
        description: {
          drug_candidates: [
            {
              image:
                "https://nedrug.mfds.go.kr/pbp/cmn/itemImageDownload/1Oi0vWfEzG0",
              dosage: "",
              category: "소화성궤양용제",
              extraInfo: "시메티딘",
              appearance: "이약은연녹색의원형정제이다.",
              dosageForm: "원형",
              description: {
                상세: {
                  "용법 및 용량":
                    "노인 환자는 신장 기능이 저하될 수 있으므로, 일반 성인 용법인 1회 400mg을 하루 2회 또는 취침 시 800mg으로 투여할 수 있지만, 신장 기능에 따라 용량을 조절해야 합니다. 필요 시 1회 300mg을 하루 4회로 나누어 복용할 수 있으며, 최대 1일 2.4g을 초과하지 않도록 주의해야 합니다.",
                  "효능 및 효과":
                    "타가틴정은 위염, 위 및 십이지장 궤양, 역류성 식도염 등의 증상을 개선하는 데 도움을 줍니다. 특히 노인 환자에게는 위 점막의 병변을 개선하여 소화기 건강을 유지하는 데 중요한 역할을 합니다.",
                  "복약 시 주의 사항":
                    "타가틴정을 복용할 때는 졸음이 올 수 있으므로 운전이나 위험한 기계 조작을 피해야 합니다. 또한, 신장 기능이 저하된 환자는 용량을 조절해야 하며, 유당을 함유하고 있어 유당불내증이 있는 환자는 복용을 피해야 합니다. 이 약물은 다른 약물과 상호작용할 수 있으므로, 특히 쿠마린계 항응고제와 함께 복용할 경우 프로트롬빈 시간을 주의 깊게 관찰해야 합니다.",
                },
                키워드: {
                  "용법 및 용량": "1회 400mg, 하루 2회, 취침 시 800mg 가능",
                  "효능 및 효과": "위염 개선, 궤양 치료, 역류성 식도염 완화",
                  "복약 시 주의 사항":
                    "졸음 주의, 신장 기능 저하 시 용량 조절, 유당불내증 주의",
                },
              },
              productName: "타가틴정",
              thicknessMm: "4.7",
              formCodeName: "나정",
              manufacturer: "위더스제약(주)",
              similarity_score: 1,
            },
          ],
        },
        medicationInfo: "면역력 증진을 위한 비타민",
        medicationTimes: ["AFTER_BREAKFAST"],
        scheduledTimes: ["08:30"],
        isCompleted: false,
        completedAt: undefined,
      },
    ];
  }

  /**
   * Mock 특정 복약 스케줄 데이터 반환
   */
  private getMockMedicationSchedule(id: number): MedicationSchedule {
    return {
      id: id,
      seniorId: 1,
      seniorName: "김할머니",
      medicationName: "아스피린",
      startDate: "2025-01-01",
      endDate: "2025-01-31",
      description: {
        drug_candidates: [
          {
            image:
              "https://nedrug.mfds.go.kr/pbp/cmn/itemImageDownload/1Oi0vWfEzG0",
            dosage: "",
            category: "소화성궤양용제",
            extraInfo: "시메티딘",
            appearance: "이약은연녹색의원형정제이다.",
            dosageForm: "원형",
            description: {
              상세: {
                "용법 및 용량":
                  "노인 환자는 신장 기능이 저하될 수 있으므로, 일반 성인 용법인 1회 400mg을 하루 2회 또는 취침 시 800mg으로 투여할 수 있지만, 신장 기능에 따라 용량을 조절해야 합니다. 필요 시 1회 300mg을 하루 4회로 나누어 복용할 수 있으며, 최대 1일 2.4g을 초과하지 않도록 주의해야 합니다.",
                "효능 및 효과":
                  "타가틴정은 위염, 위 및 십이지장 궤양, 역류성 식도염 등의 증상을 개선하는 데 도움을 줍니다. 특히 노인 환자에게는 위 점막의 병변을 개선하여 소화기 건강을 유지하는 데 중요한 역할을 합니다.",
                "복약 시 주의 사항":
                  "타가틴정을 복용할 때는 졸음이 올 수 있으므로 운전이나 위험한 기계 조작을 피해야 합니다. 또한, 신장 기능이 저하된 환자는 용량을 조절해야 하며, 유당을 함유하고 있어 유당불내증이 있는 환자는 복용을 피해야 합니다. 이 약물은 다른 약물과 상호작용할 수 있으므로, 특히 쿠마린계 항응고제와 함께 복용할 경우 프로트롬빈 시간을 주의 깊게 관찰해야 합니다.",
              },
              키워드: {
                "용법 및 용량": "1회 400mg, 하루 2회, 취침 시 800mg 가능",
                "효능 및 효과": "위염 개선, 궤양 치료, 역류성 식도염 완화",
                "복약 시 주의 사항":
                  "졸음 주의, 신장 기능 저하 시 용량 조절, 유당불내증 주의",
              },
            },
            productName: "타가틴정",
            thicknessMm: "4.7",
            formCodeName: "나정",
            manufacturer: "위더스제약(주)",
            similarity_score: 1,
          },
        ],
      },
      medicationInfo: "혈압 조절을 위한 약물",
      medicationTimes: ["AFTER_BREAKFAST", "AFTER_DINNER"],
      scheduledTimes: ["08:30", "19:30"],
      isCompleted: false,
      completedAt: undefined,
    };
  }

  /**
   * Mock 환자 데이터 반환
   */
  private getMockPatientData(): PatientData[] {
    const mockPatientData: PatientDataDto[] = [
      {
        id: "1",
        name: "김환자",
        age: 65,
        diagnosis: "당뇨 관리",
        last_visit: "2025-01-02",
        status: "위험",
        note: "최근 혈당 수치가 높아 주의가 필요합니다.",
        medication_schedule: [
          {
            id: 1,
            seniorId: 1,
            seniorName: "김환자",
            medicationName: "메트포르민",
            startDate: "2025-01-01",
            endDate: "2025-01-31",
            description: {
              drug_candidates: [
                {
                  image:
                    "https://nedrug.mfds.go.kr/pbp/cmn/itemImageDownload/1Oi0vWfEzG0",
                  dosage: "",
                  category: "소화성궤양용제",
                  extraInfo: "시메티딘",
                  appearance: "이약은연녹색의원형정제이다.",
                  dosageForm: "원형",
                  description: {
                    상세: {
                      "용법 및 용량":
                        "노인 환자는 신장 기능이 저하될 수 있으므로, 일반 성인 용법인 1회 400mg을 하루 2회 또는 취침 시 800mg으로 투여할 수 있지만, 신장 기능에 따라 용량을 조절해야 합니다. 필요 시 1회 300mg을 하루 4회로 나누어 복용할 수 있으며, 최대 1일 2.4g을 초과하지 않도록 주의해야 합니다.",
                      "효능 및 효과":
                        "타가틴정은 위염, 위 및 십이지장 궤양, 역류성 식도염 등의 증상을 개선하는 데 도움을 줍니다. 특히 노인 환자에게는 위 점막의 병변을 개선하여 소화기 건강을 유지하는 데 중요한 역할을 합니다.",
                      "복약 시 주의 사항":
                        "타가틴정을 복용할 때는 졸음이 올 수 있으므로 운전이나 위험한 기계 조작을 피해야 합니다. 또한, 신장 기능이 저하된 환자는 용량을 조절해야 하며, 유당을 함유하고 있어 유당불내증이 있는 환자는 복용을 피해야 합니다. 이 약물은 다른 약물과 상호작용할 수 있으므로, 특히 쿠마린계 항응고제와 함께 복용할 경우 프로트롬빈 시간을 주의 깊게 관찰해야 합니다.",
                    },
                    키워드: {
                      "용법 및 용량": "1회 400mg, 하루 2회, 취침 시 800mg 가능",
                      "효능 및 효과":
                        "위염 개선, 궤양 치료, 역류성 식도염 완화",
                      "복약 시 주의 사항":
                        "졸음 주의, 신장 기능 저하 시 용량 조절, 유당불내증 주의",
                    },
                  },
                  productName: "타가틴정",
                  thicknessMm: "4.7",
                  formCodeName: "나정",
                  manufacturer: "위더스제약(주)",
                  similarity_score: 1,
                },
              ],
            },
            medicationInfo: "혈당 조절을 위한 약물",
            medicationTimes: ["AFTER_BREAKFAST", "AFTER_DINNER"],
            scheduledTimes: ["08:30", "19:30"],
            isCompleted: false,
            completedAt: undefined,
          },
          {
            id: 2,
            seniorId: 1,
            seniorName: "김환자",
            medicationName: "아스피린",
            startDate: "2025-01-01",
            endDate: "2025-01-31",
            description: {
              drug_candidates: [
                {
                  image:
                    "https://nedrug.mfds.go.kr/pbp/cmn/itemImageDownload/1Oi0vWfEzG0",
                  dosage: "",
                  category: "소화성궤양용제",
                  extraInfo: "시메티딘",
                  appearance: "이약은연녹색의원형정제이다.",
                  dosageForm: "원형",
                  description: {
                    상세: {
                      "용법 및 용량":
                        "노인 환자는 신장 기능이 저하될 수 있으므로, 일반 성인 용법인 1회 400mg을 하루 2회 또는 취침 시 800mg으로 투여할 수 있지만, 신장 기능에 따라 용량을 조절해야 합니다. 필요 시 1회 300mg을 하루 4회로 나누어 복용할 수 있으며, 최대 1일 2.4g을 초과하지 않도록 주의해야 합니다.",
                      "효능 및 효과":
                        "타가틴정은 위염, 위 및 십이지장 궤양, 역류성 식도염 등의 증상을 개선하는 데 도움을 줍니다. 특히 노인 환자에게는 위 점막의 병변을 개선하여 소화기 건강을 유지하는 데 중요한 역할을 합니다.",
                      "복약 시 주의 사항":
                        "타가틴정을 복용할 때는 졸음이 올 수 있으므로 운전이나 위험한 기계 조작을 피해야 합니다. 또한, 신장 기능이 저하된 환자는 용량을 조절해야 하며, 유당을 함유하고 있어 유당불내증이 있는 환자는 복용을 피해야 합니다. 이 약물은 다른 약물과 상호작용할 수 있으므로, 특히 쿠마린계 항응고제와 함께 복용할 경우 프로트롬빈 시간을 주의 깊게 관찰해야 합니다.",
                    },
                    키워드: {
                      "용법 및 용량": "1회 400mg, 하루 2회, 취침 시 800mg 가능",
                      "효능 및 효과":
                        "위염 개선, 궤양 치료, 역류성 식도염 완화",
                      "복약 시 주의 사항":
                        "졸음 주의, 신장 기능 저하 시 용량 조절, 유당불내증 주의",
                    },
                  },
                  productName: "타가틴정",
                  thicknessMm: "4.7",
                  formCodeName: "나정",
                  manufacturer: "위더스제약(주)",
                  similarity_score: 1,
                },
              ],
            },
            medicationInfo: "혈액 순환 개선을 위한 약물",
            medicationTimes: ["AFTER_BREAKFAST"],
            scheduledTimes: ["08:30"],
            isCompleted: false,
            completedAt: undefined,
          },
        ],
      },
      {
        id: "2",
        name: "이할머니",
        age: 78,
        diagnosis: "관절염 관리",
        last_visit: "2025-01-01",
        status: "주의",
        note: "관절 통증이 심해져서 약물 조정이 필요합니다.",
        medication_schedule: [
          {
            id: 3,
            seniorId: 2,
            seniorName: "이할머니",
            medicationName: "이부프로펜",
            startDate: "2025-01-01",
            endDate: "2025-01-31",
            description: {
              drug_candidates: [
                {
                  image:
                    "https://nedrug.mfds.go.kr/pbp/cmn/itemImageDownload/1Oi0vWfEzG0",
                  dosage: "",
                  category: "소화성궤양용제",
                  extraInfo: "시메티딘",
                  appearance: "이약은연녹색의원형정제이다.",
                  dosageForm: "원형",
                  description: {
                    상세: {
                      "용법 및 용량":
                        "노인 환자는 신장 기능이 저하될 수 있으므로, 일반 성인 용법인 1회 400mg을 하루 2회 또는 취침 시 800mg으로 투여할 수 있지만, 신장 기능에 따라 용량을 조절해야 합니다. 필요 시 1회 300mg을 하루 4회로 나누어 복용할 수 있으며, 최대 1일 2.4g을 초과하지 않도록 주의해야 합니다.",
                      "효능 및 효과":
                        "타가틴정은 위염, 위 및 십이지장 궤양, 역류성 식도염 등의 증상을 개선하는 데 도움을 줍니다. 특히 노인 환자에게는 위 점막의 병변을 개선하여 소화기 건강을 유지하는 데 중요한 역할을 합니다.",
                      "복약 시 주의 사항":
                        "타가틴정을 복용할 때는 졸음이 올 수 있으므로 운전이나 위험한 기계 조작을 피해야 합니다. 또한, 신장 기능이 저하된 환자는 용량을 조절해야 하며, 유당을 함유하고 있어 유당불내증이 있는 환자는 복용을 피해야 합니다. 이 약물은 다른 약물과 상호작용할 수 있으므로, 특히 쿠마린계 항응고제와 함께 복용할 경우 프로트롬빈 시간을 주의 깊게 관찰해야 합니다.",
                    },
                    키워드: {
                      "용법 및 용량": "1회 400mg, 하루 2회, 취침 시 800mg 가능",
                      "효능 및 효과":
                        "위염 개선, 궤양 치료, 역류성 식도염 완화",
                      "복약 시 주의 사항":
                        "졸음 주의, 신장 기능 저하 시 용량 조절, 유당불내증 주의",
                    },
                  },
                  productName: "타가틴정",
                  thicknessMm: "4.7",
                  formCodeName: "나정",
                  manufacturer: "위더스제약(주)",
                  similarity_score: 1,
                },
              ],
            },
            medicationInfo: "통증 완화를 위한 소염제",
            medicationTimes: ["AFTER_BREAKFAST", "AFTER_LUNCH", "AFTER_DINNER"],
            scheduledTimes: ["08:30", "13:30", "19:30"],
            isCompleted: false,
            completedAt: undefined,
          },
        ],
      },
      {
        id: "3",
        name: "박할아버지",
        age: 72,
        diagnosis: "심장병 관리",
        last_visit: "2024-12-30",
        status: "양호",
        note: "혈압이 안정적으로 유지되고 있습니다.",
        medication_schedule: [
          {
            id: 4,
            seniorId: 3,
            seniorName: "박할아버지",
            medicationName: "아스피린",
            startDate: "2025-01-01",
            endDate: "2025-01-31",
            description: {
              drug_candidates: [
                {
                  image:
                    "https://nedrug.mfds.go.kr/pbp/cmn/itemImageDownload/1Oi0vWfEzG0",
                  dosage: "",
                  category: "소화성궤양용제",
                  extraInfo: "시메티딘",
                  appearance: "이약은연녹색의원형정제이다.",
                  dosageForm: "원형",
                  description: {
                    상세: {
                      "용법 및 용량":
                        "노인 환자는 신장 기능이 저하될 수 있으므로, 일반 성인 용법인 1회 400mg을 하루 2회 또는 취침 시 800mg으로 투여할 수 있지만, 신장 기능에 따라 용량을 조절해야 합니다. 필요 시 1회 300mg을 하루 4회로 나누어 복용할 수 있으며, 최대 1일 2.4g을 초과하지 않도록 주의해야 합니다.",
                      "효능 및 효과":
                        "타가틴정은 위염, 위 및 십이지장 궤양, 역류성 식도염 등의 증상을 개선하는 데 도움을 줍니다. 특히 노인 환자에게는 위 점막의 병변을 개선하여 소화기 건강을 유지하는 데 중요한 역할을 합니다.",
                      "복약 시 주의 사항":
                        "타가틴정을 복용할 때는 졸음이 올 수 있으므로 운전이나 위험한 기계 조작을 피해야 합니다. 또한, 신장 기능이 저하된 환자는 용량을 조절해야 하며, 유당을 함유하고 있어 유당불내증이 있는 환자는 복용을 피해야 합니다. 이 약물은 다른 약물과 상호작용할 수 있으므로, 특히 쿠마린계 항응고제와 함께 복용할 경우 프로트롬빈 시간을 주의 깊게 관찰해야 합니다.",
                    },
                    키워드: {
                      "용법 및 용량": "1회 400mg, 하루 2회, 취침 시 800mg 가능",
                      "효능 및 효과":
                        "위염 개선, 궤양 치료, 역류성 식도염 완화",
                      "복약 시 주의 사항":
                        "졸음 주의, 신장 기능 저하 시 용량 조절, 유당불내증 주의",
                    },
                  },
                  productName: "타가틴정",
                  thicknessMm: "4.7",
                  formCodeName: "나정",
                  manufacturer: "위더스제약(주)",
                  similarity_score: 1,
                },
              ],
            },
            medicationInfo: "혈액 순환 개선을 위한 약물",
            medicationTimes: ["AFTER_BREAKFAST"],
            scheduledTimes: ["08:30"],
            isCompleted: false,
            completedAt: undefined,
          },
          {
            id: 5,
            seniorId: 3,
            seniorName: "박할아버지",
            medicationName: "아테놀롤",
            startDate: "2025-01-01",
            endDate: "2025-01-31",
            description: {
              drug_candidates: [
                {
                  image:
                    "https://nedrug.mfds.go.kr/pbp/cmn/itemImageDownload/1Oi0vWfEzG0",
                  dosage: "",
                  category: "소화성궤양용제",
                  extraInfo: "시메티딘",
                  appearance: "이약은연녹색의원형정제이다.",
                  dosageForm: "원형",
                  description: {
                    상세: {
                      "용법 및 용량":
                        "노인 환자는 신장 기능이 저하될 수 있으므로, 일반 성인 용법인 1회 400mg을 하루 2회 또는 취침 시 800mg으로 투여할 수 있지만, 신장 기능에 따라 용량을 조절해야 합니다. 필요 시 1회 300mg을 하루 4회로 나누어 복용할 수 있으며, 최대 1일 2.4g을 초과하지 않도록 주의해야 합니다.",
                      "효능 및 효과":
                        "타가틴정은 위염, 위 및 십이지장 궤양, 역류성 식도염 등의 증상을 개선하는 데 도움을 줍니다. 특히 노인 환자에게는 위 점막의 병변을 개선하여 소화기 건강을 유지하는 데 중요한 역할을 합니다.",
                      "복약 시 주의 사항":
                        "타가틴정을 복용할 때는 졸음이 올 수 있으므로 운전이나 위험한 기계 조작을 피해야 합니다. 또한, 신장 기능이 저하된 환자는 용량을 조절해야 하며, 유당을 함유하고 있어 유당불내증이 있는 환자는 복용을 피해야 합니다. 이 약물은 다른 약물과 상호작용할 수 있으므로, 특히 쿠마린계 항응고제와 함께 복용할 경우 프로트롬빈 시간을 주의 깊게 관찰해야 합니다.",
                    },
                    키워드: {
                      "용법 및 용량": "1회 400mg, 하루 2회, 취침 시 800mg 가능",
                      "효능 및 효과":
                        "위염 개선, 궤양 치료, 역류성 식도염 완화",
                      "복약 시 주의 사항":
                        "졸음 주의, 신장 기능 저하 시 용량 조절, 유당불내증 주의",
                    },
                  },
                  productName: "타가틴정",
                  thicknessMm: "4.7",
                  formCodeName: "나정",
                  manufacturer: "위더스제약(주)",
                  similarity_score: 1,
                },
              ],
            },
            medicationInfo: "혈압 조절을 위한 베타 차단제",
            medicationTimes: ["AFTER_BREAKFAST"],
            scheduledTimes: ["08:30"],
            isCompleted: false,
            completedAt: undefined,
          },
        ],
      },
      {
        id: "4",
        name: "최환자",
        age: 58,
        diagnosis: "천식 관리",
        last_visit: "2024-12-29",
        status: "주의",
        note: "기침이 심해져서 흡입기 사용법을 재교육했습니다.",
        medication_schedule: [
          {
            id: 6,
            seniorId: 4,
            seniorName: "최환자",
            medicationName: "살부타몰",
            startDate: "2025-01-01",
            endDate: "2025-01-31",
            description: {
              drug_candidates: [
                {
                  image:
                    "https://nedrug.mfds.go.kr/pbp/cmn/itemImageDownload/1Oi0vWfEzG0",
                  dosage: "",
                  category: "소화성궤양용제",
                  extraInfo: "시메티딘",
                  appearance: "이약은연녹색의원형정제이다.",
                  dosageForm: "원형",
                  description: {
                    상세: {
                      "용법 및 용량":
                        "노인 환자는 신장 기능이 저하될 수 있으므로, 일반 성인 용법인 1회 400mg을 하루 2회 또는 취침 시 800mg으로 투여할 수 있지만, 신장 기능에 따라 용량을 조절해야 합니다. 필요 시 1회 300mg을 하루 4회로 나누어 복용할 수 있으며, 최대 1일 2.4g을 초과하지 않도록 주의해야 합니다.",
                      "효능 및 효과":
                        "타가틴정은 위염, 위 및 십이지장 궤양, 역류성 식도염 등의 증상을 개선하는 데 도움을 줍니다. 특히 노인 환자에게는 위 점막의 병변을 개선하여 소화기 건강을 유지하는 데 중요한 역할을 합니다.",
                      "복약 시 주의 사항":
                        "타가틴정을 복용할 때는 졸음이 올 수 있으므로 운전이나 위험한 기계 조작을 피해야 합니다. 또한, 신장 기능이 저하된 환자는 용량을 조절해야 하며, 유당을 함유하고 있어 유당불내증이 있는 환자는 복용을 피해야 합니다. 이 약물은 다른 약물과 상호작용할 수 있으므로, 특히 쿠마린계 항응고제와 함께 복용할 경우 프로트롬빈 시간을 주의 깊게 관찰해야 합니다.",
                    },
                    키워드: {
                      "용법 및 용량": "1회 400mg, 하루 2회, 취침 시 800mg 가능",
                      "효능 및 효과":
                        "위염 개선, 궤양 치료, 역류성 식도염 완화",
                      "복약 시 주의 사항":
                        "졸음 주의, 신장 기능 저하 시 용량 조절, 유당불내증 주의",
                    },
                  },
                  productName: "타가틴정",
                  thicknessMm: "4.7",
                  formCodeName: "나정",
                  manufacturer: "위더스제약(주)",
                  similarity_score: 1,
                },
              ],
            },
            medicationInfo: "기관지 확장을 위한 흡입제",
            medicationTimes: ["BEFORE_BREAKFAST"],
            scheduledTimes: ["07:00"],
          },
          {
            id: 7,
            seniorId: 4,
            seniorName: "최환자",
            medicationName: "부데소니드",
            startDate: "2025-01-01",
            endDate: "2025-01-31",
            description: {
              drug_candidates: [
                {
                  image:
                    "https://nedrug.mfds.go.kr/pbp/cmn/itemImageDownload/1Oi0vWfEzG0",
                  dosage: "",
                  category: "소화성궤양용제",
                  extraInfo: "시메티딘",
                  appearance: "이약은연녹색의원형정제이다.",
                  dosageForm: "원형",
                  description: {
                    상세: {
                      "용법 및 용량":
                        "노인 환자는 신장 기능이 저하될 수 있으므로, 일반 성인 용법인 1회 400mg을 하루 2회 또는 취침 시 800mg으로 투여할 수 있지만, 신장 기능에 따라 용량을 조절해야 합니다. 필요 시 1회 300mg을 하루 4회로 나누어 복용할 수 있으며, 최대 1일 2.4g을 초과하지 않도록 주의해야 합니다.",
                      "효능 및 효과":
                        "타가틴정은 위염, 위 및 십이지장 궤양, 역류성 식도염 등의 증상을 개선하는 데 도움을 줍니다. 특히 노인 환자에게는 위 점막의 병변을 개선하여 소화기 건강을 유지하는 데 중요한 역할을 합니다.",
                      "복약 시 주의 사항":
                        "타가틴정을 복용할 때는 졸음이 올 수 있으므로 운전이나 위험한 기계 조작을 피해야 합니다. 또한, 신장 기능이 저하된 환자는 용량을 조절해야 하며, 유당을 함유하고 있어 유당불내증이 있는 환자는 복용을 피해야 합니다. 이 약물은 다른 약물과 상호작용할 수 있으므로, 특히 쿠마린계 항응고제와 함께 복용할 경우 프로트롬빈 시간을 주의 깊게 관찰해야 합니다.",
                    },
                    키워드: {
                      "용법 및 용량": "1회 400mg, 하루 2회, 취침 시 800mg 가능",
                      "효능 및 효과":
                        "위염 개선, 궤양 치료, 역류성 식도염 완화",
                      "복약 시 주의 사항":
                        "졸음 주의, 신장 기능 저하 시 용량 조절, 유당불내증 주의",
                    },
                  },
                  productName: "타가틴정",
                  thicknessMm: "4.7",
                  formCodeName: "나정",
                  manufacturer: "위더스제약(주)",
                  similarity_score: 1,
                },
              ],
            },
            medicationInfo: "천식 예방을 위한 스테로이드 흡입제",
            medicationTimes: ["AFTER_BREAKFAST", "AFTER_DINNER"],
            scheduledTimes: ["08:30", "19:30"],
            isCompleted: false,
            completedAt: undefined,
          },
        ],
      },
      {
        id: "5",
        name: "정환자",
        age: 45,
        diagnosis: "비만 관리",
        last_visit: "2024-12-28",
        status: "양호",
        note: "체중 감량이 순조롭게 진행되고 있습니다.",
        medication_schedule: [
          {
            id: 8,
            seniorId: 5,
            seniorName: "정환자",
            medicationName: "비타민D",
            startDate: "2025-01-01",
            endDate: "2025-01-31",
            description: {
              drug_candidates: [
                {
                  image:
                    "https://nedrug.mfds.go.kr/pbp/cmn/itemImageDownload/1Oi0vWfEzG0",
                  dosage: "",
                  category: "소화성궤양용제",
                  extraInfo: "시메티딘",
                  appearance: "이약은연녹색의원형정제이다.",
                  dosageForm: "원형",
                  description: {
                    상세: {
                      "용법 및 용량":
                        "노인 환자는 신장 기능이 저하될 수 있으므로, 일반 성인 용법인 1회 400mg을 하루 2회 또는 취침 시 800mg으로 투여할 수 있지만, 신장 기능에 따라 용량을 조절해야 합니다. 필요 시 1회 300mg을 하루 4회로 나누어 복용할 수 있으며, 최대 1일 2.4g을 초과하지 않도록 주의해야 합니다.",
                      "효능 및 효과":
                        "타가틴정은 위염, 위 및 십이지장 궤양, 역류성 식도염 등의 증상을 개선하는 데 도움을 줍니다. 특히 노인 환자에게는 위 점막의 병변을 개선하여 소화기 건강을 유지하는 데 중요한 역할을 합니다.",
                      "복약 시 주의 사항":
                        "타가틴정을 복용할 때는 졸음이 올 수 있으므로 운전이나 위험한 기계 조작을 피해야 합니다. 또한, 신장 기능이 저하된 환자는 용량을 조절해야 하며, 유당을 함유하고 있어 유당불내증이 있는 환자는 복용을 피해야 합니다. 이 약물은 다른 약물과 상호작용할 수 있으므로, 특히 쿠마린계 항응고제와 함께 복용할 경우 프로트롬빈 시간을 주의 깊게 관찰해야 합니다.",
                    },
                    키워드: {
                      "용법 및 용량": "1회 400mg, 하루 2회, 취침 시 800mg 가능",
                      "효능 및 효과":
                        "위염 개선, 궤양 치료, 역류성 식도염 완화",
                      "복약 시 주의 사항":
                        "졸음 주의, 신장 기능 저하 시 용량 조절, 유당불내증 주의",
                    },
                  },
                  productName: "타가틴정",
                  thicknessMm: "4.7",
                  formCodeName: "나정",
                  manufacturer: "위더스제약(주)",
                  similarity_score: 1,
                },
              ],
            },
            medicationInfo: "면역력 증진을 위한 비타민",
            medicationTimes: ["AFTER_BREAKFAST"],
            scheduledTimes: ["08:30"],
            isCompleted: false,
            completedAt: undefined,
          },
        ],
      },
    ];

    return mockPatientData.map((dto) => this.mapDtoToEntity(dto));
  }

  /**
   * Mock 보호자용 환자 데이터 반환
   */
  private getMockGuardianPatientData(): PatientData[] {
    const mockGuardianPatientData: PatientDataDto[] = [
      {
        id: "1",
        name: "김환자",
        age: 65,
        diagnosis: "당뇨 관리",
        last_visit: "2025-01-02",
        status: "위험",
        note: "혈당 수치가 불안정하여 주의가 필요합니다.",
        medication_schedule: [
          {
            id: 1,
            seniorId: 1,
            seniorName: "김환자",
            medicationName: "메트포르민",
            startDate: "2025-01-01",
            endDate: "2025-01-31",
            description: {
              drug_candidates: [
                {
                  image:
                    "https://nedrug.mfds.go.kr/pbp/cmn/itemImageDownload/1Oi0vWfEzG0",
                  dosage: "",
                  category: "소화성궤양용제",
                  extraInfo: "시메티딘",
                  appearance: "이약은연녹색의원형정제이다.",
                  dosageForm: "원형",
                  description: {
                    상세: {
                      "용법 및 용량":
                        "노인 환자는 신장 기능이 저하될 수 있으므로, 일반 성인 용법인 1회 400mg을 하루 2회 또는 취침 시 800mg으로 투여할 수 있지만, 신장 기능에 따라 용량을 조절해야 합니다. 필요 시 1회 300mg을 하루 4회로 나누어 복용할 수 있으며, 최대 1일 2.4g을 초과하지 않도록 주의해야 합니다.",
                      "효능 및 효과":
                        "타가틴정은 위염, 위 및 십이지장 궤양, 역류성 식도염 등의 증상을 개선하는 데 도움을 줍니다. 특히 노인 환자에게는 위 점막의 병변을 개선하여 소화기 건강을 유지하는 데 중요한 역할을 합니다.",
                      "복약 시 주의 사항":
                        "타가틴정을 복용할 때는 졸음이 올 수 있으므로 운전이나 위험한 기계 조작을 피해야 합니다. 또한, 신장 기능이 저하된 환자는 용량을 조절해야 하며, 유당을 함유하고 있어 유당불내증이 있는 환자는 복용을 피해야 합니다. 이 약물은 다른 약물과 상호작용할 수 있으므로, 특히 쿠마린계 항응고제와 함께 복용할 경우 프로트롬빈 시간을 주의 깊게 관찰해야 합니다.",
                    },
                    키워드: {
                      "용법 및 용량": "1회 400mg, 하루 2회, 취침 시 800mg 가능",
                      "효능 및 효과":
                        "위염 개선, 궤양 치료, 역류성 식도염 완화",
                      "복약 시 주의 사항":
                        "졸음 주의, 신장 기능 저하 시 용량 조절, 유당불내증 주의",
                    },
                  },
                  productName: "타가틴정",
                  thicknessMm: "4.7",
                  formCodeName: "나정",
                  manufacturer: "위더스제약(주)",
                  similarity_score: 1,
                },
              ],
            },
            medicationInfo: "혈당 조절을 위한 약물",
            medicationTimes: ["AFTER_BREAKFAST", "AFTER_DINNER"],
            scheduledTimes: ["08:30", "19:30"],
            isCompleted: false,
            completedAt: undefined,
          },
        ],
      },
      {
        id: "2",
        name: "이할머니",
        age: 78,
        diagnosis: "관절염 관리",
        last_visit: "2025-01-01",
        status: "주의",
        note: "관절 통증이 심해져서 약물 조정이 필요합니다.",
        medication_schedule: [
          {
            id: 2,
            seniorId: 2,
            seniorName: "이할머니",
            medicationName: "이부프로펜",
            startDate: "2025-01-01",
            endDate: "2025-01-31",
            description: {
              drug_candidates: [
                {
                  image:
                    "https://nedrug.mfds.go.kr/pbp/cmn/itemImageDownload/1Oi0vWfEzG0",
                  dosage: "",
                  category: "소화성궤양용제",
                  extraInfo: "시메티딘",
                  appearance: "이약은연녹색의원형정제이다.",
                  dosageForm: "원형",
                  description: {
                    상세: {
                      "용법 및 용량":
                        "노인 환자는 신장 기능이 저하될 수 있으므로, 일반 성인 용법인 1회 400mg을 하루 2회 또는 취침 시 800mg으로 투여할 수 있지만, 신장 기능에 따라 용량을 조절해야 합니다. 필요 시 1회 300mg을 하루 4회로 나누어 복용할 수 있으며, 최대 1일 2.4g을 초과하지 않도록 주의해야 합니다.",
                      "효능 및 효과":
                        "타가틴정은 위염, 위 및 십이지장 궤양, 역류성 식도염 등의 증상을 개선하는 데 도움을 줍니다. 특히 노인 환자에게는 위 점막의 병변을 개선하여 소화기 건강을 유지하는 데 중요한 역할을 합니다.",
                      "복약 시 주의 사항":
                        "타가틴정을 복용할 때는 졸음이 올 수 있으므로 운전이나 위험한 기계 조작을 피해야 합니다. 또한, 신장 기능이 저하된 환자는 용량을 조절해야 하며, 유당을 함유하고 있어 유당불내증이 있는 환자는 복용을 피해야 합니다. 이 약물은 다른 약물과 상호작용할 수 있으므로, 특히 쿠마린계 항응고제와 함께 복용할 경우 프로트롬빈 시간을 주의 깊게 관찰해야 합니다.",
                    },
                    키워드: {
                      "용법 및 용량": "1회 400mg, 하루 2회, 취침 시 800mg 가능",
                      "효능 및 효과":
                        "위염 개선, 궤양 치료, 역류성 식도염 완화",
                      "복약 시 주의 사항":
                        "졸음 주의, 신장 기능 저하 시 용량 조절, 유당불내증 주의",
                    },
                  },
                  productName: "타가틴정",
                  thicknessMm: "4.7",
                  formCodeName: "나정",
                  manufacturer: "위더스제약(주)",
                  similarity_score: 1,
                },
              ],
            },
            medicationInfo: "통증 완화를 위한 소염제",
            medicationTimes: ["AFTER_BREAKFAST", "AFTER_LUNCH", "AFTER_DINNER"],
            scheduledTimes: ["08:30", "13:30", "19:30"],
            isCompleted: false,
            completedAt: undefined,
          },
        ],
      },
      {
        id: "3",
        name: "박할아버지",
        age: 72,
        diagnosis: "심장병 관리",
        last_visit: "2024-12-30",
        status: "양호",
        note: "혈압이 안정적으로 유지되고 있습니다.",
        medication_schedule: [
          {
            id: 3,
            seniorId: 3,
            seniorName: "박할아버지",
            medicationName: "아스피린",
            startDate: "2025-01-01",
            endDate: "2025-01-31",
            description: {
              drug_candidates: [
                {
                  image:
                    "https://nedrug.mfds.go.kr/pbp/cmn/itemImageDownload/1Oi0vWfEzG0",
                  dosage: "",
                  category: "소화성궤양용제",
                  extraInfo: "시메티딘",
                  appearance: "이약은연녹색의원형정제이다.",
                  dosageForm: "원형",
                  description: {
                    상세: {
                      "용법 및 용량":
                        "노인 환자는 신장 기능이 저하될 수 있으므로, 일반 성인 용법인 1회 400mg을 하루 2회 또는 취침 시 800mg으로 투여할 수 있지만, 신장 기능에 따라 용량을 조절해야 합니다. 필요 시 1회 300mg을 하루 4회로 나누어 복용할 수 있으며, 최대 1일 2.4g을 초과하지 않도록 주의해야 합니다.",
                      "효능 및 효과":
                        "타가틴정은 위염, 위 및 십이지장 궤양, 역류성 식도염 등의 증상을 개선하는 데 도움을 줍니다. 특히 노인 환자에게는 위 점막의 병변을 개선하여 소화기 건강을 유지하는 데 중요한 역할을 합니다.",
                      "복약 시 주의 사항":
                        "타가틴정을 복용할 때는 졸음이 올 수 있으므로 운전이나 위험한 기계 조작을 피해야 합니다. 또한, 신장 기능이 저하된 환자는 용량을 조절해야 하며, 유당을 함유하고 있어 유당불내증이 있는 환자는 복용을 피해야 합니다. 이 약물은 다른 약물과 상호작용할 수 있으므로, 특히 쿠마린계 항응고제와 함께 복용할 경우 프로트롬빈 시간을 주의 깊게 관찰해야 합니다.",
                    },
                    키워드: {
                      "용법 및 용량": "1회 400mg, 하루 2회, 취침 시 800mg 가능",
                      "효능 및 효과":
                        "위염 개선, 궤양 치료, 역류성 식도염 완화",
                      "복약 시 주의 사항":
                        "졸음 주의, 신장 기능 저하 시 용량 조절, 유당불내증 주의",
                    },
                  },
                  productName: "타가틴정",
                  thicknessMm: "4.7",
                  formCodeName: "나정",
                  manufacturer: "위더스제약(주)",
                  similarity_score: 1,
                },
              ],
            },
            medicationInfo: "혈액 순환 개선을 위한 약물",
            medicationTimes: ["AFTER_BREAKFAST"],
            scheduledTimes: ["08:30"],
            isCompleted: false,
            completedAt: undefined,
          },
        ],
      },
      {
        id: "4",
        name: "최환자",
        age: 58,
        diagnosis: "천식 관리",
        last_visit: "2024-12-29",
        status: "주의",
        note: "기침이 심해져서 흡입기 사용법을 재교육했습니다.",
        medication_schedule: [
          {
            id: 4,
            seniorId: 4,
            seniorName: "최환자",
            medicationName: "살부타몰",
            startDate: "2025-01-01",
            endDate: "2025-01-31",
            description: {
              drug_candidates: [
                {
                  image:
                    "https://nedrug.mfds.go.kr/pbp/cmn/itemImageDownload/1Oi0vWfEzG0",
                  dosage: "",
                  category: "소화성궤양용제",
                  extraInfo: "시메티딘",
                  appearance: "이약은연녹색의원형정제이다.",
                  dosageForm: "원형",
                  description: {
                    상세: {
                      "용법 및 용량":
                        "노인 환자는 신장 기능이 저하될 수 있으므로, 일반 성인 용법인 1회 400mg을 하루 2회 또는 취침 시 800mg으로 투여할 수 있지만, 신장 기능에 따라 용량을 조절해야 합니다. 필요 시 1회 300mg을 하루 4회로 나누어 복용할 수 있으며, 최대 1일 2.4g을 초과하지 않도록 주의해야 합니다.",
                      "효능 및 효과":
                        "타가틴정은 위염, 위 및 십이지장 궤양, 역류성 식도염 등의 증상을 개선하는 데 도움을 줍니다. 특히 노인 환자에게는 위 점막의 병변을 개선하여 소화기 건강을 유지하는 데 중요한 역할을 합니다.",
                      "복약 시 주의 사항":
                        "타가틴정을 복용할 때는 졸음이 올 수 있으므로 운전이나 위험한 기계 조작을 피해야 합니다. 또한, 신장 기능이 저하된 환자는 용량을 조절해야 하며, 유당을 함유하고 있어 유당불내증이 있는 환자는 복용을 피해야 합니다. 이 약물은 다른 약물과 상호작용할 수 있으므로, 특히 쿠마린계 항응고제와 함께 복용할 경우 프로트롬빈 시간을 주의 깊게 관찰해야 합니다.",
                    },
                    키워드: {
                      "용법 및 용량": "1회 400mg, 하루 2회, 취침 시 800mg 가능",
                      "효능 및 효과":
                        "위염 개선, 궤양 치료, 역류성 식도염 완화",
                      "복약 시 주의 사항":
                        "졸음 주의, 신장 기능 저하 시 용량 조절, 유당불내증 주의",
                    },
                  },
                  productName: "타가틴정",
                  thicknessMm: "4.7",
                  formCodeName: "나정",
                  manufacturer: "위더스제약(주)",
                  similarity_score: 1,
                },
              ],
            },
            medicationInfo: "기관지 확장을 위한 흡입제",
            medicationTimes: ["BEFORE_BREAKFAST"],
            scheduledTimes: ["07:00"],
          },
        ],
      },
      {
        id: "5",
        name: "정환자",
        age: 45,
        diagnosis: "비만 관리",
        last_visit: "2024-12-28",
        status: "양호",
        note: "체중 감량이 순조롭게 진행되고 있습니다.",
        medication_schedule: [
          {
            id: 5,
            seniorId: 5,
            seniorName: "정환자",
            medicationName: "비타민D",
            startDate: "2025-01-01",
            endDate: "2025-01-31",
            description: {
              drug_candidates: [
                {
                  image:
                    "https://nedrug.mfds.go.kr/pbp/cmn/itemImageDownload/1Oi0vWfEzG0",
                  dosage: "",
                  category: "소화성궤양용제",
                  extraInfo: "시메티딘",
                  appearance: "이약은연녹색의원형정제이다.",
                  dosageForm: "원형",
                  description: {
                    상세: {
                      "용법 및 용량":
                        "노인 환자는 신장 기능이 저하될 수 있으므로, 일반 성인 용법인 1회 400mg을 하루 2회 또는 취침 시 800mg으로 투여할 수 있지만, 신장 기능에 따라 용량을 조절해야 합니다. 필요 시 1회 300mg을 하루 4회로 나누어 복용할 수 있으며, 최대 1일 2.4g을 초과하지 않도록 주의해야 합니다.",
                      "효능 및 효과":
                        "타가틴정은 위염, 위 및 십이지장 궤양, 역류성 식도염 등의 증상을 개선하는 데 도움을 줍니다. 특히 노인 환자에게는 위 점막의 병변을 개선하여 소화기 건강을 유지하는 데 중요한 역할을 합니다.",
                      "복약 시 주의 사항":
                        "타가틴정을 복용할 때는 졸음이 올 수 있으므로 운전이나 위험한 기계 조작을 피해야 합니다. 또한, 신장 기능이 저하된 환자는 용량을 조절해야 하며, 유당을 함유하고 있어 유당불내증이 있는 환자는 복용을 피해야 합니다. 이 약물은 다른 약물과 상호작용할 수 있으므로, 특히 쿠마린계 항응고제와 함께 복용할 경우 프로트롬빈 시간을 주의 깊게 관찰해야 합니다.",
                    },
                    키워드: {
                      "용법 및 용량": "1회 400mg, 하루 2회, 취침 시 800mg 가능",
                      "효능 및 효과":
                        "위염 개선, 궤양 치료, 역류성 식도염 완화",
                      "복약 시 주의 사항":
                        "졸음 주의, 신장 기능 저하 시 용량 조절, 유당불내증 주의",
                    },
                  },
                  productName: "타가틴정",
                  thicknessMm: "4.7",
                  formCodeName: "나정",
                  manufacturer: "위더스제약(주)",
                  similarity_score: 1,
                },
              ],
            },
            medicationInfo: "면역력 증진을 위한 비타민",
            medicationTimes: ["AFTER_BREAKFAST"],
            scheduledTimes: ["08:30"],
            isCompleted: false,
            completedAt: undefined,
          },
        ],
      },
    ];

    return mockGuardianPatientData.map((dto) => this.mapDtoToEntity(dto));
  }

  /**
   * DTO를 Entity로 변환
   */
  private mapDtoToEntity(dto: PatientDataDto): PatientData {
    return {
      id: dto.id,
      name: dto.name,
      age: dto.age,
      diagnosis: dto.diagnosis,
      lastVisit: dto.last_visit,
      status: dto.status,
      note: dto.note,
      medicationSchedule:
        dto.medication_schedule?.map((med) => ({
          id: med.id,
          seniorId: med.seniorId,
          seniorName: med.seniorName,
          medicationName: med.medicationName,
          startDate: med.startDate,
          endDate: med.endDate,
          description: med.description,
          medicationInfo: med.medicationInfo,
          medicationTimes: med.medicationTimes || [],
          scheduledTimes: med.scheduledTimes || [],
          isCompleted: med.isCompleted,
          completedAt: med.completedAt,
        })) || [],
    };
  }

  /**
   * 보호자용 환자 데이터 조회
   */
  async getPatientsForGuardian(guardianId?: number): Promise<PatientData[]> {
    try {
      const response = await patientApi.getPatientsForGuardian(guardianId || 1);
      return response.map((dto: PatientDataDto) => this.mapDtoToEntity(dto));
    } catch (error) {
      console.warn("Patients for guardian API not available, using mock data");
      return this.getMockGuardianPatientData();
    }
  }

  /**
   * 특정 환자 조회
   */
  async getPatient(patientId: number): Promise<Patient> {
    try {
      const response = await patientApi.getPatient(patientId);
      return PatientMapper.toEntity(response);
    } catch (error) {
      // API가 없는 경우 목업 데이터 반환
      console.warn("Patient API not available, using mock data");

      // patientId에 따라 다른 mock 데이터 반환
      const mockPatients: Patient[] = [
        {
          id: 1,
          organizationId: 101,
          organizationName: "서울중앙병원",
          name: "김철수",
          birthDate: new Date("1985-06-15"),
          gender: "MALE",
          admissionDate: new Date("2025-01-05"),
          dischargeDate: new Date("2025-01-15"),
          note: "정기 검진 후 퇴원",
          isActive: false,
          createdAt: new Date("2025-01-01"),
          updatedAt: new Date("2025-01-16"),
          age: 40,
        },
        {
          id: 2,
          organizationId: 102,
          organizationName: "부산의료원",
          name: "이영희",
          birthDate: new Date("1992-03-22"),
          gender: "FEMALE",
          admissionDate: new Date("2025-02-01"),
          dischargeDate: new Date("2025-02-10"),
          note: "감기 치료",
          isActive: false,
          createdAt: new Date("2025-01-28"),
          updatedAt: new Date("2025-02-11"),
          age: 33,
        },
        {
          id: 3,
          organizationId: 103,
          organizationName: "대구대학교병원",
          name: "박민수",
          birthDate: new Date("1978-11-02"),
          gender: "MALE",
          admissionDate: new Date("2025-03-10"),
          dischargeDate: new Date("2025-03-25"),
          note: "교통사고 부상",
          isActive: false,
          createdAt: new Date("2025-03-08"),
          updatedAt: new Date("2025-03-26"),
          age: 46,
        },
        {
          id: 4,
          organizationId: 104,
          organizationName: "인천성모병원",
          name: "최은지",
          birthDate: new Date("2000-09-10"),
          gender: "FEMALE",
          admissionDate: new Date("2025-04-01"),
          dischargeDate: new Date("2025-04-05"),
          note: "건강검진",
          isActive: false,
          createdAt: new Date("2025-03-30"),
          updatedAt: new Date("2025-04-06"),
          age: 24,
        },
        {
          id: 5,
          organizationId: 105,
          organizationName: "광주한빛병원",
          name: "정우성",
          birthDate: new Date("1980-12-25"),
          gender: "MALE",
          admissionDate: new Date("2025-05-12"),
          dischargeDate: new Date("2025-05-22"),
          note: "수술 후 회복",
          isActive: false,
          createdAt: new Date("2025-05-10"),
          updatedAt: new Date("2025-05-23"),
          age: 44,
        },
        {
          id: 6,
          organizationId: 106,
          organizationName: "대전선병원",
          name: "한지민",
          birthDate: new Date("1995-07-18"),
          gender: "FEMALE",
          admissionDate: new Date("2025-06-01"),
          dischargeDate: new Date("2025-06-07"),
          note: "피부 알레르기 치료",
          isActive: false,
          createdAt: new Date("2025-05-30"),
          updatedAt: new Date("2025-06-08"),
          age: 29,
        },
        {
          id: 7,
          organizationId: 107,
          organizationName: "울산대학병원",
          name: "서준호",
          birthDate: new Date("1988-05-05"),
          gender: "MALE",
          admissionDate: new Date("2025-07-20"),
          dischargeDate: new Date("2025-07-28"),
          note: "허리 통증 치료",
          isActive: false,
          createdAt: new Date("2025-07-18"),
          updatedAt: new Date("2025-07-29"),
          age: 37,
        },
        {
          id: 8,
          organizationId: 108,
          organizationName: "창원한마음병원",
          name: "김수연",
          birthDate: new Date("1999-11-11"),
          gender: "FEMALE",
          admissionDate: new Date("2025-08-01"),
          dischargeDate: new Date("2025-08-05"),
          note: "위염 치료",
          isActive: false,
          createdAt: new Date("2025-07-30"),
          updatedAt: new Date("2025-08-06"),
          age: 25,
        },
        {
          id: 9,
          organizationId: 109,
          organizationName: "포항세명기독병원",
          name: "장동건",
          birthDate: new Date("1975-04-14"),
          gender: "MALE",
          admissionDate: new Date("2025-09-10"),
          dischargeDate: new Date("2025-09-20"),
          note: "심장 수술",
          isActive: false,
          createdAt: new Date("2025-09-08"),
          updatedAt: new Date("2025-09-21"),
          age: 50,
        },
        {
          id: 10,
          organizationId: 110,
          organizationName: "제주대병원",
          name: "오나래",
          birthDate: new Date("1993-01-30"),
          gender: "FEMALE",
          admissionDate: new Date("2025-10-05"),
          dischargeDate: new Date("2025-10-12"),
          note: "출산",
          isActive: true,
          createdAt: new Date("2025-10-01"),
          updatedAt: new Date("2025-10-12"),
          age: 32,
        },
      ];

      // patientId에 해당하는 환자 찾기
      const mockPatient =
        mockPatients.find((p) => p.id === patientId) || mockPatients[0];

      return mockPatient;
    }
  }

  /**
   * 활력 징후 조회
   */
  async getPatientVitalSign(patientId: number, date: Date): Promise<VitalSign> {
    try {
      const response = await patientApi.getVitalSign(patientId, {
        date: formatDate(date),
      });
      return {
        ...response,
        updateAt: parseDateTime(response.updateAt),
        createdAt: parseDateTime(response.createdAt),
        updatedAt: parseDateTime(response.updatedAt),
        measuredDate: parseDate(response.measuredDate),
      };
    } catch (error) {
      throw new Error("Failed to get patient vital signs");
    }
  }

  /**
   * 활력 징후 수정 (지정 날짜)
   */
  async updateVitalSign(
    patientId: number,
    date: Date,
    data: {
      systolic: number | null;
      diastolic: number | null;
      bloodGlucose: number | null;
      temperature: number | null;
    }
  ): Promise<VitalSign> {
    try {
      const response = await patientApi.updateVitalSign(
        patientId,
        { date: formatDate(date) },
        data
      );
      return {
        ...response,
        updateAt: parseDateTime(response.updateAt),
        createdAt: parseDateTime(response.createdAt),
        updatedAt: parseDateTime(response.updatedAt),
        measuredDate: parseDate(response.measuredDate),
      };
    } catch (error) {
      throw new Error("Failed to update patient vital sign");
    }
  }
  /**
   * 특정 날짜 활력 징후 조회
   */
  async getPatientVitalSignsByRange(
    patientId: number,
    params: {
      startDate: Date;
      endDate: Date;
    }
  ): Promise<VitalSign[]> {
    try {
      const response = await patientApi.getVitalSignsByRange(patientId, {
        startDate: formatDate(params.startDate),
        endDate: formatDate(params.endDate),
      });
      return response.map((dto) => ({
        ...dto,
        updateAt: parseDateTime(dto.updateAt),
        createdAt: parseDateTime(dto.createdAt),
        updatedAt: parseDateTime(dto.updatedAt),
        measuredDate: parseDate(dto.measuredDate),
      }));
    } catch (error) {
      throw new Error("Failed to get patient vital signs");
    }
  }

  /**
   * 환자 관찰 일지 조회
   */
  async getPatientObservationRecord(
    significantId: number
  ): Promise<ObservationRecord> {
    try {
      const response = await patientApi.getPatientObservationRecord(
        significantId
      );
      return PatientMapper.observationRecordDtoToEntity(response);
    } catch (error) {
      throw new Error("Failed to get patient observation record");
    }
  }

  /**
   * 환자 관찰 일지 목록 조회
   */
  async getPatientObservationRecords(
    seniorId: number,
    filters: {
      page: number;
      size: number;
      startDate: Date;
      endDate: Date;
    }
  ): Promise<OffsetPaginated<ObservationRecord[]>> {
    try {
      const response = await patientApi.getPatientObservationRecords(
        seniorId,
        {
          startDate: formatDate(filters.startDate),
          endDate: formatDate(filters.endDate),
        },
        {
          page: filters.page ?? 1,
          size: filters.size ?? 10,
        }
      );
      return {
        pageInfo: response.pageInfo,
        data:
          response.result?.map((dto) =>
            PatientMapper.observationRecordDtoToEntity(dto)
          ) ?? [],
      };
    } catch (error) {
      throw new Error("Failed to get patient observation records");
    }
  }

  /**
   * 환자 관찰 일지 추가
   */
  async addPatientObservationRecord(
    patientId: number,
    data: ObservationRecord
  ): Promise<ObservationRecord> {
    try {
      const requestDto = PatientMapper.observationRecordToAddRequestDto(data);
      const response = await patientApi.addPatientObservationRecord(
        patientId,
        requestDto
      );
      return PatientMapper.observationRecordDtoToEntity(response.result);
    } catch (error) {
      throw new Error("Failed to add patient observation record");
    }
  }

  /**
   * 환자 관찰 일지 수정
   */
  async updatePatientObservationRecord(
    recordId: number,
    data: ObservationRecord
  ): Promise<ObservationRecord> {
    try {
      const requestDto =
        PatientMapper.observationRecordToUpdateRequestDto(data);
      const response = await patientApi.updatePatientObservationRecord(
        recordId,
        requestDto
      );
      const updatedData = {
        ...data,
        content: response.content,
      } satisfies ObservationRecord;
      return updatedData;
    } catch (error) {
      throw new Error("Failed to update patient observation record");
    }
  }

  /**
   * 환자 관찰 일지 삭제
   */
  async deletePatientObservationRecord(recordId: number): Promise<void> {
    try {
      await patientApi.deletePatientObservationRecord(recordId);
    } catch (error) {
      throw new Error("Failed to delete patient observation record");
    }
  }

  /**
   * 환자 통계 조회
   */
  async getPatientStats(nurseId?: string): Promise<{
    totalPatients: number;
    newPatientsThisMonth: number;
    averageAge: number;
    genderDistribution: { male: number; female: number };
  }> {
    try {
      const params = nurseId ? { nurse_id: nurseId } : {};
      const response = await patientApi.getPatientStats(params);

      return {
        totalPatients: response.total_patients,
        newPatientsThisMonth: response.new_patients_this_month,
        averageAge: response.average_age,
        genderDistribution: response.gender_distribution,
      };
    } catch (error) {
      // API가 없는 경우 목업 데이터 반환
      console.warn("Patient stats API not available, using mock data");

      return {
        totalPatients: 3,
        newPatientsThisMonth: 1,
        averageAge: 68.3,
        genderDistribution: { male: 2, female: 1 },
      };
    }
  }

  /**
   * Mock Significant 데이터 생성
   */
  private getMockSignificantData(): PatientList[] {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const mockData = [
      {
        significantId: 1,
        senior: {
          id: 1,
          name: "김환자",
          gender: "MALE" as const,
          note: "혈당 수치가 불안정하여 주의가 필요합니다.",
          age: 65,
        },
        content:
          "혈당 수치가 200mg/dL로 높게 측정되었습니다. 식이조절과 운동이 필요합니다.",
        level: 3,
        levelText: "위험" as const,
        createdAt: today.toISOString(),
        lastHospitalVisit: "2025-01-02 09:30:00",
        nurse: {
          id: 1,
          name: "박간호사",
          email: "nurse.park@hospital.com",
          phoneNumber: "010-1234-5678",
        },
        guardian: {
          id: 1,
          name: "김아들",
          email: "kim.son@email.com",
          phoneNumber: "010-9876-5432",
        },
      },
      {
        significantId: 2,
        senior: {
          id: 2,
          name: "이할머니",
          gender: "FEMALE" as const,
          note: "관절 통증이 심해져서 약물 조정이 필요합니다.",
          age: 78,
        },
        content: "무릎 관절 통증 호소, 진통제 효과가 제한적입니다.",
        level: 2,
        levelText: "주의" as const,
        createdAt: yesterday.toISOString(),
        lastHospitalVisit: "2025-01-01 13:00:00",
        nurse: {
          id: 2,
          name: "김간호사",
          email: "nurse.kim@hospital.com",
          phoneNumber: "010-2345-6789",
        },
        guardian: {
          id: 2,
          name: "이딸",
          email: "lee.daughter@email.com",
          phoneNumber: "010-8765-4321",
        },
      },
      {
        significantId: 3,
        senior: {
          id: 3,
          name: "박할아버지",
          gender: "MALE" as const,
          note: "혈압이 안정적으로 유지되고 있습니다.",
          age: 72,
        },
        content:
          "혈압 측정 결과 정상 범위 내에서 안정적으로 유지되고 있습니다.",
        level: 1,
        levelText: "양호" as const,
        createdAt: new Date(
          today.getTime() - 2 * 24 * 60 * 60 * 1000
        ).toISOString(), // 2일 전
        lastHospitalVisit: "2024-12-30 15:00:00",
        nurse: {
          id: 3,
          name: "이간호사",
          email: "nurse.lee@hospital.com",
          phoneNumber: "010-3456-7890",
        },
        guardian: {
          id: 3,
          name: "박아들",
          email: "park.son@email.com",
          phoneNumber: "010-7654-3210",
        },
      },
    ];

    return mockData;
  }

  /**
   * Mock 오늘 복약 내역 데이터 생성 (새로운 API 응답 구조)
   */
  private getMockTodayMedicationSchedules(): TodayMedicationSchedule[] {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    return [
      {
        schedulesId: 1,
        seniorId: 1,
        seniorName: "박할아버지",
        medicationName: "아스피린",
        id: 7,
        medicationPhotoPath: null,
        medicatedAt: null,
        medicationTime: "AFTER_BREAKFAST",
        scheduledTime: "08:30",
        medicationDate: today,
      },
      {
        schedulesId: 1,
        seniorId: 1,
        seniorName: "박할아버지",
        medicationName: "아스피린",
        id: 8,
        medicationPhotoPath: null,
        medicatedAt: null,
        medicationTime: "BEFORE_DINNER",
        scheduledTime: "18:00",
        medicationDate: today,
      },
      {
        schedulesId: 2,
        seniorId: 2,
        seniorName: "이할머니",
        medicationName: "혈압약",
        id: 9,
        medicationPhotoPath: null,
        medicatedAt: null,
        medicationTime: "BEFORE_BREAKFAST",
        scheduledTime: "07:00",
        medicationDate: today,
      },
      {
        schedulesId: 2,
        seniorId: 2,
        seniorName: "이할머니",
        medicationName: "혈압약",
        id: 10,
        medicationPhotoPath: null,
        medicatedAt: null,
        medicationTime: "AFTER_DINNER",
        scheduledTime: "19:30",
        medicationDate: today,
      },
      {
        schedulesId: 3,
        seniorId: 3,
        seniorName: "김환자",
        medicationName: "당뇨약",
        id: 11,
        medicationPhotoPath: null,
        medicatedAt: null,
        medicationTime: "BEFORE_LUNCH",
        scheduledTime: "12:00",
        medicationDate: today,
      },
      {
        schedulesId: 3,
        seniorId: 3,
        seniorName: "김환자",
        medicationName: "당뇨약",
        id: 12,
        medicationPhotoPath: null,
        medicatedAt: null,
        medicationTime: "BEDTIME",
        scheduledTime: "21:00",
        medicationDate: today,
      },
    ];
  }

  /**
   * 간호사 담당 환자들 조회
   */
  async getSeniorEmployees(): Promise<SeniorEmployee[]> {
    try {
      const response = await patientApi.getSeniorEmployees({
        page: 1,
        size: 99999,
      });
      return (
        response.result?.map((dto) =>
          PatientMapper.seniorEmployeeToEntity(dto)
        ) ?? []
      );
    } catch (error) {
      throw new Error("Failed to get senior employees");
    }
  }

  async getPatientDetailAll(patientId: number): Promise<PatientDetailAll> {
    const response = await patientApi.getPatientDetailAll(patientId);
    return PatientMapper.patientDetailAllResponseDtoToEntity(response);
  }

  /**
   * 모든 환자의 최근 관찰 기록 조회
   */
  async getRecentObservationRecord(): Promise<ObservationRecords[]> {
    try {
      const response = await patientApi.getRecentObservationRecord();
      return response.map((dto) =>
        PatientMapper.observationRecordsToEntity(dto)
      );
    } catch (error) {
      console.warn("API not available, using mock data:", error);
      return this.getMockRecentObservationRecord();
    }
  }

  private getMockRecentObservationRecord(): ObservationRecords[] {
    return [
      {
        id: 1,
        senior: {
          id: 1,
          name: "김환자",
          gender: "MALE",
          note: "혈당 수치가 불안정하여 주의가 필요합니다.",
          age: 65,
        },
        content:
          "혈당 수치가 200mg/dL로 높게 측정되었습니다. 식이조절과 운동이 필요합니다.",
        level: "HIGH",
        createdAt: new Date(2025, 8, 13, 10, 0, 0),
        updatedAt: new Date(2025, 8, 13, 10, 0, 0),
        isDeleted: false,
        nurse: {
          id: 1,
          name: "박간호사",
          email: "nurse.park@hospital.com",
          phoneNumber: "010-1234-5678",
        },
        guardian: {
          id: 1,
          name: "김아들",
          email: "kim.son@email.com",
          phoneNumber: "010-9876-5432",
        },
        lastHospitalVisit: new Date(2025, 8, 13, 10, 0, 0),
      },
    ];
  }

  /**
   * 환자 메모 조회
   */
  async getPatientMemo(patientId: number): Promise<PatientMemo> {
    const response = await patientApi.getPatientMemo(patientId);
    return { patientId: response.seniorId, note: response.note };
  }

  /**
   * 환자 메모 업데이트
   */
  async updatePatientMemo(
    patientId: number,
    memo: PatientMemo
  ): Promise<PatientMemo> {
    const response = await patientApi.updatePatientMemo(patientId, {
      note: memo.note,
    });
    return { patientId: response.seniorId, note: response.note };
  }
}
