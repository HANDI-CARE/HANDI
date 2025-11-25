import {
  formatDate,
  formatDateTime,
  parseDate,
  parseDateTime,
} from "../../../../shared/utils/dateUtils";
import type { MedicationItem } from "../../domain/MedicationItem";
import type {
  ObservationRecord,
  ObservationRecordLevel,
} from "../../domain/ObservationRecord";
import type {
  ConsultationSchedule,
  Guardian,
  MedicationMinimal,
  MedicationSchedule,
  MedicationSchedulesMinimal,
  Nurse,
  ObservationRecords,
  Patient,
  PatientDetailAll,
  PatientList,
  Senior,
  SeniorEmployee,
  SeniorEmployeeWithObservationRecord,
  TodayMedicationSchedule,
} from "../../domain/Patient";
import type {
  AddObservationRecordRequestDto,
  ConsultationScheduleResponseDto,
  GetObservationRecordResponseDto,
  GuardianDto,
  MedicatationDto,
  MedicationMinimalDto,
  MedicationScheduleDto,
  MedicationSchedulesMinimalDto,
  NurseDto,
  ObservationRecordsDto,
  PatientDetailAllResponseDto,
  PatientListDto,
  PatientResponseDto,
  SeniorDto,
  SeniorEmployeeResponseDto,
  TodayMedicationScheduleDto,
  UpdateObservationRecordRequestDto,
} from "../../infrastructure/dto/PatientDto";

/**
 * PatientMapper
 * 환자 관련 엔티티와 DTO 간의 데이터 변환을 담당
 */
export class PatientMapper {
  /**
   * PatientResponseDto를 Patient로 변환
   */
  static toEntity(dto: PatientResponseDto): Patient {
    return {
      ...dto,
      birthDate: parseDate(dto.birthDate),
      admissionDate: dto.admissionDate ? parseDate(dto.admissionDate) : null,
      dischargeDate: dto.dischargeDate ? parseDate(dto.dischargeDate) : null,
      createdAt: parseDateTime(dto.createdAt),
      updatedAt: parseDateTime(dto.updatedAt),
    };
  }

  /**
   * Patient를 PatientResponseDto로 변환
   */
  static toDto(entity: Patient): PatientResponseDto {
    return {
      ...entity,
      birthDate: formatDate(entity.birthDate),
      admissionDate: entity.admissionDate
        ? formatDate(entity.admissionDate)
        : null,
      dischargeDate: entity.dischargeDate
        ? formatDate(entity.dischargeDate)
        : null,
      createdAt: formatDateTime(entity.createdAt),
      updatedAt: formatDateTime(entity.updatedAt),
    };
  }

  static patientDetailAllResponseDtoToEntity(
    dto: PatientDetailAllResponseDto
  ): PatientDetailAll {
    return {
      ...dto,
      birthDate: parseDate(dto.birthDate),
      admissionDate: dto.admissionDate ? parseDate(dto.admissionDate) : null,
      dischargeDate: dto.dischargeDate ? parseDate(dto.dischargeDate) : null,
      createdAt: parseDateTime(dto.createdAt),
      updatedAt: parseDateTime(dto.updatedAt),
      relatedUsers: dto.relatedUsers.map((user) => ({
        ...user,
        relationCreatedAt: parseDateTime(user.relationCreatedAt),
      })),
    };
  }

  /**
   * ObservationRecordResponseDto를 ObservationRecord로 변환
   */
  static observationRecordDtoToEntity(
    dto: GetObservationRecordResponseDto
  ): ObservationRecord {
    return {
      ...dto,
      createdAt: parseDateTime(dto.createdAt),
      updatedAt: parseDateTime(dto.updatedAt),
    };
  }

  /**
   * ObservationRecord를 ObservationRecordResponseDto로 변환
   */
  static observationRecordToDto(
    entity: ObservationRecord
  ): GetObservationRecordResponseDto {
    return {
      ...entity,
      createdAt: formatDateTime(entity.createdAt),
      updatedAt: formatDateTime(entity.updatedAt),
    };
  }

  /**
   * ObservationRecord를 AddObservationRecordRequestDto로 변환
   */
  static observationRecordToAddRequestDto(
    entity: ObservationRecord
  ): AddObservationRecordRequestDto {
    return {
      content: entity.content,
      level: entity.level as ObservationRecordLevel,
    };
  }

  /**
   * ObservationRecord를 UpdateObservationRecordRequestDto로 변환
   */
  static observationRecordToUpdateRequestDto(
    entity: ObservationRecord
  ): UpdateObservationRecordRequestDto {
    return {
      content: entity.content,
      level: entity.level as ObservationRecordLevel,
    };
  }

  /**
   * ConsultationScheduleResponseDto를 ConsultationSchedule로 변환
   */
  static scheduleToEntity(
    dto: ConsultationScheduleResponseDto
  ): ConsultationSchedule {
    return {
      id: dto.id,
      nurseId: dto.nurse_id,
      date: parseDate(dto.date),
      timeSlot: dto.time_slot,
      isAvailable: dto.is_available,
      createdAt: parseDateTime(dto.created_at),
      updatedAt: parseDateTime(dto.updated_at),
      patientId: dto.patient_id,
      patientName: dto.patient_name,
      consultationType: dto.consultation_type,
      notes: dto.notes,
    };
  }

  /**
   * ConsultationSchedule를 ConsultationScheduleResponseDto로 변환
   */
  static scheduleToDto(
    entity: ConsultationSchedule
  ): ConsultationScheduleResponseDto {
    return {
      id: entity.id,
      nurse_id: entity.nurseId,
      date: entity.date.toISOString().split("T")[0], // YYYY-MM-DD
      time_slot: entity.timeSlot,
      is_available: entity.isAvailable,
      patient_id: entity.patientId,
      patient_name: entity.patientName,
      consultation_type: entity.consultationType,
      notes: entity.notes,
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString(),
    };
  }

  /**
   * SeniorDto를 Senior로 변환
   */
  static seniorToEntity(dto: SeniorDto): Senior {
    return {
      id: dto.id,
      name: dto.name,
      gender: dto.gender,
      note: dto.note,
      age: dto.age,
    };
  }

  /**
   * NurseDto를 Nurse로 변환
   */
  static nurseToEntity(dto: NurseDto): Nurse {
    return {
      id: dto.id,
      name: dto.name,
      email: dto.email,
      phoneNumber: dto.phoneNumber,
    };
  }

  /**
   * GuardianDto를 Guardian으로 변환
   */
  static guardianToEntity(dto: GuardianDto): Guardian {
    return {
      id: dto.id,
      name: dto.name,
      email: dto.email,
      phoneNumber: dto.phoneNumber,
    };
  }

  /**
   * PatientListDto를 PatientList로 변환
   */
  static patientListToEntity(dto: PatientListDto): PatientList {
    // level을 levelText로 변환
    const levelTextMap = {
      HIGH: "위험" as const,
      MEDIUM: "주의" as const,
      LOW: "양호" as const,
    };

    return {
      significantId: dto.significantId,
      senior: PatientMapper.seniorToEntity(dto.senior),
      content: dto.content,
      level: dto.level === "HIGH" ? 3 : dto.level === "MEDIUM" ? 2 : 1,
      levelText: levelTextMap[dto.level],
      createdAt: dto.createdAt,
      lastHospitalVisit: dto.lastHospitalVisit,
      nurse: PatientMapper.nurseToEntity(dto.nurse),
      guardian: PatientMapper.guardianToEntity(dto.guardian),
    };
  }

  /**
   * PatientListDto 배열을 PatientList 배열로 변환
   */
  static patientListToEntityList(dtos: PatientListDto[]): PatientList[] {
    return dtos.map((dto) => PatientMapper.patientListToEntity(dto));
  }

  /**
   * MedicationScheduleDto를 MedicationSchedule로 변환
   */
  static medicationScheduleToEntity(
    dto: MedicationScheduleDto
  ): MedicationSchedule {
    return {
      id: dto.id,
      seniorId: dto.seniorId,
      seniorName: dto.seniorName,
      medicationName: dto.medicationName,
      startDate: dto.startDate,
      endDate: dto.endDate,
      description: dto.description,
      medicationInfo: dto.medicationInfo,
      medicationTimes: dto.medicationTimes || [],
      scheduledTimes: dto.scheduledTimes || [],
      isCompleted: dto.isCompleted || false,
      completedAt: dto.completedAt || undefined,
    };
  }

  /**
   * MedicationScheduleDto 배열을 MedicationSchedule 배열로 변환
   */
  static medicationScheduleToEntityList(
    dtos: MedicationScheduleDto[]
  ): MedicationSchedule[] {
    return dtos.map((dto) => PatientMapper.medicationScheduleToEntity(dto));
  }

  /**
   * TodayMedicationScheduleDto를 TodayMedicationSchedule로 변환
   */
  static todayMedicationScheduleToEntity(
    dto: TodayMedicationScheduleDto
  ): TodayMedicationSchedule {
    return {
      schedulesId: dto.schedulesId,
      seniorId: dto.seniorId,
      seniorName: dto.seniorName,
      medicationName: dto.medicationName,
      id: dto.id,
      medicationPhotoPath: dto.medicationPhotoPath,
      medicatedAt: dto.medicatedAt,
      medicationTime: dto.medicationTime,
      scheduledTime: dto.scheduledTime,
      medicationDate: dto.medicationDate,
    };
  }

  /**
   * TodayMedicationScheduleDto 배열을 TodayMedicationSchedule 배열로 변환
   */
  static todayMedicationScheduleToEntityList(
    dtos: TodayMedicationScheduleDto[]
  ): TodayMedicationSchedule[] {
    return dtos.map((dto) =>
      PatientMapper.todayMedicationScheduleToEntity(dto)
    );
  }

  /**
   * MedicationDto를 MedicationItem으로 변환
   */
  static medicationToEntity(dto: MedicatationDto): MedicationItem {
    return {
      ...dto,
      medicatedAt: dto.medicatedAt ? parseDateTime(dto.medicatedAt) : null,
      medicationDate: parseDate(dto.medicationDate),
      createdAt: parseDateTime(dto.createdAt),
      updatedAt: parseDateTime(dto.updatedAt),
    };
  }

  /**
   * MedicationMinimalDto를 MedicationMinimal로 변환
   */
  static medicationMinimalToEntity(
    dto: MedicationMinimalDto
  ): MedicationMinimal {
    return {
      ...dto,
      medicatedAt: dto.medicatedAt ? parseDateTime(dto.medicatedAt) : null,
      medicationDate: parseDate(dto.medicationDate),
      createdAt: parseDateTime(dto.createdAt),
      updatedAt: parseDateTime(dto.updatedAt),
    };
  }

  static medicationSchedulesMinimalToEntity(
    dto: MedicationSchedulesMinimalDto
  ): MedicationSchedulesMinimal {
    return {
      ...dto,
      medications: dto.medications.map((medication) =>
        this.medicationMinimalToEntity(medication)
      ),
    };
  }

  static seniorEmployeeToEntity(
    dto: SeniorEmployeeResponseDto
  ): SeniorEmployee {
    return {
      id: dto.id,
      organizationId: dto.organizationId,
      organizationName: dto.organizationName,
      name: dto.name,
      birthDate: parseDate(dto.birthDate),
      admissionDate: dto.admissionDate ? parseDate(dto.admissionDate) : null,
      dischargeDate: dto.dischargeDate ? parseDate(dto.dischargeDate) : null,
      gender: dto.gender,
      note: dto.note,
      isActive: dto.isActive,
      createdAt: parseDateTime(dto.createdAt),
      updatedAt: parseDateTime(dto.updatedAt),
      age: dto.age,
    };
  }

  static seniorEmployeeToDto(
    entity: SeniorEmployee
  ): SeniorEmployeeResponseDto {
    return {
      id: entity.id,
      organizationId: entity.organizationId,
      organizationName: entity.organizationName,
      name: entity.name,
      birthDate: formatDate(entity.birthDate),
      admissionDate: entity.admissionDate
        ? formatDate(entity.admissionDate)
        : null,
      dischargeDate: entity.dischargeDate
        ? formatDate(entity.dischargeDate)
        : null,
      gender: entity.gender,
      note: entity.note,
      isActive: entity.isActive,
      createdAt: formatDateTime(entity.createdAt),
      updatedAt: formatDateTime(entity.updatedAt),
      age: entity.age,
    };
  }

  static observationRecordsToEntity(
    dto: ObservationRecordsDto
  ): ObservationRecords {
    return {
      id: dto.id || 0,
      senior: {
        id: dto.senior.id,
        name: dto.senior.name,
        gender: dto.senior.gender as "MALE" | "FEMALE",
        note: dto.senior.note,
        age: dto.senior.age,
      },
      content: dto.content,
      level: dto.level,
      createdAt: dto.createdAt ? parseDateTime(dto.createdAt) : null,
      updatedAt: dto.updatedAt ? parseDateTime(dto.updatedAt) : null,
      isDeleted: dto.isDeleted || false,
      nurse: PatientMapper.nurseToEntity(dto.nurse),
      guardian: PatientMapper.guardianToEntity(dto.guardian),
      lastHospitalVisit: dto.lastHospitalVisit
        ? parseDateTime(dto.lastHospitalVisit)
        : null,
    };
  }

  static observationRecordsToDto(
    entity: ObservationRecords
  ): ObservationRecordsDto {
    return {
      id: entity.id || 0,
      senior: {
        id: entity.senior.id,
        name: entity.senior.name,
        gender: entity.senior.gender as "MALE" | "FEMALE",
        note: entity.senior.note,
        age: entity.senior.age,
      },
      content: entity.content,
      level: entity.level,
      createdAt: entity.createdAt ? formatDateTime(entity.createdAt) : null,
      updatedAt: entity.updatedAt ? formatDateTime(entity.updatedAt) : null,
      isDeleted: entity.isDeleted,
      nurse: {
        id: entity.nurse.id,
        name: entity.nurse.name,
        email: entity.nurse.email,
        phoneNumber: entity.nurse.phoneNumber,
      },
      guardian: {
        id: entity.guardian.id,
        name: entity.guardian.name,
        email: entity.guardian.email,
        phoneNumber: entity.guardian.phoneNumber,
      },
      lastHospitalVisit: entity.lastHospitalVisit
        ? formatDateTime(entity.lastHospitalVisit)
        : null,
    };
  }

  /**
   * SeniorEmployeeWithObservationRecord를 PatientList로 변환
   */
  static seniorEmployeeWithObservationToPatientList(
    entity: SeniorEmployeeWithObservationRecord
  ): PatientList {
    // level을 levelText로 변환
    const levelTextMap = {
      HIGH: "위험" as const,
      MEDIUM: "주의" as const,
      LOW: "양호" as const,
    };

    const level =
      entity.observationRecord?.level === "HIGH"
        ? 3
        : entity.observationRecord?.level === "MEDIUM"
        ? 2
        : 1;

    const levelText =
      entity.observationRecord?.level === "HIGH"
        ? "위험"
        : entity.observationRecord?.level === "MEDIUM"
        ? "주의"
        : "양호";

    return {
      significantId: entity.observationRecord?.id || 0,
      senior: {
        id: entity.id,
        name: entity.name,
        gender: entity.gender,
        note: entity.note,
        age: entity.age,
      },
      content: entity.observationRecord?.content || "관찰일지 없음",
      level,
      levelText,
      createdAt: formatDateTime(
        entity.observationRecord?.createdAt ?? new Date()
      ),
      lastHospitalVisit: formatDateTime(
        entity.observationRecord?.lastHospitalVisit ?? new Date()
      ),
      nurse: entity.observationRecord?.nurse || {
        id: 0,
        name: "정보 없음",
        email: "",
        phoneNumber: "",
      },
      guardian: entity.observationRecord?.guardian || {
        id: 0,
        name: "정보 없음",
        email: "",
        phoneNumber: "",
      },
    };
  }
}
