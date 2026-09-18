export const formSchema = {
    type: "object",
    properties: {
        formName: {
            type: "string"
        },

        fields: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        enum: [
                            "text",
                            "textarea",
                            "email",
                            "password",
                            "number",
                            "decimal",
                            "currency",
                            "mobile",
                            "date",
                            "timestamp",
                            "checkbox",
                            "toggle",
                            "radio",
                            "dropdown",
                            "multiselect",
                            "heading",
                            "file"
                        ]
                    },

                    name: {
                        type: "string"
                    },

                    label: {
                        type: "string"
                    },

                    value: {
                        type: ["string", "number", "boolean", "null"]
                    },

                    placeholder: {
                        type: ["string", "null"]
                    },

                    required: {
                        type: "boolean"
                    },

                    disabled: {
                        type: "boolean"
                    },

                    width: {
                        type: "string",
                        enum: [
                            "100%",
                            "50%",
                            "33%",
                            "25%"
                        ]
                    },

                    options: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                label: {
                                    type: "string"
                                },
                                value: {
                                    type: ["string", "number", "boolean"]
                                }
                            },
                            required: ["label", "value"],
                            additionalProperties: false
                        }
                    },

                    validations: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                type: {
                                    type: "string",
                                    enum: [
                                        "required",
                                        "email",
                                        "min",
                                        "max",
                                        "minLength",
                                        "maxLength",
                                        "pattern"
                                    ]
                                },
                                value: {
                                    type: ["string", "number", "boolean", "null"]
                                }
                            },
                            required: ["type", "value"],
                            additionalProperties: false
                        }
                    },

                    min: {
                        type: ["number", "null"]
                    },

                    max: {
                        type: ["number", "null"]
                    },

                    pattern: {
                        type: ["string", "null"]
                    },

                    precision: {
                        type: ["number", "null"]
                    },

                    currency: {
                        type: ["string", "null"]
                    },

                    headingTextAlignment: {
                        type: ["string", "null"],
                        enum: [
                            "left",
                            "center",
                            "right",
                            "",
                            null
                        ]
                    }
                },

                required: [
                    "type",
                    "name",
                    "label",
                    "value",
                    "placeholder",
                    "required",
                    "disabled",
                    "width",
                    "options",
                    "validations",
                    "min",
                    "max",
                    "pattern",
                    "precision",
                    "currency",
                    "headingTextAlignment"
                ],

                additionalProperties: false
            }
        }
    },

    required: [
        "formName",
        "fields"
    ],

    additionalProperties: false
};