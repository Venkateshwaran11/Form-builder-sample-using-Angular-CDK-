import Groq from "groq-sdk";
import { formSchema } from "../models/aiFormModel.js";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});


export async function generateForm(prompt, currentForm) {
  const hasExistingForm = currentForm && Array.isArray(currentForm.fields) && currentForm.fields.length > 0;
  const systemPrompt = `
    You are an AI form builder.

Your job is to CREATE new forms or MODIFY existing forms.

AVAILABLE FIELD TYPES:

text
textarea
email
password
number
decimal
currency
mobile
date
timestamp
checkbox
toggle
radio
dropdown
multiselect
heading
file


IMPORTANT FIELD RULE:

EVERY field MUST contain ALL of these properties:

type
name
label
value
placeholder
required
disabled
width
options
validations
min
max
pattern
precision
currency
headingTextAlignment

Never omit any property.

For unused properties use:

string -> ""
unused scalar -> null
options -> []
validations -> []


VALUE RULES:

text -> ""
textarea -> ""
email -> ""
password -> ""
number -> null
decimal -> null
currency -> null
mobile -> ""
date -> ""
timestamp -> ""
checkbox -> false
toggle -> false
file -> null


REQUIRED RULE:

Use:

"required": true

Do NOT create:

{
  "type": "required",
  "value": true
}


VALIDATION TYPES:

email
min
max
minLength
maxLength
pattern


OPTIONS:

Only normally use options for:

dropdown
multiselect
radio

For other fields use:

"options": []


WIDTH:

Allowed values:

100%
50%
33%
25%


CREATE MODE:

If there is no existing form:

Create a complete form based on the user's request.


MODIFY MODE:

If an existing form is provided:

1. Preserve ALL existing fields.
2. Add fields when requested.
3. Remove fields only when explicitly requested.
4. Modify fields only when explicitly requested.
5. Do not unnecessarily rename fields.
6. Do not unnecessarily change existing properties.
7. Return the COMPLETE updated form.
8. The response must contain unchanged fields AND changed/new fields.

For example:

Existing form:

Name
Email
Date

User says:

"Add age field"

Correct result:

Name
Email
Date
Age

NOT just:

Age


Return ONLY valid JSON.
Do not return markdown.
Do not return explanations.
Do not return Angular code.
`;


  /*
  |--------------------------------------------------------------------------
  | IMPORTANT:
  | Send the existing form to the AI.
  |--------------------------------------------------------------------------
  */

  const sanitizedCurrentForm = hasExistingForm ? {
    formName: currentForm.formName || 'Untitled Form',
    fields: currentForm.fields.map(field => ({
      type: field.type,
      name: field.name,
      label: field.label,
      value: field.value ?? (['number', 'decimal', 'currency'].includes(field.type) ? null : ['checkbox', 'toggle'].includes(field.type) ? false : ''),
      placeholder: field.placeholder ?? '',
      required: Boolean(field.required),
      disabled: Boolean(field.disabled),
      width: field.width || '100%',
      options: Array.isArray(field.options) ? field.options : [],
      validations: Array.isArray(field.validations) ? field.validations.filter(v => v && typeof v === 'object' && v.type) : [],
      min: field.min ?? null,
      max: field.max ?? null,
      pattern: typeof field.pattern === 'string' ? field.pattern : null,
      precision: field.precision ?? null,
      currency: field.currency ?? null,
      headingTextAlignment: field.headingTextAlignment ?? 'left'
    }))
  } : null;

  const userMessage = hasExistingForm

    ? ` Here is the CURRENT FORM:

${JSON.stringify(sanitizedCurrentForm, null, 2)}

USER REQUEST:

${prompt}

Apply the user's request to the current form.

Preserve all existing fields unless the user explicitly asks to remove them.

Return the COMPLETE updated form.
`

    : `
There is no existing form.

Create a new form based on this request:

${prompt}

Return the complete form.
`;


  console.log("AI Prompt:", prompt);
  console.log("Has Existing Form:", hasExistingForm);

  if (hasExistingForm) {
    console.log(
      "Existing fields:",
      sanitizedCurrentForm.fields.map(field => field.name)
    );
  }


  const response =
    await groq.chat.completions.create({

      model:
        process.env.GROQ_MODEL ||
        "openai/gpt-oss-20b",

      max_tokens: 4096,

      messages: [

        {
          role: "system",
          content: systemPrompt
        },

        {
          role: "user",
          content: userMessage
        }

      ],

      response_format: {

        type: "json_schema",

        json_schema: {

          name: "form_configuration",

          strict: true,

          schema: formSchema

        }

      }

    });


  const content =
    response?.choices?.[0]?.message?.content;


  if (!content) {
    throw new Error(
      "Groq returned an empty response"
    );
  }


  try {

    return JSON.parse(content);

  } catch (error) {

    console.error(
      "Invalid AI JSON:",
      content
    );

    throw new Error(
      "AI returned invalid JSON"
    );
  }
}