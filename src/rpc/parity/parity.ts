// Copyright 2015-2018 Parity Technologies (UK) Ltd.
// This file is part of Parity.
//
// SPDX-License-Identifier: MIT

import { AccountsInfo } from '../../types';
import api from '../../api';
import createRpc$ from '../utils/createRpc';
import getFrequency from '../utils/getFrequency';
import {
  onAccountsInfoChanged$,
  onNodeHealthChanged$,
  onStartup$
} from '../../frequency';
import { switchMapPromise } from '../../utils/operators';

/**
 * Get accounts info. Calls `parity_accountsInfo`.
 *
 * @return {Observable<Object>} - An Observable containing all info that can be
 * accessed by user concerning accounts.
 */
export const accountsInfo$ = createRpc$<AccountsInfo>({
  calls: ['parity_accountsInfo'],
  frequency: [onAccountsInfoChanged$]
})(() => getFrequency(accountsInfo$));

/**
 * Get the name of the current chain. Calls `parity_netChain`.
 *
 * @return {Observable<String>} - An Observable containing the name of the
 * current chain.
 */
export const chainName$ = createRpc$<string>({
  calls: ['parity_netChain'],
  frequency: [onStartup$]
})(() =>
  getFrequency(chainName$).pipe(switchMapPromise(() => api().parity.netChain()))
);

/**
 * Get the node's health. Calls `parity_nodeHealth`.
 *
 * @return {Observable<Object>} - An Observable containing the health.
 */
export const nodeHealth$ = createRpc$<Object>({
  calls: ['parity_nodeHealth'],
  frequency: [onNodeHealthChanged$]
})(() => getFrequency(nodeHealth$));
