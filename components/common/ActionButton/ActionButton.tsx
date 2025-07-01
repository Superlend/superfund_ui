import WithdrawButton from '../WithdrawButton'
import { TActionType, TPositionType } from '@/types'
import DepositButton from '../DepositButton'
import ClaimRewardsButton from '../ClaimRewardsButton'
import TransferButton from '../TransferButton'

interface IActionButtonSelectComponent {
    disabled?: boolean
    asset: any
    amount: string
    handleCloseModal: (isVisible: boolean) => void
    actionType: TActionType
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

    if (actionType === 'transfer') {
        return (
            <TransferButton
                disabled={disabled}
                handleCloseModal={handleCloseModal}
                walletAddress={walletAddress}
                asset={asset}
                amount={amount}
                cta={cta}
            />
        )
    }
    return null
}

export default ActionButton
