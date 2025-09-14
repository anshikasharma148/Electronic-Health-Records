import { checkEligibility, createClaim } from "../../services/billingService";
import { BillingClaim } from "../../models/Billing";

jest.mock("../../models/Billing");

describe("Billing Service", () => {
  it("checkEligibility returns eligibility result", async () => {
    const result = await checkEligibility("patient123");
    expect(result.eligible).toBe(true);
  });

  it("createClaim creates a billing claim", async () => {
    (BillingClaim.create as jest.Mock).mockResolvedValue({ code: "C001", amount: 500 });
    const result = await createClaim({ code: "C001", amount: 500 });
    expect(result.code).toBe("C001");
  });
});
