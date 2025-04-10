import { requestIndexer } from './request'

export async function getEffectiveApy() {
    return requestIndexer<any>({
        method: 'GET',
        path: `vaults/state/0x10076ed296571cE4Fde5b1FDF0eB9014a880e47B/8453`,
    })
}
