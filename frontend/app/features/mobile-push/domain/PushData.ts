interface MedicinePushData {
  type: "medicine";
  message: string;
  data: {
    seniorId: number;
  };
}

interface MeetingPushData {
  type: "meeting";
  message: string;
  data: {
    meetingId: number;
  };
}

export type PushData = MedicinePushData | MeetingPushData;
