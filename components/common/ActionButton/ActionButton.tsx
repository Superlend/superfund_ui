import WithdrawButton from '../WithdrawButton'
import { TPositionType } from '@/types'
import DepositButton from '../DepositButton'
import ClaimRewardsButton from '../ClaimRewardsButton'

interface IActionButtonSelectComponent {
    disabled?: boolean
    asset: any
    amount: string
    handleCloseModal: (isVisible: boolean) => void
    actionType: 'deposit' | 'withdraw' | 'claim'
    setActionType?: (actionType: TPositionType) => void
    walletAddress: `0x${string}`
}

const ActionButton = ({
    disabled = false,
    asset,
    amount,
    handleCloseModal,
    actionType,
    setActionType,
    walletAddress,
}: IActionButtonSelectComponent) => {

    if (actionType === 'deposit') {
        return (
            <DepositButton
                disabled={disabled}
                handleCloseModal={handleCloseModal}
                walletAddress={walletAddress}
                poolContractAddress={asset?.core_contract || ''}
                underlyingAssetAdress={asset?.asset?.token?.address || ''}
                amount={amount || ''}
                decimals={asset?.asset?.token?.decimals || 0}
            />
        )
    }

    if (actionType === 'withdraw') {
        return (
            <WithdrawButton
                disabled={disabled}
                handleCloseModal={handleCloseModal}
                asset={asset}
                amount={amount}
            />
        )
    }

    if (actionType === 'claim') {
        return (
            <ClaimRewardsButton
                disabled={disabled}
                handleCloseModal={handleCloseModal}
                asset={asset}
            />
        )
    }

    return null
}

export default ActionButton
