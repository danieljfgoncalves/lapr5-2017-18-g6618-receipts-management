/**
 * Scheduler that schedules registered jobs.
 */

 const cronJobs = require('../config/cronJobs');
 const schedule = require('node-schedule');

 /**
  * Schedule all registered jobs.
  */
 exports.schedule = function() {
    for (let i = 0; i < cronJobs.jobs.length; i++) {
        let job = cronJobs.jobs[i];
        schedule.scheduleJob(job.period, job.task);
    }
 }