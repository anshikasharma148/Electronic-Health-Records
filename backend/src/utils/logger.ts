export const log = (...args: any[]) => {
  process.stdout.write(args.map(a => (typeof a === "string" ? a : JSON.stringify(a))).join(" ") + "\n");
};
