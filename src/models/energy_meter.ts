import Joi from "joi";

const validate = (energy_meter: object): Joi.ValidationResult => {
    const schema = Joi.object().keys({
        asset_name: Joi.string(),
        ip_address: Joi.string().required(),
        port: Joi.number().required(),
        time_zone: Joi.string().required(),
        enabled: Joi.boolean().required(),
    });
    return schema.validate(energy_meter);
}

export default { validate };
