export const redactPHI = (obj: any) => {
  if (!obj || typeof obj !== "object") return obj;
  const clone: any = Array.isArray(obj) ? [] : {};
  for (const k of Object.keys(obj)) {
    if (["ssn", "password", "token"].includes(k)) clone[k] = "***";
    else if (obj[k] && typeof obj[k] === "object") clone[k] = redactPHI(obj[k]);
    else clone[k] = obj[k];
  }
  return clone;
};
