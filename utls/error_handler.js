/*jshint esversion: 6 */
'use strict';

module.exports = function(err) {
    if (err.cause) {
        return err.cause.message;
    } else if (err.message) {
        return err.message;
    } else {
        return err;
    }
};
