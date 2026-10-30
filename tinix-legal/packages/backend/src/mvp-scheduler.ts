import { startRuntime, reportStartupFailure } from './modules/operations/runtime.js';
void startRuntime('scheduler').catch(reportStartupFailure);
