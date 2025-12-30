export const validateCreateProduct = (body) => {
  const {
    productCategory,
    productTitle,
    description,
    price,
  } = body;

  if (!productCategory || !productTitle || !description || price === undefined) {
    return "Missing required fields";
  }

  return null;
};

export const validateBulkProduct = (body) => {
  const {
    productCategory,
    productTitles,
    description,
    price,
  } = body;

  if (!productCategory || !productTitles || !description || price === undefined) {
    return "Missing required fields";
  }

  return null;
};
