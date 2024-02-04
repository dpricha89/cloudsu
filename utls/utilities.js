"use strict";

const Promise = require("bluebird");
const exec = require("child_process").exec;
const logger = require("./logger.js");

class utls_client {
  constructor() {}

  remove_non_alpha(app) {
    app.app_name = app.app_name.replace(/\W/g, "");

    if (app.version) {
      app.version = app.version.replace(/\W/g, "");
    }

    if (app.app_version) {
      app.app_version = app.app_version.replace(/\W/g, "");
    }

    return app;
  }

  clean_node_name(node) {
    const node_arr = node.split("-");
    return `${node_arr[0]}-${node_arr[1]}`;
  }

  formatPrettyDate(date) {
    return moment(date).format("MMMM Do, YYYY");
  }

  getNthDaysOfYear(year, dayOfWeek, nth) {
    let dates = [];

    for (let month = 0; month < 12; month++) {
      let date = new Date(year, month, 1);
      let added = false;

      while (date.getMonth() === month) {
        if (date.getDay() === dayOfWeek) {
          if (!added) {
            // Skip to the nth occurrence
            added = true;
            for (let skip = 1; skip < nth; skip++) {
              date.setDate(date.getDate() + 7);
              if (date.getMonth() !== month) {
                // Check if it skips to the next month
                added = false;
                break;
              }
            }
          }
          if (added) {
            dates.push(new Date(date)); // Add the nth occurrence to the list
            date.setDate(date.getDate() + 7); // Move to the next week
            added = false; // Reset for the next nth day of the week in the month
          }
        }
        date.setDate(date.getDate() + 1); // Check the next day
      }
    }

    return dates;
  }

  run_cmd(cmd) {
    logger.info(`Running command: ${cmd}`);
    return new Promise(function (resolve, reject) {
      exec(cmd, (error, stdout, stderr) => {
        if (error && error.code !== 0) {
          const details = {
            stdout: stdout,
            stderr: stderr,
            error: error,
          };

          return reject(details);
        } else {
          return resolve(stdout);
        }
      });
    });
  }
}

module.exports = new utls_client();
