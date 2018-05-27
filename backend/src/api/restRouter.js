import express from 'express';
import eventRouter from './resources/event/event.restRouter';
import infoRouter from './resources/info/info.restRouter';
import introRouter from './resources/intro/intro.restRouter';
import serviceRouter from './resources/service/service.restRouter';

const restRouter = express.Router();

restRouter.use('/event', eventRouter);
restRouter.use('/info', infoRouter);
restRouter.use('/intro', introRouter);
restRouter.use('/service', serviceRouter);

export default restRouter;
