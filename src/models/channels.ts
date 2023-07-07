import Joi from "joi";

const validate = (channels: object): Joi.ValidationResult => {
    const schema = Joi.object().keys({
        energy_meter_id: Joi.number().required(),
        channel: Joi.number().required(),
        channel_name: Joi.string(),
        enabled: Joi.boolean().required(),
    });
    return schema.validate(channels);
}

export default { validate };
