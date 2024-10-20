// matchURLToPatterns.test.js

// Import necessary modules
import { describe, test, expect } from '@jest/globals';
import matchURLToPatterns from '../lib/utils/patternMatcher.mjs'

// Test Suite
describe('matchURLToPatterns', () => {
  // Define the patterns
  const matchStrings = [
    '/product/[:id=number]',                      // Product with numeric id
    '/product/[:id=number]/user/[:name=string]',  // Product with numeric id and user name
    '/product/[:name=string]',                    // Product with name as string
    '/product/[:random=alphanumeric]',            // Product with alphanumeric value
    '/product/:else',                             // Product fallback, treated as string
    '/profile/[:userId=number]/details',          // Profile details with userId as number
    '/cart/[:cartId=alphanumeric]',               // Cart with alphanumeric cartId
    '/order/[:orderId=number]/items',             // Order with numeric orderId
    '/checkout/[:step=string]',                   // Checkout step as a string
    '/dashboard/[:username=string]/overview',     // Dashboard overview with username
    '/dashboard/[:userId=number]/overview',       // Dashboard overview with numeric userId
    '/config/[:flag=boolean]',                    // Boolean value for flags (true/false)
    '/api/[:version=version]',                    // Versioning pattern (e.g., v1, v2)
    '/session/[:uuid=uuid]',                      // Matches UUID format
    '/birthdate/[:date=date]',                    // Matches date format
    '/contact/[:email=email]',                    // Matches email format
    '/phone/[:phone=phone]',                      // Matches international phone numbers
    '/ip/[:ip=ip]',                               // Matches IPv4 addresses
    '/color/[:hex=hex]',                          // Matches hex values
    '/blog/[:slug=slug]',                         // Matches slugs (URL-friendly)
    '/service/[:version=version]/status',         // Service version with status
    '/user/[:userId=number]/orders',              // User orders by userId
    '/order/[:orderId=number]/payment',           // Order payment with orderId
    '/item/[:itemId=uuid]',                       // Item by UUID
    '/login/[:username=string]',                  // Login by username
    '/track/[:slug=slug]/details',                // Track details by slug
    '/product/[:id=number]/user/[:name=string]',  // Product and user with multiple dynamic segments
  ];

  // Define the URLs to test
  const files = [
    '/product/123',                                      // Should match '/product/[:id=number]'
    '/product/123/user/a',                                // Should match '/product/[:id=number]/user/[:name=string]'
    '/product/laptop',                                    // Should match '/product/[:name=string]'
    '/product/abc123',                                    // Should match '/product/[:random=alphanumeric]'
    '/product/anything',                                  // Should match '/product/:name'
    '/product/ABC123',                                    // Should match '/product/[:random=alphanumeric]'
    '/profile/45/details',                                // Should match '/profile/[:userId=number]/details'
    '/cart/abc123',                                       // Should match '/cart/[:cartId=alphanumeric]'
    '/order/432/items',                                   // Should match '/order/[:orderId=number]/items'
    '/checkout/payment',                                  // Should match '/checkout/[:step=string]'
    '/dashboard/alex/overview',                           // Should match '/dashboard/[:username=string]/overview'
    '/dashboard/345/overview',                            // Should match '/dashboard/[:userId=number]/overview'
    '/config/true',                                       // Should match '/config/[:flag=boolean]'
    '/api/v1',                                            // Should match '/api/[:version=version]'
    '/session/123e4567-e89b-12d3-a456-426614174000',      // Should match '/session/[:uuid=uuid]'
    '/birthdate/2023-10-10',                              // Should match '/birthdate/[:date=date]'
    '/contact/example@example.com',                       // Should match '/contact/[:email=email]'
    '/phone/+1234567890',                                 // Should match '/phone/[:phone=phone]'
    '/ip/192.168.1.1',                                    // Should match '/ip/[:ip=ip]'
    '/color/a1b2c3',                                      // Should match '/color/[:hex=hex]'
    '/blog/my-first-post',                                // Should match '/blog/[:slug=slug]'
    '/service/v2/status',                                 // Should match '/service/[:version=version]/status'
    '/user/567/orders',                                   // Should match '/user/[:userId=number]/orders'
    '/order/789/payment',                                 // Should match '/order/[:orderId=number]/payment'
    '/item/123e4567-e89b-12d3-a456-426614174000',        // Should match '/item/[:itemId=uuid]'
    '/login/johndoe',                                     // Should match '/login/[:username=string]'
    '/track/my-first-track/details',                      // Should match '/track/[:slug=slug]/details'
    '/product/456/user/jane',                             // Should match '/product/[:id=number]/user/[:name=string]'
    '/product/789/user/john_doe',                         // Should not match if 'john_doe' doesn't fit 'string' (if 'string' expects only letters)
    '/product/abc/user/jane123',                          // Should not match if 'jane123' doesn't fit 'string'
    '/product/321/user/Jane',                             // Should match '/product/[:id=number]/user/[:name=string]'
  ];

  // Define the expected output as a plain object for easier comparison
  const expectedOutput = {
    '/product/123': {
      pattern: 'product/:id',
      dataTypes: { id: 'number' },
      required_key: 'product/[:id=number]',
      params: { id: '123' }
    },
    '/product/123/user/a': {
      pattern: 'product/:id/user/:name',
      dataTypes: { id: 'number', name: 'string' },
      required_key: 'product/[:id=number]/user/[:name=string]',
      params: { id: '123', name: 'a' }
    },
    '/product/laptop': {
      pattern: 'product/:name',
      dataTypes: { name: 'string' },
      required_key: 'product/[:name=string]',
      params: { name: 'laptop' }
    },
    '/product/abc123': {
      pattern: 'product/:random',
      dataTypes: { random: 'alphanumeric' },
      required_key: 'product/[:random=alphanumeric]',
      params: { random: 'abc123' }
    },
    '/product/anything': {
      pattern: 'product/:name',
      dataTypes: { 'name': 'string' },
      required_key: 'product/[:name=string]',
      params: { "name": "anything" }
    },
    '/product/ABC123': {
      pattern: 'product/:random',
      dataTypes: { random: 'alphanumeric' },
      required_key: 'product/[:random=alphanumeric]',
      params: { random: 'ABC123' }
    },
    '/profile/45/details': {
      pattern: 'profile/:userId/details',
      dataTypes: { userId: 'number' },
      required_key: 'profile/[:userId=number]/details',
      params: { userId: '45' }
    },
    '/cart/abc123': {
      pattern: 'cart/:cartId',
      dataTypes: { cartId: 'alphanumeric' },
      required_key: 'cart/[:cartId=alphanumeric]',
      params: { cartId: 'abc123' }
    },
    '/order/432/items': {
      pattern: 'order/:orderId/items',
      dataTypes: { orderId: 'number' },
      required_key: 'order/[:orderId=number]/items',
      params: { orderId: '432' }
    },
    '/checkout/payment': {
      pattern: 'checkout/:step',
      dataTypes: { step: 'string' },
      required_key: 'checkout/[:step=string]',
      params: { step: 'payment' }
    },
    '/dashboard/alex/overview': {
      pattern: 'dashboard/:username/overview',
      dataTypes: { username: 'string' },
      required_key: 'dashboard/[:username=string]/overview',
      params: { username: 'alex' }
    },
    '/dashboard/345/overview': {
      pattern: 'dashboard/:userId/overview',
      dataTypes: { userId: 'number' },
      required_key: 'dashboard/[:userId=number]/overview',
      params: { userId: '345' }
    },
    '/config/true': {
      pattern: 'config/:flag',
      dataTypes: { flag: 'boolean' },
      required_key: 'config/[:flag=boolean]',
      params: { flag: 'true' }
    },
    '/api/v1': {
      pattern: 'api/:version',
      dataTypes: { version: 'version' },
      required_key: 'api/[:version=version]',
      params: { version: 'v1' }
    },
    '/session/123e4567-e89b-12d3-a456-426614174000': {
      pattern: 'session/:uuid',
      dataTypes: { uuid: 'uuid' },
      required_key: 'session/[:uuid=uuid]',
      params: { uuid: '123e4567-e89b-12d3-a456-426614174000' }
    },
    '/birthdate/2023-10-10': {
      pattern: 'birthdate/:date',
      dataTypes: { date: 'date' },
      required_key: 'birthdate/[:date=date]',
      params: { date: '2023-10-10' }
    },
    '/contact/example@example.com': {
      pattern: 'contact/:email',
      dataTypes: { email: 'email' },
      required_key: 'contact/[:email=email]',
      params: { email: 'example@example.com' }
    },
    '/phone/+1234567890': {
      pattern: 'phone/:phone',
      dataTypes: { phone: 'phone' },
      required_key: 'phone/[:phone=phone]',
      params: { phone: '+1234567890' }
    },
    '/ip/192.168.1.1': {
      pattern: 'ip/:ip',
      dataTypes: { ip: 'ip' },
      required_key: 'ip/[:ip=ip]',
      params: { ip: '192.168.1.1' }
    },
    '/color/a1b2c3': {
      pattern: 'color/:hex',
      dataTypes: { hex: 'hex' },
      required_key: 'color/[:hex=hex]',
      params: { hex: 'a1b2c3' }
    },
    '/blog/my-first-post': {
      pattern: 'blog/:slug',
      dataTypes: { slug: 'slug' },
      required_key: 'blog/[:slug=slug]',
      params: { slug: 'my-first-post' }
    },
    '/service/v2/status': {
      pattern: 'service/:version/status',
      dataTypes: { version: 'version' },
      required_key: 'service/[:version=version]/status',
      params: { version: 'v2' }
    },
    '/user/567/orders': {
      pattern: 'user/:userId/orders',
      dataTypes: { userId: 'number' },
      required_key: 'user/[:userId=number]/orders',
      params: { userId: '567' }
    },
    '/order/789/payment': {
      pattern: 'order/:orderId/payment',
      dataTypes: { orderId: 'number' },
      required_key: 'order/[:orderId=number]/payment',
      params: { orderId: '789' }
    },
    '/item/123e4567-e89b-12d3-a456-426614174000': {
      pattern: 'item/:itemId',
      dataTypes: { itemId: 'uuid' },
      required_key: 'item/[:itemId=uuid]',
      params: { itemId: '123e4567-e89b-12d3-a456-426614174000' }
    },
    '/login/johndoe': {
      pattern: 'login/:username',
      dataTypes: { username: 'string' },
      required_key: 'login/[:username=string]',
      params: { username: 'johndoe' }
    },
    '/track/my-first-track/details': {
      pattern: 'track/:slug/details',
      dataTypes: { slug: 'slug' },
      required_key: 'track/[:slug=slug]/details',
      params: { slug: 'my-first-track' }
    },
    '/product/456/user/jane': {
      pattern: 'product/:id/user/:name',
      dataTypes: { id: 'number', name: 'string' },
      required_key: 'product/[:id=number]/user/[:name=string]',
      params: { id: '456', name: 'jane' }
    },
    '/product/789/user/john_doe': {
      pattern: '/product/789/user/john_doe',
      dataTypes: {},
      required_key: '/product/789/user/john_doe',
      params: {}
    },
    '/product/abc/user/jane123': {
      pattern: '/product/abc/user/jane123',
      dataTypes: {},
      required_key: '/product/abc/user/jane123',
      params: {}
    },
    '/product/321/user/Jane': {
      pattern: 'product/:id/user/:name',
      dataTypes: { id: 'number', name: 'string' },
      required_key: 'product/[:id=number]/user/[:name=string]',
      params: { id: '321', name: 'Jane' }
    },
  };

  // Execute the function
  const resultMap = matchURLToPatterns(files, matchStrings);

  // Convert the Map to a plain object for easier testing
  const result = {};
  for (let [key, value] of resultMap.entries()) {
    // Convert dataTypes Map to a plain object
    const dataTypesObj = {};
    for (let [k, v] of value.dataTypes.entries()) {
      dataTypesObj[k] = v;
    }

    result[key] = {
      pattern: value.pattern,
      dataTypes: dataTypesObj,
      required_key: value.required_key,
      params: value.params
    };
  }

  // Define individual test cases
  Object.keys(expectedOutput).forEach(file => {
    test(`should correctly match URL "${file}"`, () => {
      expect(result[file]).toEqual(expectedOutput[file]);
    });
  });
});
