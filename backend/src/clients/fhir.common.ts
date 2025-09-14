import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { env } from "../config/env";

let client: AxiosInstance | null = null;

export const getFhirClient = async (): Promise<AxiosInstance> => {
  if (client) return client;

  const baseURL = env.ehrUrl || "https://sandbox.practicefusion.com/fhir";
  client = axios.create({ baseURL });

  client.interceptors.request.use((c: InternalAxiosRequestConfig) => {
    const token = Buffer.from(`${env.ehrClientId}:${env.ehrClientSecret}`).toString("base64");

    c.headers = {
      ...c.headers,
      Authorization: `Basic ${token}`
    } as InternalAxiosRequestConfig["headers"];

    return c;
  });

  return client;
};
