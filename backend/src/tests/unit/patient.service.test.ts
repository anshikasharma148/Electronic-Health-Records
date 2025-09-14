import { searchPatients, createPatient } from "../../services/patientService";
import Patient from "../../models/Patient";

jest.mock("../../models/Patient");

describe("Patient Service", () => {
  it("searchPatients returns matching patients", async () => {
    (Patient.find as jest.Mock).mockReturnValue({
      skip: () => ({ limit: () => Promise.resolve([{ firstName: "John" }]) })
    });
    (Patient.countDocuments as jest.Mock).mockResolvedValue(1);
    const result = await searchPatients("John", {});
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.total).toBe(1);
  });

  it("createPatient creates a patient", async () => {
    (Patient.create as jest.Mock).mockResolvedValue({ firstName: "Jane" });
    const result = await createPatient({ firstName: "Jane", lastName: "Doe", dob: new Date(), gender: "F" });
    expect(result.firstName).toBe("Jane");
  });
});
