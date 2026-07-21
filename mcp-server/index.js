const path = require('path');
const dns = require('node:dns');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Override DNS servers to allow resolving Atlas mongodb+srv URIs
dns.setServers(["1.1.1.1", "8.8.8.8"]);
const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");

// Load environment variables from mcp-server/.env first, then fallback to api/.env
dotenv.config();
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: path.join(__dirname, '../api/.env') });
}

// Import mongoose models from the local models folder
const Form = require('./models/Form');
const Response = require('./models/Response');

// Initialize MCP Server
const server = new Server(
  {
    name: "form-builder-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register list of available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_forms",
        description: "Retrieve a list of all form configurations.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_form",
        description: "Retrieve details of a specific form configuration by its unique name.",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "The unique name of the form (e.g., 'contact-us')"
            }
          },
          required: ["name"]
        }
      },
      {
        name: "create_or_update_form",
        description: "Create a new form configuration or update an existing one.",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "The unique system name of the form (e.g., 'contact-us')"
            },
            displayName: {
              type: "string",
              description: "The human-readable display name of the form (e.g., 'Contact Us')"
            },
            config: {
              type: "array",
              description: "Array of form field definitions",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  label: { type: "string" },
                  type: { type: "string" },
                  required: { type: "boolean" },
                  options: { type: "array", items: { type: "string" } }
                },
                required: ["name", "label", "type"]
              }
            },
            _id: {
              type: "string",
              description: "Optional MongoDB ObjectId of the form if updating an existing one"
            }
          },
          required: ["name", "displayName", "config"]
        }
      },
      {
        name: "delete_form",
        description: "Delete a form configuration by its unique name, along with all associated submitted responses.",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "The unique name of the form to delete"
            }
          },
          required: ["name"]
        }
      },
      {
        name: "submit_response",
        description: "Submit response/data for a form configuration.",
        inputSchema: {
          type: "object",
          properties: {
            formId: {
              type: "string",
              description: "The unique name of the form (references Form.name)"
            },
            data: {
              type: "object",
              description: "Dynamic payload matching the form configuration fields"
            }
          },
          required: ["formId", "data"]
        }
      },
      {
        name: "get_responses",
        description: "Retrieve all submitted responses for a specific form.",
        inputSchema: {
          type: "object",
          properties: {
            formId: {
              type: "string",
              description: "The unique name of the form (Form.name)"
            }
          },
          required: ["formId"]
        }
      },
      {
        name: "delete_response",
        description: "Delete form response(s) by specific response ID (_id) or all responses for a form (formId).",
        inputSchema: {
          type: "object",
          properties: {
            responseId: {
              type: "string",
              description: "The unique MongoDB ObjectId (_id) of a specific response to delete"
            },
            formId: {
              type: "string",
              description: "The unique name of the form (Form.name) to delete all responses for"
            }
          }
        }
      }
    ]
  };
});

// Register tool execution handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "list_forms": {
        const forms = await Form.find().sort({ updatedAt: -1 });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(forms, null, 2),
            },
          ],
        };
      }
      case "get_form": {
        const form = await Form.findOne({ name: args.name });
        if (!form) {
          return {
            content: [{ type: "text", text: `Form '${args.name}' not found.` }],
            isError: true,
          };
        }
        return {
          content: [{ type: "text", text: JSON.stringify(form, null, 2) }],
        };
      }
      case "create_or_update_form": {
        const { name, displayName, config, _id } = args;
        const filter = _id ? { _id } : { name };
        
        if (!_id) {
          const isExistingForm = await Form.findOne({ name });
          if (isExistingForm) {
            return {
              content: [{ type: "text", text: `Error: Form with name '${name}' already exists.` }],
              isError: true,
            };
          }
        }

        const form = await Form.findOneAndUpdate(
          filter,
          {
            $set: {
              name,
              displayName,
              config,
              updatedAt: Date.now(),
            },
          },
          { new: true, upsert: true }
        );

        return {
          content: [
            {
              type: "text",
              text: `Form successfully saved:\n${JSON.stringify(form, null, 2)}`,
            },
          ],
        };
      }
      case "delete_form": {
        const result = await Form.findOneAndDelete({ name: args.name });
        if (!result) {
          return {
            content: [{ type: "text", text: `Form '${args.name}' not found.` }],
            isError: true,
          };
        }
        await Response.deleteMany({ formId: args.name });
        return {
          content: [{ type: "text", text: `Form '${args.name}' and all associated responses deleted successfully.` }],
        };
      }
      case "submit_response": {
        const { formId, data } = args;
        // Verify form exists first
        const form = await Form.findOne({ name: formId });
        if (!form) {
          return {
            content: [{ type: "text", text: `Error: Form with ID/name '${formId}' does not exist.` }],
            isError: true,
          };
        }
        const submission = new Response({ formId, data });
        await submission.save();
        return {
          content: [
            {
              type: "text",
              text: `Response submitted successfully:\n${JSON.stringify(submission, null, 2)}`,
            },
          ],
        };
      }
      case "get_responses": {
        const responses = await Response.find({ formId: args.formId }).sort({ submittedAt: -1 });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(responses, null, 2),
            },
          ],
        };
      }
      case "delete_response": {
        const { responseId, formId } = args;
        if (!responseId && !formId) {
          return {
            content: [{ type: "text", text: "Error: Either 'responseId' or 'formId' must be provided." }],
            isError: true,
          };
        }
        if (responseId) {
          const result = await Response.findByIdAndDelete(responseId);
          if (!result) {
            return {
              content: [{ type: "text", text: `Response with ID '${responseId}' not found.` }],
              isError: true,
            };
          }
          return {
            content: [{ type: "text", text: `Response '${responseId}' deleted successfully.` }],
          };
        } else {
          const result = await Response.deleteMany({ formId });
          return {
            content: [{ type: "text", text: `Deleted ${result.deletedCount} response(s) for form '${formId}'.` }],
          };
        }
      }
      default:
        throw new Error(`Tool not found: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error executing tool '${name}': ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Express server app for HTTP / SSE Serverless deployment on Vercel
const express = require('express');
const cors = require('cors');
const { SSEServerTransport } = require("@modelcontextprotocol/sdk/server/sse.js");

const app = express();
app.use(cors());
app.use(express.json());

let sseTransport;

const connectDB = async () => {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) return;
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI);
  }
};

app.get('/sse', async (req, res) => {
  await connectDB();
  sseTransport = new SSEServerTransport('/message', res);
  await server.connect(sseTransport);
});

app.post('/message', async (req, res) => {
  await connectDB();
  if (sseTransport) {
    await sseTransport.handlePostMessage(req, res);
  } else {
    res.status(400).json({ error: "SSE connection not established" });
  }
});

app.get('/', async (req, res) => {
  await connectDB();
  res.json({
    status: "online",
    name: "form-builder-mcp",
    version: "1.0.0",
    endpoints: {
      sse: "/mcp/sse",
      message: "/mcp/message"
    }
  });
});

module.exports = app;

// Start the server using Stdio transport if executed directly via CLI
if (require.main === module) {
  async function main() {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      console.error("Error: MONGODB_URI environment variable is required.");
      process.exit(1);
    }

    try {
      await mongoose.connect(MONGODB_URI);
      console.error("✅ Connected to MongoDB");

      const transport = new StdioServerTransport();
      await server.connect(transport);
      console.error("🚀 Form Builder MCP Server running on Stdio");
    } catch (error) {
      console.error("Failed to start MCP server:", error);
      process.exit(1);
    }
  }
  main();
}
