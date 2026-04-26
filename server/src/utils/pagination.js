export const getPagination = (query, { maxLimit = 50 } = {}) => {
  const parsedPage = Number.parseInt(query.page, 10);
  const parsedLimit = Number.parseInt(query.limit, 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const hasLimit = Number.isFinite(parsedLimit) && parsedLimit > 0;
  const limit = hasLimit ? Math.min(parsedLimit, maxLimit) : 0;
  const skip = limit > 0 ? (page - 1) * limit : 0;

  return {
    page,
    limit,
    skip,
  };
};

export const buildPagination = ({ total, page, limit }) => {
  if (!limit) {
    return {
      page: 1,
      limit: 0,
      total,
      totalPages: total > 0 ? 1 : 0,
      hasMore: false,
    };
  }

  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasMore: page < totalPages,
  };
};
