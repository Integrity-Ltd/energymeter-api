import Joi from "joi";

/**
 * Validate powermeter with Joi
 * 
 * @param energy_meter the powermeter object to validate 
 * @returns true if validation successfully done
 */
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
