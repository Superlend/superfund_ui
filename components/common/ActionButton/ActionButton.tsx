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
    cta?: {
        text: string
        onClick: () => void
    }
}

const ActionButton = ({
    disabled = false,
    asset,
    amount,
    handleCloseModal,
    actionType,
    setActionType,
    walletAddress,
    cta,
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
                cta={cta}
            />
        )
    }

    if (actionType === 'withdraw') {
        return (
            <WithdrawButton
                disabled={disabled}
                handleCloseModal={handleCloseModal}
                walletAddress={walletAddress}
                asset={asset}
                amount={amount}
                cta={cta}
            />
        )
    }

    if (actionType === 'claim') {
        return (
            <ClaimRewardsButton
                disabled={disabled}
                handleCloseModal={handleCloseModal}
                rewardDetails={asset}
            />
        )
    }

    return null
}

export default ActionButton
