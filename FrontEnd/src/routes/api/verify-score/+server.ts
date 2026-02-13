import { json, type RequestEvent } from '@sveltejs/kit';
import { type Hex, keccak256, encodePacked } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
// import * as snarkjs from 'snarkjs';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import vKey from '$lib/zk/verification_key.json';

// SERVER WALLET (Oracle)
// GUID: Use a secure environment variable for this in production!
// For development, we can use a generated one or the user's dev wallet.
const PRIVATE_KEY = process.env.ORACLE_PRIVATE_KEY || '0x1e2f25281ecd844abb64843d9833efbe36a1ad72af92625641f44ed666444217';
const account = privateKeyToAccount(PRIVATE_KEY as Hex);

export async function POST({ request }: RequestEvent) {
    // Lazy load snarkjs to avoid build-time issues with web-worker
    const require = createRequire(import.meta.url);
    const snarkjs = require('snarkjs');
    try {
        const body = await request.json();
        const { proof, publicSignals, address, reliability } = body;

        if (!proof || !publicSignals || !address || reliability === undefined) {
            return json({ error: 'Missing required parameters' }, { status: 400 });
        }

        // ... (Verification logic stays same)
        const isValid = await snarkjs.groth16.verify(vKey, publicSignals, proof);

        if (!isValid) {
            return json({ error: 'Invalid Zero-Knowledge Proof' }, { status: 403 });
        }

        const verifiedScore = BigInt(publicSignals[0]);
        console.log(`Verified Score for ${address}: ${verifiedScore} (Reliability: ${reliability})`);

        // 4. Sign the Score + Reliability (Oracle)
        // Message: keccak256(packed(address, score, reliability))
        const messageHash = keccak256(
            encodePacked(
                ['address', 'uint256', 'uint256'],
                [address as Hex, verifiedScore, BigInt(reliability)]
            )
        );

        const signature = await account.signMessage({
            message: { raw: messageHash }
        });

        return json({
            success: true,
            score: verifiedScore.toString(),
            signature
        });

    } catch (error: any) {
        console.error('ZK Verification Error:', error);
        return json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
