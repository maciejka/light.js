"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.switchMapPromise = void 0;

var _operators = require("rxjs/operators");

var _empty = require("rxjs/observable/empty");

var _fromPromise = require("rxjs/observable/fromPromise");

// Copyright 2015-2018 Parity Technologies (UK) Ltd.
// This file is part of Parity.
// SPDX-License-Identifier: MIT

/**
 * SwitchMap to an Observable.fromPromise that catches errors and returns an
 * empty Observable. Will log an error in the console.
 */
var switchMapPromise = function switchMapPromise(promise) {
  return (0, _operators.switchMap)(function () {
    return (0, _fromPromise.fromPromise)(promise()).pipe((0, _operators.catchError)(function () {
      return (0, _empty.empty)();
    }));
  });
};

exports.switchMapPromise = switchMapPromise;