import { startRuntime, reportStartupFailure } from './modules/operations/runtime.js';
void startRuntime('api').catch(reportStartupFailure);
