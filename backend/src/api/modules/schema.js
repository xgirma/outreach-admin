import { Validator } from 'jsonschema';
import * as err from './error';
import logger from './logger';

const validator = new Validator();

// POST /register /signin - request body
const createAdmin = {
  type: 'object',
  properties: {
    username: { type: 'string', required: true },
    password: {
      type: 'string',
      minLength: 8,
      maxLength: 128,
      required: true,
    },
  },
  minProperties: 2,
  maxProperties: 2,
};

/**
 * Test if req.body have proper schema
 *
 * This function may fail for several reasons
 * - invalid request body
 */
export const usernamePasswordObject = (body) => {
  const testBody = validator.validate(body, createAdmin);

  if (testBody.errors.length > 0) {
    const { errors } = testBody;
    logger.debug('Request body validation error', { errors });
    throw err.BadRequest('proper username and password is required');
  }
};

// POST /admins - request body
const username = {
  type: 'object',
  properties: {
    username: { type: 'string', required: true },
  },
  minProperties: 1,
  maxProperties: 1,
};

/**
 * Test if POST /admins req.body have proper schema
 *
 * May fail for several reasons
 * - invalid request body
 */
export const usernameObject = (body) => {
  const testBody = validator.validate(body, username);

  if (testBody.errors.length > 0) {
    const { errors } = testBody;
    logger.debug('request body validation error', { errors });
    throw err.BadRequest('proper username and password is required');
  }
};

// PUT /admins - request body
const updateAdmin = {
  type: 'object',
  properties: {
    currentPassword: {
      type: 'string',
      minLength: 8,
      maxLength: 128,
      required: true,
    },
    newPassword: {
      type: 'string',
      minLength: 8,
      maxLength: 128,
      required: true,
    },
    newPasswordAgain: {
      type: 'string',
      minLength: 8,
      maxLength: 128,
      required: true,
    },
  },
  minProperties: 3,
  maxProperties: 3,
};

/**
 * Test if req.body have proper schema
 *
 * This function may fail for several reasons
 * - invalid request body
 */
export const updatePasswordObject = (body) => {
  const testBody = validator.validate(body, updateAdmin);

  if (testBody.errors.length > 0) {
    const { errors } = testBody;
    logger.debug('request body validation error', { errors });
    throw err.BadRequest('proper current and new password is required');
  }
};
