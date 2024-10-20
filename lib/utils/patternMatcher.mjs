// Function to convert Maps to Objects for readable console output
function mapToObject(mappings) {
  const obj = {};
  for (let [key, value] of mappings.entries()) {
      obj[key] = {
          pattern: value.pattern,
          dataTypes: Object.fromEntries(value.dataTypes)
      };
  }
  return obj;
}

// Function to match URLs to patterns using Maps for improved performance
export default function matchURLToPatterns(files, patterns) {

  // Function to build the required_key string
  const buildRequiredKey = (pattern, dataTypes) => {
    // Split the pattern by '/' and process the dynamic segments
    const segments = pattern.split('/').map(segment => {
        if (segment.startsWith(':')) {
            const key = segment.slice(1); // Remove the leading colon ':'
            const dataType = dataTypes.get(key);

            // If dataType is null, just keep the key without the data type
            return dataType === null ? `:${key}` : `[:${key}=${dataType}]`;
        }
        return segment; // Return static segments as they are
    });

    // Rebuild the pattern with the types added
    return segments.join('/');
  };

  const mappings = new Map();

  // Define data type priority using a Map for faster lookups
  const dataTypePriority = new Map([
      ['number', 20],
      ['string', 20],
      ['uuid', 20],
      ['email', 15],
      ['version', 15],
      ['alphanumeric', 15],
      ['boolean', 15],
      ['date', 15],
      ['phone', 15],
      ['ip', 15],
      ['hex', 15],
      ['slug', 15],
      ['else', 10]
  ]);

  files.forEach(file => {
      let bestMatch = null;
      let highestScore = -1;
      let bestDataTypes = new Map();
      let bestParams = {};

      patterns.forEach(pattern => {
          const fileParts = file.split('/').filter(Boolean);
          const patternParts = pattern.split('/').filter(Boolean);

          // Check if the file matches the pattern by segment length
          if (fileParts.length === patternParts.length) {
              const { score, dataTypes, params } = matchPattern(fileParts, patternParts, dataTypePriority);

              if (score > highestScore) {
                  bestMatch = buildMappedPattern(patternParts, dataTypes);
                  highestScore = score;
                  bestDataTypes = dataTypes;
                  bestParams = params; // Store the best path parameters
              }
          }
      });
     
      if (bestMatch) {
          // Generate the required_key using the best match pattern and data types
          const requiredKey = buildRequiredKey(bestMatch, bestDataTypes);
          mappings.set(file, {
              pattern: bestMatch,
              dataTypes: bestDataTypes,
              required_key: requiredKey,
              params: bestParams // Include the best parameters
          });
      } else {
        mappings.set(file, {
          pattern: file,
          dataTypes: new Map(),
          required_key: file,
          params: {} // No dynamic params for this case
      });
      }
  });

  return mappings;
}

// Helper function to match pattern and calculate score
function matchPattern(fileParts, patternParts, dataTypePriority) {
  let score = 0;
  const dataTypes = new Map();
  const params = {}; // Store matched dynamic parameters

  for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const filePart = fileParts[i];

      if (patternPart.startsWith('[:') && patternPart.endsWith(']')) {
          // Extract parameter name and data type, e.g., [:id=number]
          const insideBrackets = patternPart.slice(2, -1); // Removes '[:' from start and ']' from end
          const [param, dataType] = insideBrackets.split('=');

          if (!param || !dataType) {
              // Invalid pattern segment, skip this pattern
              return { score: -1, dataTypes: new Map(), params: {} };
          }

          // Validate data type
          if (!validateDataType(filePart, dataType)) {
              return { score: -1, dataTypes: new Map() }; // Invalid data type, reject pattern
          }

          // Update score based on data type priority
          score += dataTypePriority.get(dataType) || 10; // Default priority if undefined

          dataTypes.set(param, dataType);
          params[param] = filePart; // Capture the parameter value from the file
      } else if (patternPart.startsWith(':')) {
          // Handle generic dynamic segments without specified data types
          const param = patternPart.slice(1);
          if (!param) {
              // Invalid parameter name, skip this pattern
              return { score: -1, dataTypes: new Map(), params: {} };
          }

          score += 10; // Lower priority for generic segments

          dataTypes.set(param, null);
          params[param] = filePart; // Capture the parameter value
      } else if (patternPart === filePart) {
          // Exact static segment match
          score += 20;
      } else if (patternPart === ':else') {
          // Fallback pattern segment
          score += 5;
          dataTypes.set('else', null);
      } else {
          // Mismatch in static segment, reject pattern
          return { score: -1, dataTypes: new Map(), params: {} };
      }
  }

  return { score, dataTypes, params };
}

// Helper function to build the mapped pattern string
function buildMappedPattern(patternParts, dataTypes) {
  return patternParts.map(part => {
      if (part.startsWith('[:') && part.endsWith(']')) {
          const insideBrackets = part.slice(2, -1); // Extract content inside '[:' and ']'
          const [param] = insideBrackets.split('='); // Get parameter name
          return `:${param}`; // Single colon prefix
      }
      if (part.startsWith(':')) {
          return part; // Keep generic dynamic segments as-is
      }
      return part; // Static segments remain unchanged
  }).join('/');
}

// Helper function to validate data types using regular expressions
function validateDataType(segment, dataType) {
  switch (dataType) {
      case 'number':
          return /^\d+$/.test(segment); // Only digits
      case 'string':
          return /^[a-zA-Z]+$/.test(segment); // Only letters
      case 'alphanumeric':
          return /^[a-zA-Z0-9]+$/.test(segment); // Letters and numbers
      case 'boolean':
          return /^(true|false)$/.test(segment); // true or false
      case 'version':
          return /^v\d+$/.test(segment); // e.g., v1, v2
      case 'uuid':
          return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(segment); // UUID format
      case 'date':
          return /^\d{4}-\d{2}-\d{2}$/.test(segment); // YYYY-MM-DD
      case 'email':
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(segment); // Basic email format
      case 'phone':
          return /^\+?\d{1,15}$/.test(segment); // International phone numbers
      case 'ip':
          return /^(25[0-5]|2[0-4]\d|1\d{2}|\d{1,2})(\.(25[0-5]|2[0-4]\d|1\d{2}|\d{1,2})){3}$/.test(segment); // IPv4
      case 'hex':
          return /^[a-fA-F0-9]+$/.test(segment); // Hexadecimal
      case 'slug':
          return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(segment); // Slugs like 'my-first-post'
      case 'else':
          return /^[a-zA-Z]+$/.test(segment); // Fallback treated as string
      default:
          return true; // Allow any value if data type is unspecified
  }
}

// // Example usage:
// const matchStrings = [
//   '/product/[:id=number]',                      // Product with numeric id
//   '/product/[:name=string]',                    // Product with name as string
//   '/product/[:random=alphanumeric]',            // Product with alphanumeric value
//   '/product/:else',                             // Product fallback, treated as string
//   '/profile/[:userId=number]/details',          // Profile details with userId as number
//   '/cart/[:cartId=alphanumeric]',               // Cart with alphanumeric cartId
//   '/order/[:orderId=number]/items',             // Order with numeric orderId
//   '/checkout/[:step=string]',                   // Checkout step as a string
//   '/dashboard/[:username=string]/overview',     // Dashboard overview with username
//   '/dashboard/[:userId=number]/overview',       // Dashboard overview with numeric userId
//   '/config/[:flag=boolean]',                    // Boolean value for flags (true/false)
//   '/api/[:version=version]',                    // Versioning pattern (e.g., v1, v2)
//   '/session/[:uuid=uuid]',                      // Matches UUID format
//   '/birthdate/[:date=date]',                    // Matches date format
//   '/contact/[:email=email]',                    // Matches email format
//   '/phone/[:phone=phone]',                      // Matches international phone numbers
//   '/ip/[:ip=ip]',                               // Matches IPv4 addresses
//   '/color/[:hex=hex]',                          // Matches hex values
//   '/blog/[:slug=slug]',                         // Matches slugs (URL-friendly)
//   '/service/[:version=version]/status',         // Service version with status
//   '/user/[:userId=number]/orders',              // User orders by userId
//   '/order/[:orderId=number]/payment',           // Order payment with orderId
//   '/item/[:itemId=uuid]',                       // Item by UUID
//   '/login/[:username=string]',                  // Login by username
//   '/track/[:slug=slug]/details',                // Track details by slug
//   '/product/[:id=number]/user/[:name=string]',  // Product and user with multiple dynamic segments
// ];

// // Example URLs to test:
// const files = [
//   '/product/123',                                      // Should match '/product/[:id=number]'
//   '/product/laptop',                                   // Should match '/product/[:name=string]'
//   '/product/abc123',                                   // Should match '/product/[:random=alphanumeric]'
//   '/product/anything',                                 // Should match '/product/:else'
//   '/product/ABC123',                                   // Should match '/product/[:random=alphanumeric]'
//   '/profile/45/details',                               // Should match '/profile/[:userId=number]/details'
//   '/cart/abc123',                                      // Should match '/cart/[:cartId=alphanumeric]'
//   '/order/432/items',                                  // Should match '/order/[:orderId=number]/items'
//   '/checkout/payment',                                 // Should match '/checkout/[:step=string]'
//   '/dashboard/alex/overview',                          // Should match '/dashboard/[:username=string]/overview'
//   '/dashboard/345/overview',                           // Should match '/dashboard/[:userId=number]/overview'
//   '/config/true',                                      // Should match '/config/[:flag=boolean]'
//   '/api/v1',                                           // Should match '/api/[:version=version]'
//   '/session/123e4567-e89b-12d3-a456-426614174000',     // Should match '/session/[:uuid=uuid]'
//   '/birthdate/2023-10-10',                             // Should match '/birthdate/[:date=date]'
//   '/contact/example@example.com',                      // Should match '/contact/[:email=email]'
//   '/phone/+1234567890',                                // Should match '/phone/[:phone=phone]'
//   '/ip/192.168.1.1',                                   // Should match '/ip/[:ip=ip]'
//   '/color/a1b2c3',                                     // Should match '/color/[:hex=hex]'
//   '/blog/my-first-post',                               // Should match '/blog/[:slug=slug]'
//   '/service/v2/status',                                // Should match '/service/[:version=version]/status'
//   '/user/567/orders',                                  // Should match '/user/[:userId=number]/orders'
//   '/order/789/payment',                                // Should match '/order/[:orderId=number]/payment'
//   '/item/123e4567-e89b-12d3-a456-426614174000',       // Should match '/item/[:itemId=uuid]'
//   '/login/johndoe',                                    // Should match '/login/[:username=string]'
//   '/track/my-first-track/details',                     // Should match '/track/[:slug=slug]/details'
//   '/product/456/user/jane',                            // Should match '/product/[:id=number]/user/[:name=string]'
//   '/product/789/user/john_doe',                        // Should not match if 'john_doe' doesn't fit 'string' (if 'string' expects only letters)
//   '/product/abc/user/jane123',                         // Should not match if 'jane123' doesn't fit 'string'
//   '/product/321/user/Jane',                            // Should match '/product/[:id=number]/user/[:name=string]'
// ];

// const result = matchURLToPatterns(files, matchStrings);

// console.log(JSON.stringify(mapToObject(result), null, 2));
