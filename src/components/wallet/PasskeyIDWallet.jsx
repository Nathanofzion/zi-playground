import React, { useState, useEffect } from 'react';

export default function PasskeyIDWallet() {
    const registerPasskeyID = () => {
        console.log('registerPasskeyID');
    };
    return (
        <div
            style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '16px', cursor: 'pointer' }}
            onClick={registerPasskeyID}>
            <img
                src={'/img/img/passkey.png'}
                width={24}
                height={24}
                alt={'PasskeyID Wallet'}
            />
            <span>PasskeyID Wallet</span>
        </div>
    );
}
