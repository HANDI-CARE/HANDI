import type { OffsetPaginatedRequestParams } from "~/shared/infrastructure/api/dto";
import type { TodayMedicationSchedule } from "../../domain/Task";
import { taskApi } from "../../infrastructure/api/taskApi";
import { TaskMapper } from "../mappers/TaskMapper";

export class TaskService {
  private readonly basePath = "/tasks";

  // 싱글톤 인스턴스
  private static instance: TaskService | null = null;

  // 싱글톤 인스턴스 반환
  public static getInstance(): TaskService {
    if (!TaskService.instance) {
      TaskService.instance = new TaskService();
    }
    return TaskService.instance;
  }

  // 생성자를 private으로 만들어 외부에서 new로 생성 불가
  private constructor() {}

  /**
   * 오늘 복약 일정 조회
   */
  async getTodayMedicationSchedules(params: OffsetPaginatedRequestParams): Promise<TodayMedicationSchedule[]> {
    try {
      const response = await taskApi.getTodayMedicationSchedules(params);
      return response.result?.map((dto) => TaskMapper.toEntity(dto)) || [];
    } catch (error) {
      console.warn("Failed to get today medication schedules");
      const mockSchedules: TodayMedicationSchedule[] = [
        {
          id: 1,
          schedulesId: 1,
          medicationName: "혈압약",
          seniorId: 1,
          seniorName: "김할머니",
          medicationPhotoPath: "https://via.placeholder.com/150",
          medicatedAt: new Date("2025-08-13T09:20:00"),
          medicationDate: new Date("2025-08-13"),
          medicationTime: "AFTER_BREAKFAST",
          medicationExactTime: new Date("2025-08-13T09:20:00"),
          createdAt: new Date("2025-08-11T09:00:00"),
          updatedAt: new Date("2025-08-11T09:00:00"),
        },
        {
          id: 2,
          schedulesId: 2,
          medicationName: "혈당약",
          seniorId: 2,
          seniorName: "이할아버지",
          medicationPhotoPath: "https://via.placeholder.com/151",
          medicatedAt: null,
          medicationDate: new Date("2025-08-13"),
          medicationTime: "AFTER_LUNCH",
          medicationExactTime: new Date("2025-08-13T12:00:00"),
          createdAt: new Date("2025-08-11T12:00:00"),
          updatedAt: new Date("2025-08-11T12:00:00"),
        },
        {
          id: 3,
          schedulesId: 3,
          medicationName: "혈당약",
          seniorId: 3,
          seniorName: "박환자",
          medicationPhotoPath: "https://via.placeholder.com/152",
          medicatedAt: null,
          medicationDate: new Date("2025-08-13"),
          medicationTime: "AFTER_DINNER",
          medicationExactTime: new Date("2025-08-13T18:30:00"),
          createdAt: new Date("2025-08-11T18:00:00"),
          updatedAt: new Date("2025-08-11T18:00:00"),
        }
      ];
      return mockSchedules;
    }
  }
}