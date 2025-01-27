import WithdrawButton from '../WithdrawButton'
import { TPositionType } from '@/types'
import DepositButton from '../DepositButton'

interface IActionButtonSelectComponent {
    disabled?: boolean
    asset: any
    amount: string
    handleCloseModal: (isVisible: boolean) => void
    actionType: 'deposit' | 'withdraw'
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
    return (
        <>
            <DepositButton
                disabled={disabled}
                handleCloseModal={handleCloseModal}
                walletAddress={walletAddress}
                poolContractAddress={asset?.core_contract || ''}
                underlyingAssetAdress={asset?.asset?.token?.address || ''}
                amount={amount || ''}
                decimals={asset?.asset?.token?.decimals || 0}
            />
        </>
    )
}

export default ActionButton
