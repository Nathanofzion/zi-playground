// @ts-nocheck
import { getAllMessages } from '$lib/server/getLedgerEntries';
import type { PageServerLoad } from './$types';

export const load = async ({ parent }: Parameters<PageServerLoad>[0]) => {
    const { messageCount } = await parent();
    return {
        messages: await getAllMessages(messageCount),
    };
};
