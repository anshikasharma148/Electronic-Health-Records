export type BillingCode = {
  code: string
  description: string
  fee: number
  type: "CPT" | "ICD" | "HCPCS" | "Other"
}

const billingCodes: BillingCode[] = [
  { code: "99213", description: "Office visit, established patient, 15 min", fee: 75, type: "CPT" },
  { code: "99214", description: "Office visit, established patient, 25 min", fee: 125, type: "CPT" },
  { code: "99203", description: "Office visit, new patient, 30 min", fee: 140, type: "CPT" },
  { code: "99204", description: "Office visit, new patient, 45 min", fee: 210, type: "CPT" },
  { code: "90471", description: "Immunization administration (first)", fee: 25, type: "HCPCS" },
  { code: "93000", description: "Electrocardiogram, complete", fee: 45, type: "CPT" },
  { code: "36415", description: "Collection of venous blood by venipuncture", fee: 12, type: "CPT" },
  { code: "87086", description: "Urine culture, bacterial", fee: 28, type: "CPT" },
  { code: "80050", description: "General health panel", fee: 95, type: "CPT" },
  { code: "E11.9", description: "Type 2 diabetes mellitus without complications", fee: 0, type: "ICD" },
  { code: "I10", description: "Essential (primary) hypertension", fee: 0, type: "ICD" },
  { code: "J06.9", description: "Acute upper respiratory infection, unspecified", fee: 0, type: "ICD" },
  { code: "Z00.00", description: "Encounter for general adult medical exam w/o abnormal findings", fee: 0, type: "ICD" },
  { code: "Z23", description: "Encounter for immunization", fee: 0, type: "ICD" }
]

export default billingCodes
