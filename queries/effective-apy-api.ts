import { requestIndexer } from './request'

export async function getEffectiveApy({
    vault_address,
    chain_id
}: {
    vault_address: `0x${string}`
    chain_id: number
}) {
    return requestIndexer<any>({
        method: 'GET',
        path: `vaults/state/${vault_address}/${chain_id}`,
    })
}
