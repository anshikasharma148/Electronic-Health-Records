import { getFhirClient } from "../clients/fhir.common";

export const searchPatients = async (q: string) => {
  const client = await getFhirClient();
  const res = await client.get(`/Patient`, { params: { name: q } });
  return res.data;
};

export const getPatient = async (ehrId: string) => {
  const client = await getFhirClient();
  const res = await client.get(`/Patient/${ehrId}`);
  return res.data;
};
