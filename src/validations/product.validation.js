import Joi from "joi";
export const validateCreateProductStep1 = (req, res, next) => {
  const { productCategory, productTitle, description, modelName } = req.body;

  if (!productCategory || !productTitle || !description || !modelName) {
    return res.status(400).json({
      success: false,
      message:
        "productCategory, productTitle, description and modelName are required",
    });
  }

  next();
};


export const validateProductModelFeatures = (req, res, next) => {
  const schema = Joi.object({
    productFeaturesIcons: Joi.array()
      .items(Joi.string().trim())
      .optional(),

    standardParameters: Joi.array()
      .items(
        Joi.object({
          iconName: Joi.string()
            .valid("ECG", "RESPIRATION", "SPO2", "NIBP", "TEMP", "PR")
            .required(),
        })
      )
      .optional(),

    optiomalParameters: Joi.array()
      .items(
        Joi.object({
          iconName: Joi.string()
            .valid("ETCO2", "IBP")
            .required(),
        })
      )
      .optional(),
  }).min(1); // 🔒 at least one field must be sent

  const { error } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid model features payload",
      errors: error.details.map((e) => e.message),
    });
  }

  next();
};

export const validateAddProductModel = (req, res, next) => {
  const schema = Joi.object({
    modelName: Joi.string().trim().min(2).required(),
    status: Joi.string().valid("Padding", "Live").optional(),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  next();
};


// ---  Update opration

export const validateUpdateProduct = (req, res, next) => {
  const schema = Joi.object({
    productCategory: Joi.string().valid("1", "2", "3", "4").optional(),
    productTitle: Joi.string().trim().optional(),
    description: Joi.string().trim().optional(),
  }).min(1); // At least one field required

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  next();
};

