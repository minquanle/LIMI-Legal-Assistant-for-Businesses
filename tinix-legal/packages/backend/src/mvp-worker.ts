import { startRuntime, reportStartupFailure } from './modules/operations/runtime.js';
void startRuntime('worker').catch(reportStartupFailure);
