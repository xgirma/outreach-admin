/* eslint-disable arrow-parens, no-unused-vars, no-underscore-dangle, function-paren-newline */
import merge from 'lodash.merge';
import isEmpty from 'lodash.isempty';
import { generate } from 'generate-password';
import { Validator } from 'jsonschema';
import { isMongoId } from 'validator';
import * as schema from './schema';
import owasp from './password';
import { NOTFUD, MDUERR, AUTERR } from '../docs/error.codes';
import * as err from './error';
import { Admins } from '../resources/admins/admins.model';
import { signToken, decodeToken } from './auth';
import logger from './logger';

const validator = new Validator();

export const controllers = {
  /*
   *  Writes a supper admin to database if it dose not exist
   *
   *  @param model: admin user model
   *  @param body: object containing username and password
   *    {
   *      username: "John.Doe",
   *      password: "p-U:QaA/3G"
   *    }
   *
   *  @return: a new admin (role = 0) / error
   *
   *  This function may fail for several reasons
   *  - invalid request body
   *  - password: OWASP Password Strength Test
   */
  addSuperAdmin(model, body) {
    return model
      .find({ role: 0 })
      .exec()
      .then((doc) => {
        const superAdmin = new Admins(body);
        superAdmin.passwordHash = superAdmin.hashPassword(body.password);
        if (isEmpty(doc)) {
          superAdmin.role = 0;
          return model.create(superAdmin);
        }
        return null;
      })
      .catch((error) => {
        throw error;
      });
  },

  /*
   * Super-admin writes an admin to database
   *
   * @param model: admin user model
   * @param body - object containing username and password
   *    {
   *      username: "John.Doe",
   *      password: "p-U:QaA/3G"
   *    }
   * @param user - super-admin user object
   *    {
   *      _id: "5b306f3331c68b024299ee26",
   *      username: "John.Doe",
   *      passwordHash: "$2b$10$5pbNcCAsqoR247LPcFnhB.tv8uD66ZJTmdYoOW4WbZaJ3PhZlgM/m",
   *      role: 0,
   *      createdAt: 2018-06-25T04:19:45.080Z,
   *      updatedAt: 2018-06-25T04:19:45.080Z,
   *      __v: 0
   *    },
   *
   *  @return: new admin (role = 1) / error
   *
   *  This function may fail for several reasons
   *  - invalid request body
   *  - password: OWASP Password Strength Test
   */
  addAdmin(model, body, superAdmin) {
    return model
      .find({ role: 0 })
      .exec()
      .then((doc) => {
        if (isEmpty(doc)) {
          logger.warning('super-admin user is not found in database');
          return null;
        }

        const adminUser = JSON.parse(JSON.stringify(doc));
        // check if superAdmin is super-admin
        if (superAdmin._id.equals(adminUser[0]._id)) {
          if (adminUser[0].role === superAdmin.role) {
            if (adminUser[0].username === superAdmin.username) {
              const newAdmin = new Admins(body);
              newAdmin.passwordHash = newAdmin.hashPassword(body.password);
              newAdmin.role = 1;
              return model.create(newAdmin);
            }
          }
        }

        logger.warning('a non super-admin user attempted to create admin');
        return null;
      })
      .catch((error) => {
        if (error.name === 'ValidationError') {
          logger.warn('Duplicate', { error });
          throw err.BadRequest('Username already exists');
        }
        throw error;
      });
  },

  createOne(model, body) {
    return model.create(body);
  },

  updateOne(docToUpdate, update) {
    merge(docToUpdate, update);
    return docToUpdate.save();
  },

  deleteOne(docToDelete) {
    return docToDelete.remove();
  },

  getOne(docToGet) {
    return Promise.resolve(docToGet);
  },

  getAll(model) {
    return model.find({});
  },

  getPast(model) {
    return model.find({ date_end: { $lt: new Date() } });
  },

  getFuture(model) {
    return model.find({ date_end: { $gte: new Date() } });
  },

  findByParam(model, id) {
    return model.findById(id);
  },
};

/*
 * Test and throw error if the create-new-admin request-body is
 * invalid based on the schema validation
 */
const testNewAdminReqBody = (body) => {
  const testBody = validator.validate(body, schema.createAdmin);

  if (testBody.errors.length > 0) {
    const { errors } = testBody;
    logger.warn('Request body validation error', { errors });
    throw err.BadRequest('Proper username and password is required');
  }
};

/*
 * Test and throw if a password is weak.
 * Should come after req body test (testNewAdminReqBody)
 */
const testPasswordStrength = ({ password }) => {
  const passwordTest = owasp.test(password);
  if (!passwordTest.strong) {
    const { errors } = passwordTest;
    const message = errors.join(' ');
    throw err.WeakPassword(message);
  }
};

/*
 *  Creates supper admin if it dose not exist and sign a token
 *
 *  @param model: admin user model
 *
 *  @return: a token / error
 *
 *  This function may fail for several reasons
 *  - if super admin already exist
 */
export const registerSuperAdmin = (model) => (req, res, next) => {
  testNewAdminReqBody(req.body);
  testPasswordStrength(req.body);

  controllers
    .addSuperAdmin(model, req.body)
    .then((superAdmin) => {
      if (superAdmin) {
        const { id, username } = superAdmin;
        const token = signToken(id);
        logger.info('supper-admin is registered', { username });
        res.status(201).json({
          status: 'success',
          data: { token },
        });
      } else {
        const { username } = req.body;
        logger.warn('failed supper-admin registration', { username });
        throw err.Forbidden('Admin already exists');
      }
    })
    .catch((error) => {
      setImmediate(() => next(error));
    });
};

/*
 *  Creates admin
 *
 *  @param model: admin user model
 *
 *  @return: success with no data / error
 *
 *  This function may fail for several reasons
 *  - if admin with the same name already exists
 */
export const registerAdmin = (model) => (req, res, next) => {
  testNewAdminReqBody(req.body);
  testPasswordStrength(req.body);
  decodeToken();

  controllers
    .addAdmin(model, req.body, req.user)
    .then((newAdmin) => {
      if (newAdmin) {
        logger.info('admin is registered', { name: newAdmin.username });
        res.status(201).json({ status: 'success', data: {} });
      } else {
        const { username } = req.body;
        logger.warn('failed admin registration', { username });
        throw err.Forbidden('Admin already exist');
      }
    })
    .catch((error) => {
      setImmediate(() => next(error));
    });
};

/**
 * Get all admins if super-admin, else gets an admin
 * @param model - admin
 * @returns {Function}
 */
export const getAdmins = (model) => (req, res, next) => {
  // logger.silly('i was here');
  const { user } = req;
  if (user.role === 0) {
    controllers
      .getAll(model)
      .then((admins) =>
        res.status(200).json({
          status: 'success',
          data: { admins },
        }),
      )
      .catch((error) => {
        setImmediate(() => next(error));
      });
  } else {
    res.status(200).json({
      status: 'success',
      data: { admin: user },
    });
  }
};

/**
 * Get (super)admin by ID
 * @param model - admin
 * @returns {Function}
 */
export const getAdmin = (model) => (req, res, next) => {
  const { user } = req;
  if (user.role === 0) {
    controllers
      .getOne(req.docFromId)
      .then((admin) => {
        if (!admin) throw err.ResourceNotFound();
        res.status(200).json({
          status: 'success',
          data: { admin },
        });
      })
      .catch((error) => {
        setImmediate(() => next(error));
      });
  } else {
    res.status(200).json({
      status: 'success',
      data: { admin: user },
    });
  }
};

/**
 * Super admin can delete all, admin only itself
 * @param model - admin
 * @returns {Function}
 */
export const deleteAdmin = (model) => (req, res, next) => {
  const { user } = req;
  if (user.role === 0) {
    controllers
      .deleteOne(req.docFromId)
      .then((admin) => {
        logger.info('admin deleted', { name: req.docFromId.username });
        res.status(201).json({
          status: 'success',
          data: { admin },
        });
      })
      .catch((error) => setImmediate(() => next(error)));
  } else if (user.id !== req.docFromId.id) {
    logger.warn(`unauthorized attempted to delete admin ${req.docFromId.username}`, {
      name: user.username,
    });
    setImmediate(() => next(err.Unauthorized('can not delete other admin')));
  } else {
    controllers
      .deleteOne(user)
      .then((self) => {
        logger.info('admin deleted', { name: user.username });
        res.status(201).json({
          status: 'success',
          data: { self },
        });
      })
      .catch((error) => setImmediate(() => next(error)));
  }
};

/**
 * Update admin password
 * Super-admin can update its and other password
 * Admin can only update its own password
 * @param model - admin
 * @returns {Function}
 */
export const updateAdmin = (model) => (req, res, next) => {
  const { user } = req; // the admin who is changing password
  const userToUpdate = req.docFromId; // the admin that its password is going to be updated

  if (user.role === 0) {
    if (user._id.equals(userToUpdate._id)) {
      // use-case 1 -super-admin changing its own password
      const { newPassword, newPasswordAgain, currentPassword } = req.body;

      if (newPassword !== newPasswordAgain) {
        logger.info('new password one and new password two do not match');
        return setImmediate(() =>
          next(err.BadRequest('the two new passwords do not match, try again')),
        );
      }
      logger.info('new password one and new password two match');

      if (newPassword === currentPassword) {
        return setImmediate(() => next(err.BadRequest('new and old password are same')));
      }

      const passwordTest = owasp.test(newPassword);

      if (!passwordTest.strong) {
        logger.info('week password selected');
        // TODO return passwordTest.errors
        return setImmediate(() => next(err.BadRequest('weak password entered')));
      }

      // password matches with existing password in db?
      if (!userToUpdate.authenticate(currentPassword)) {
        logger.info('entered wrong old password');
        return setImmediate(() => next(err.Unauthorized('wrong old password')));
      }

      logger.info('entered correct old password');
      const update = new Admins(userToUpdate);
      update.passwordHash = update.hashPassword(newPassword);
      logger.info('before and after hash', {
        old: userToUpdate.passwordHash,
        new: update.passwordHash,
      });
      return controllers
        .updateOne(userToUpdate, update)
        .then((admin) => res.status(201).json({ admin, newPassword }))
        .catch((error) => setImmediate(() => next(error)));
    }
    // use-case 2 -super-admin changing its another admin password (temp-pwd)
    const tempPassword = generate({
      numbers: true,
      symbols: true,
      strict: true,
      excludeSimilarCharacters: true,
      exclude: '"',
    });

    const update = {
      passwordHash: userToUpdate.hashPassword(tempPassword),
    };

    return controllers
      .updateOne(userToUpdate, update)
      .then((admin) => res.status(201).json({ admin, tempPassword }))
      .catch((error) => setImmediate(() => next(error)));
  }

  if (user._id.equals(userToUpdate._id)) {
    // **** use-case 3 - admin changing his own password (old-pwd, new-pwd, new-pwd)
    // check if new password matches
    const { newPassword, newPasswordAgain, currentPassword } = req.body;
    if (newPassword !== newPasswordAgain) {
      logger.info('new password one and new password two do not match');
      return setImmediate(() =>
        next(err.BadRequest('the two new passwords do not match, try again')),
      );
    }
    logger.info('new password one and new password two match');
    if (newPassword === currentPassword) {
      return setImmediate(() => next(err.BadRequest('new and old password are same')));
    }

    const passwordTest = owasp.test(newPassword);

    if (!passwordTest.strong) {
      logger.info('week password selected');
      // TODO return passwordTest.errors
      return setImmediate(() => next(err.BadRequest('weak password entered')));
    }

    // password matches with existing password in db?
    if (!userToUpdate.authenticate(currentPassword)) {
      logger.info('entered wrong old password');
      return setImmediate(() => next(err.Unauthorized('wrong old password')));
    }
    logger.info('entered correct old password');
    const update = new Admins(userToUpdate);
    update.passwordHash = update.hashPassword(newPassword);
    logger.info('before and after hash', {
      old: userToUpdate.passwordHash,
      new: update.passwordHash,
    });
    return controllers
      .updateOne(userToUpdate, update)
      .then((admin) => res.status(201).json({ admin, newPassword }))
      .catch((error) => setImmediate(() => next(error)));
  }
  // **** use-case 4 - admin attempting to change others password
  return setImmediate(() => next(err.Unauthorized('not authorised to update other admin')));
};

export const createOne = (model) => (req, res, next) =>
  controllers
    .createOne(model, req.body)
    .then((doc) => res.status(201).json(doc))
    .catch((error) => {
      if (error.code === 11000) {
        setImmediate(() => next(MDUERR));
      } else {
        setImmediate(() => next(error));
      }
    });

export const updateOne = () => (req, res, next) => {
  const docToUpdate = req.docFromId;
  const update = req.body;

  return controllers
    .updateOne(docToUpdate, update)
    .then((doc) => res.status(201).json(doc))
    .catch((error) => setImmediate(() => next(error)));
};

export const deleteOne = () => (req, res, next) =>
  controllers
    .deleteOne(req.docFromId)
    .then((doc) => res.status(201).json(doc))
    .catch((error) => setImmediate(() => next(error)));

export const getOne = () => (req, res, next) =>
  controllers
    .getOne(req.docFromId)
    .then((doc) => res.status(200).json(doc))
    .catch((error) => setImmediate(() => next(error)));

export const getAll = (model) => (req, res, next) =>
  controllers
    .getAll(model)
    .then((docs) => res.status(200).json(docs))
    .catch((error) => setImmediate(() => next(error)));

export const getPast = (model) => (req, res, next) => {
  controllers
    .getPast(model)
    .then((docs) => res.status(200).json(docs))
    .catch((error) => setImmediate(() => next(error)));
};

export const getFuture = (model) => (req, res, next) => {
  controllers
    .getFuture(model)
    .then((docs) => res.status(200).json(docs))
    .catch((error) => setImmediate(() => next(error)));
};

export const findByIdParam = (model) => (req, res, next, id) => {
  if (isMongoId(id)) {
    controllers
      .findByParam(model, id)
      .then((doc) => {
        if (!doc) throw err.ResourceNotFound('No resource found with this Id');
        req.docFromId = doc;
        next();
      })
      .catch((error) => setImmediate(() => next(error)));
  } else {
    setImmediate(() => next(err.ResourceNotFound('Not a MongoId')));
  }
};

export const generateControllers = (model, overrides = {}) => {
  const defaults = {
    registerSuperAdmin: registerSuperAdmin(model),
    registerAdmin: registerAdmin(model),
    getAdmins: getAdmins(model),
    getAdmin: getAdmin(model),
    deleteAdmin: deleteAdmin(model),
    updateAdmin: updateAdmin(model),
    findByIdParam: findByIdParam(model),
    getAll: getAll(model),
    getOne: getOne(model),
    getPast: getPast(model),
    getFuture: getFuture(model),
    deleteOne: deleteOne(model),
    updateOne: updateOne(model),
    createOne: createOne(model),
  };

  return { ...defaults, ...overrides };
};
