import yaml from 'js-yaml';
import xml2js from 'xml2js';
import { Buffer } from 'buffer'; // Native in Node.js
import querystring from 'querystring'; // For x-www-form-urlencoded
import { FormData } from 'formdata-node';

export default async function parseBody(body, contentType) {

  switch (contentType.split(";")[0].trim().toLowerCase()) {
    case 'application/json':
      return parseJSON(body);

    case 'application/xml':
    case 'text/xml':
      return await parseXML(body);

    case 'application/x-yaml':
    case 'text/yaml':
      return parseYAML(body);

    case 'text/csv':
      return parseCSV(body);

    case 'text/plain':
      return body;

    case 'application/x-www-form-urlencoded':
      return parseFormUrlEncoded(body);

    case 'multipart/form-data':
      return body;

    case 'application/graphql':
      return parseGraphQL(body);

    case 'application/octet-stream':
      return parseBinary(body);

    default:
      throw new Error(`Unsupported content type: ${contentType}`);
  }
}

// Helper: Parse JSON
function parseJSON(body) {
  try {
    return JSON.parse(body);
  } catch (error) {
    throw new Error('Invalid JSON format');
  }
}

// Helper: Parse XML
async function parseXML(body) {
  try {
    const parser = new xml2js.Parser({ explicitArray: false });
    return await parser.parseStringPromise(body);
  } catch (error) {
    throw new Error('Invalid XML format');
  }
}

// Helper: Parse YAML
function parseYAML(body) {
  try {
    return yaml.load(body);
  } catch (error) {
    throw new Error('Invalid YAML format');
  }
}

// Helper: Parse CSV
function parseCSV(body) {
  const lines = body.trim().split(/\r?\n/);
  const headers = lines[0].split(',').map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim());
    return headers.reduce((obj, header, index) => {
      obj[header] = values[index] || '';
      return obj;
    }, {});
  });
}

// Helper: Parse x-www-form-urlencoded
function parseFormUrlEncoded(body) {
  return querystring.parse(body);
}

// Helper: Parse GraphQL
function parseGraphQL(body) {
  try {
    return JSON.parse(body); // GraphQL is typically sent as JSON
  } catch (error) {
    throw new Error('Invalid GraphQL format');
  }
}

// Helper: Parse Binary Data
function parseBinary(body) {
  return Buffer.from(body, 'binary');
}
