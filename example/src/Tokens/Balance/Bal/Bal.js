// Copyright 2015-2018 Parity Technologies (UK) Ltd.
// This file is part of Parity.

// SPDX-License-Identifier: MIT

import React, { Component } from 'react';

import light from '../../../hoc';
import { balanceOf$, defaultAccount$, nodeHealth$ } from '../../../light.js';

@light({
  balanceOf: ownProps => balanceOf$(ownProps.address),
  defaultAccount: defaultAccount$
  // nodeHealth: nodeHealth$,
  // nodeHealth2: nodeHealth$
})
class Bal extends Component {
  render() {
    const { balanceOf, defaultAccount, nodeHealth } = this.props;
    return (
      <div>
        <p>balanceOf: {balanceOf}</p>
        <p>nodeHealth: {JSON.stringify(nodeHealth)}</p>
        <p>defaultAccount: {defaultAccount}</p>
      </div>
    );
  }
}

export default Bal;