// Lịch ngày làm việc dùng để lùi hạn khi ngày cuối cùng rơi vào ngày nghỉ.
// Chỉ đưa vào đây những năm đã được người có thẩm quyền đối chiếu với thông báo chính thức
// (nghỉ lễ, Tết, ngày hoán đổi, ngày làm bù). Năm chưa có ở đây thì engine KHÔNG lùi hạn
// và giữ ngày theo quy định (sớm hơn, an toàn hơn), kèm calendarStatus='UNAVAILABLE'.
export type WorkingCalendarYear={nonWorkingDays:string[],workingDays:string[],source:string,approvedBy:string,approvedAt:string};
export type WorkingCalendar={years:Record<string,WorkingCalendarYear>};
export const APPROVED_WORKING_CALENDAR:WorkingCalendar={years:{}};
