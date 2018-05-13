// Copyright 2015-2018 Parity Technologies (UK) Ltd.
// This file is part of Parity.
//
// SPDX-License-Identifier: MIT

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  addToOverview,
  distinctReplayRefCount,
  switchMapPromise
} from '../../utils/operators';
import api from '../../api';
import createRpc$ from '../../utils/createRpc';
import { getPriority } from '../../priorities/getPriority';
import {
  onAccountsChanged$,
  onEveryBlock$,
  onEvery2Seconds$,
  onStartup$
} from '../../priorities';

/**
 * Get all accounts info.
 *
 * Calls parity_allAccountsInfo.
 *
 * @return {Observable<String>} - An Observable containing the name of the
 * current chain.
 */
export const allAccountsInfo$ = createRpc$({
  calls: ['parity_allAccountsInfo'],
  priority: [onAccountsChanged$]
})(() =>
  getPriority(allAccountsInfo$).pipe(
    switchMapPromise(() => api().parity.allAccountsInfo()),
    map(allAccountsInfo => {
      Object.keys(allAccountsInfo).forEach(address => {
        if (!allAccountsInfo[address].uuid) {
          // We remove the accounts that don't have uuid, they are not user
          // accounts (maybe contracts etc)
          delete allAccountsInfo[address];
        } else {
          // We add the address field
          allAccountsInfo[address].address = address;
        }
      });
      return allAccountsInfo;
    }),
    distinctReplayRefCount(),
    addToOverview(allAccountsInfo$)
  )
);

/**
 * Observable which contains the array of all addresses managed by the light
 * client.
 * *
 * @return {Observable<Array<String>>} - An Observable containing the list of
 * public addresses.
 */
export const accounts$ = createRpc$()(() =>
  allAccountsInfo$().pipe(
    map(info => Object.keys(info)),
    addToOverview(accounts$)
  )
);

/**
 * Get the name of the current chain.
 *
 * Calls parity_netChain.
 *
 * @return {Observable<String>} - An Observable containing the name of the
 * current chain.
 */
export const chainName$ = createRpc$({
  calls: ['parity_netChain'],
  priority: [onStartup$]
})(() =>
  getPriority(chainName$).pipe(
    switchMapPromise(() => api().parity.netChain()),
    distinctReplayRefCount(),
    addToOverview(chainName$)
  )
);

/**
 * Get the status of the current chain.
 *
 * Calls parity_chainStatus.
 *
 * @return {Observable<String>} - An Observable containing the status.
 */
export const chainStatus$ = createRpc$({
  calls: ['parity_chainStatus'],
  priority: [onEveryBlock$]
})(() =>
  getPriority(chainStatus$).pipe(
    switchMapPromise(() => api().parity.chainStatus()),
    distinctReplayRefCount(),
    addToOverview(chainStatus$)
  )
);

/**
 * Get the default account managed by the light client.
 *
 * Calls parity_getNewDappsDefaultAddress
 */
export const defaultAccount$ = createRpc$({
  calls: ['parity_getNewDappsDefaultAddress'],
  priority: [onAccountsChanged$]
})(() =>
  accounts$().pipe(
    switchMapPromise(() => api().parity.getNewDappsDefaultAddress()),
    distinctReplayRefCount(),
    addToOverview(defaultAccount$)
  )
);

/**
 * Alias for {@link defaultAccount$}
 */
export const me$ = createRpc$()(() =>
  defaultAccount$().pipe(addToOverview(me$))
);

/**
 * Get the node's health.
 *
 * Calls parity_nodeHealth.
 *
 * @return {Observable<Object>} - An Observable containing the health.
 */
export const nodeHealth$ = createRpc$({
  calls: ['parity_nodeHealth'],
  priority: [onEvery2Seconds$]
})(() =>
  getPriority(nodeHealth$).pipe(
    switchMapPromise(() => api().parity.nodeHealth()),
    distinctReplayRefCount(),
    addToOverview(nodeHealth$)
  )
);

/**
 * Post a transaction to the network.
 *
 * Calls, in this order, eth_estimateGas, parity_postTransaction,
 * parity_checkRequest and eth_getTransactionReceipt to get the status of the
 * transaction.
 *
 * @param {Object} tx - A transaction object.
 * @return {Observable<Object>} - The status of the transaction.
 */
export const post$ = tx => {
  const source$ = Observable.create(async observer => {
    try {
      observer.next({ estimating: null });
      const gas = await api().eth.estimateGas(tx);
      observer.next({ estimated: gas });
      const signerRequestId = await api().parity.postTransaction(tx);
      observer.next({ requested: signerRequestId });
      const transactionHash = await api().pollMethod(
        'parity_checkRequest',
        signerRequestId
      );
      if (tx.condition) {
        observer.next({ signed: transactionHash, schedule: tx.condition });
      } else {
        observer.next({ signed: transactionHash });
        const receipt = await api().pollMethod(
          'eth_getTransactionReceipt',
          transactionHash,
          receipt =>
            receipt && receipt.blockNumber && !receipt.blockNumber.eq(0)
        );
        observer.next({ confirmed: receipt });
      }

      observer.complete();
    } catch (error) {
      observer.next({ failed: error });
      observer.error(error);
    }
  }).pipe(distinctReplayRefCount(), addToOverview(post$));

  source$.subscribe(); // Run this Observable immediately;
  return source$;
};
post$.metadata = {
  calls: [
    'eth_estimateGas',
    'parity_postTransaction',
    'parity_checkRequest',
    'eth_getTransactionReceipt'
  ]
};

/**
 * Set a new default account for dapps.
 *
 * @param {String} value - The public address of the account to make default.
 * @return {Observable<Object>} - An empty Observable that completes when the
 * api calls succeeds.
 */
export const setDefaultAccount$ = value => {
  const source$ = Observable.create(async observer => {
    try {
      await api().parity.setNewDappsDefaultAddress(value);
      onAccountsChanged$.next();
      observer.complete();
    } catch (error) {
      observer.error(error);
    }
  }).pipe(distinctReplayRefCount(), addToOverview(setDefaultAccount$));

  source$.subscribe(); // Run this Observable immediately
  return source$;
};
setDefaultAccount$.metadata = { calls: ['parity_setNewDappsDefaultAddress'] };
