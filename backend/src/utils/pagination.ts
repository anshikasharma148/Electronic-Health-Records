export const parsePagination = (q: any) => {
  const page = Number(q.page || 1);
  const limit = Number(q.limit || 20);
  return { page, limit, skip: (page - 1) * limit };
};
