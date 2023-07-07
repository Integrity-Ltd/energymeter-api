import Joi from "joi";

const validate = (report: object): Joi.ValidationResult => {
    const schema = Joi.object().keys({
        fromdate: Joi.string().isoDate().required(),
        todate: Joi.string().isoDate().required(),
        ip: Joi.string().ip().required(),
        channel: Joi.optional(),
        details: Joi.string().regex(/^(hourly|daily|monthly)$/).required(),
    });
    return schema.validate(report);
}

export default { validate };
