import { listAppointments, bookAppointment } from "../../services/appointmentService";
import Appointment from "../../models/Appointment";
import Patient from "../../models/Patient";

jest.mock("../../models/Appointment");
jest.mock("../../models/Patient");

describe("Appointment Service", () => {
  it("listAppointments returns paginated appointments", async () => {
    (Appointment.find as jest.Mock).mockReturnValue({ populate: () => ({ skip: () => ({ limit: () => Promise.resolve([]) }) }) });
    (Appointment.countDocuments as jest.Mock).mockResolvedValue(0);
    const result = await listAppointments({});
    expect(result.items).toEqual([]);
  });

  it("bookAppointment throws if patient not found", async () => {
    (Patient.findById as jest.Mock).mockResolvedValue(null);
    await expect(bookAppointment({ patient: "123", providerId: "p1", start: new Date(), end: new Date() }))
      .rejects.toThrow("patient_not_found");
  });
});
