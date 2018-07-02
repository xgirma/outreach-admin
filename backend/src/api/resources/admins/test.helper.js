import { expect } from 'chai';
import faker from 'faker';
import isEmpty from 'lodash.isempty';
import * as err from '../../modules/error';
import * as common from '../../../../helpers/faker';

const weakPasswordErrors = [
  'The password must contain at least one uppercase letter.',
  'The password must contain at least one number.',
  'The password must contain at least one special character.',
];

/*
 * creating new admin with invalid req.body should be prevented
 *
 * @param result: http response
 */
export const registerWithBadRequestBody = (result) => {
  const { status, data } = result.body;
  const { name, message } = data;

  expect(result).to.have.status(400);
  expect(status).to.equal('fail');
  expect(name).to.equal(err.BadRequest.name);
  expect(message).to.equal('proper username and password is required');
};

/*
 * update (super-)admin data with bad req.body should be prevented
 *
 * @param result: http response
 */
export const updateWithBadRequestBody = (result) => {
  const { status, data } = result.body;
  const { name, message } = data;

  expect(result).to.have.status(400);
  expect(status).to.equal('fail');
  expect(name).to.equal(err.BadRequest.name);
  expect(message).to.equal('proper current and new password is required');
};

/*
 * creating new (super-)admin with weak password should be prevented
 *
 * @param result: http response
 */
export const registerWithWeakPassword = (result) => {
  const { status, data } = result.body;
  const { name, message } = data;

  expect(result).to.have.status(400);
  expect(status).to.equal('fail');
  expect(name).to.equal(err.WeakPassword.name);
  expect(message).to.equal(`${weakPasswordErrors.join(' ')}`);
};

/*
 * creating new (super-)admin with weak pass-phrase should be prevented
 *
 * @param result: http response
 */
export const registerWithWeakPassPhrase = (result) => {
  const { status, data } = result.body;
  const { name, message } = data;

  expect(result).to.have.status(400);
  expect(status).to.equal('fail');
  expect(name).to.equal(err.WeakPassword.name);
  expect(message).to.equal(`${weakPasswordErrors[0]} ${weakPasswordErrors[1]}`);
};

/*
 * creating new (super-)admin while one already exist should be prevented.
 * creating a new admin with already existing admin username should be prevented.
 *
 * @param result: http response
 */
export const registerWhileExist = (result) => {
  const { status, data } = result.body;
  const { name, message } = data;

  expect(result).to.have.status(403);
  expect(status).to.equal('fail');
  expect(name).to.equal(err.Forbidden.name);
  expect(message).to.equal('user already exists');
};

/*
 * creating new (super-)admin while one already exist should be prevented.
 * creating a new admin with already existing admin username should be prevented.
 *
 * @param result: http response
 */
export const badUsernameOrPassword = (result) => {
  const { status, data } = result.body;
  const { name, message } = data;

  expect(result).to.have.status(403);
  expect(status).to.equal('fail');
  expect(name).to.equal(err.Forbidden.name);
  expect(message).to.equal(err.FORBIDDEN);
};

/*
 * gets all admin for supper-admin or gets the requesting admin
 *
 * @param result: http response
 * @param all: (boolean)
 *    true: get all admins
 *    false: get one admin by id
 */
export const getAdmin = (result, all = true) => {
  const { status, data } = result.body;
  const { admins } = data;

  expect(result).to.have.status(200);
  expect(status).to.equal('success');

  if (all) {
    expect(admins.length).to.be.greaterThan(1);
  } else {
    expect(isEmpty(admins)).to.equal(false); // not array
  }
};

// admin
export const supperAdminCredential = {
  username: common.username,
  password: common.password,
};

export const secondAdminCredential = {
  username: common.adminUsername,
  password: common.adminPassword,
};

export const thirdAdminCredential = {
  username: common.adminUsernameSecond,
  password: common.adminPasswordSecond,
};

// bad passwords
export const withShortPassword = {
  username: faker.internet.userName(),
  password: common.shortPassword,
};

export const withLongPassword = {
  username: faker.internet.userName(),
  password: common.longPassword,
};

export const withWeakPassword = {
  username: faker.internet.userName(),
  password: common.weakPassword,
};

export const withWeakPassPhrase = {
  username: faker.internet.userName(),
  password: common.weakPassPhrase,
};

// good passwords // TODO add test
export const with8CharacterPassword = {
  username: faker.internet.userName(),
  password: common.minPassword8,
};

export const with128CharacterPassword = {
  username: faker.internet.userName(),
  password: common.maxPassword128,
};

export const withStrongPassword = {
  username: faker.internet.userName(),
  password: common.strongPassword,
};

export const withStrongPassPhrase = {
  username: faker.internet.userName(),
  password: common.strongPassPhrase,
};

// bad update body
export const updateWithShortPassword = {
  currentPassword: common.password,
  newPassword: common.shortPassword,
  newPasswordAgain: common.shortPassword,
};

export const updateWithLongPassword = {
  currentPassword: common.password,
  newPassword: common.longPassword,
  newPasswordAgain: common.longPassword,
};

export const updateWithWeakPassword = {
  currentPassword: common.password,
  newPassword: common.weakPassword,
  newPasswordAgain: common.weakPassword,
};

export const updateWithWeakPassPhrase = {
  currentPassword: common.password,
  newPassword: common.weakPassPhrase,
  newPasswordAgain: common.weakPassPhrase,
};

export const newPasswordDoNotMatch = {
  currentPassword: common.password,
  newPassword: 'q-W:QzA$3Sa',
  newPasswordAgain: 'q-W:QzA$3Sb',
};

export const newPasswordSameWithCurrent = {
  currentPassword: common.password,
  newPassword: common.password,
  newPasswordAgain: common.password,
};

export const wrongCurrentPassword = {
  currentPassword: 'q-W:QzA$3Sa',
  newPassword: 'q-W:QzA$3Sb',
  newPasswordAgain: 'q-W:QzA$3Sb',
};

// super-admin
export const withGoodPassword = {
  currentPassword: common.password,
  newPassword: common.passwordNew,
  newPasswordAgain: common.passwordNew,
};

// admin
export const withGoodPasswordAdmin = {
  currentPassword: common.adminPassword,
  newPassword: common.passwordNew,
  newPasswordAgain: common.passwordNew,
};

// signin
export const signBadUsername = {
  username: 'bad.username',
  password: common.passwordNew,
};

export const signBadPassword = {
  username: common.username,
  password: 'bad.password',
};

export const signBadUsernameAndPassword = {
  username: 'bad.username',
  password: 'bad.password',
};

export const signInAfterUpdate = {
  username: common.username,
  password: common.passwordNew,
};
