// @ts-nocheck
import { getMessageCount } from '$lib/server/getLedgerEntries';
import type { LayoutServerLoad } from './$types';

export const load = async () => {
    return {
        messageCount: await getMessageCount(),
    };
};
;null as any as LayoutServerLoad;