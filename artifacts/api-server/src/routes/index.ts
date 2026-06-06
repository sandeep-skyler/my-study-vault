import { Router, type IRouter } from "express";
import healthRouter from "./health";
import subjectsRouter from "./subjects";
import topicsRouter from "./topics";
import notesRouter from "./notes";
import formulasRouter from "./formulas";
import filesRouter from "./files";
import foldersRouter from "./folders";
import videosRouter from "./videos";
import calendarRouter from "./calendar";
import quickNotesRouter from "./quicknotes";
import todosRouter from "./todos";
import bookmarksRouter from "./bookmarks";
import searchRouter from "./search";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(subjectsRouter);
router.use(topicsRouter);
router.use(notesRouter);
router.use(formulasRouter);
router.use(filesRouter);
router.use(foldersRouter);
router.use(videosRouter);
router.use(calendarRouter);
router.use(quickNotesRouter);
router.use(todosRouter);
router.use(bookmarksRouter);
router.use(searchRouter);
router.use(dashboardRouter);

export default router;
